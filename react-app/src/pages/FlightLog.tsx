import { useMemo, useState } from 'react';
import {
  ActionIcon, Affix, Alert, Box, Button, Collapse, Group,
  Modal, Skeleton, Stack, Text, TextInput, Title, Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { DatePicker } from '@mantine/dates';
import {
  IconCalendar, IconCalendarOff, IconChartBar, IconCirclePlus,
  IconDatabaseImport, IconSearch, IconUpload, IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import type { FlightInfo as FlightInfoType, WithId } from '../types';
import FlightTable from '../components/FlightTable';
import FlightCard from '../components/flights/FlightCard';
import AddFlightModal from '../components/flights/AddFlightModal';
import BatchImportModal from '../components/flights/BatchImportModal';
import FlightInfoEditDialog from '../components/FlightInfoEditDialog';
import ConfirmDialog from '../components/ConfirmDialog';

const isDev = import.meta.env.DEV;

export default function FlightLog() {
  const { flights, spots, flightsLoading, addFlight, updateFlight, deleteFlight } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const spotFilter = searchParams.get('spotId');
  const highlightId = searchParams.get('highlight');
  const filterSpot = spotFilter ? spots.find(s => s.id === spotFilter) : undefined;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState('');
  const [editingFlight, setEditingFlight] = useState<WithId<FlightInfoType> | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 640px)') ?? true;

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { default: seedData } = await import('../dev/test-flights.json');
      for (const flight of seedData) {
        await addFlight(flight as FlightInfoType);
      }
      notifications.show({ color: 'green', message: `${seedData.length} test flights added.` });
    } catch {
      notifications.show({ color: 'red', message: 'Seeding failed.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleAdd = async (flight: Omit<FlightInfoType, 'id'>) => {
    await addFlight(flight);
    notifications.show({ color: 'green', message: 'Flight added.' });
    setAddModalOpen(false);
  };

  const handleUpdate = async (id: string, data: Partial<Omit<FlightInfoType, 'id'>>) => {
    await updateFlight(id, data);
    notifications.show({ color: 'green', message: 'Flight updated.' });
  };

  const handleDeleteConfirmed = async (id: string) => {
    try {
      await deleteFlight(id);
      notifications.show({ color: 'green', message: 'Flight deleted.' });
    } catch {
      notifications.show({ color: 'red', message: 'Failed to delete flight. Please try again.' });
    }
  };

  const flightCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    flights.forEach(f => {
      if (f.date) {
        const d = f.date.split('T')[0];
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return counts;
  }, [flights]);

  const spotFilteredFlights = spotFilter
    ? flights.filter(f => f.spotId === spotFilter)
    : flights;

  const mobileVisibleFlights = useMemo(() => {
    let result = spotFilteredFlights;
    if (selectedDate) {
      result = result.filter(f => f.date?.split('T')[0] === selectedDate);
    }
    if (mobileSearch.trim()) {
      const q = mobileSearch.toLowerCase();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [spotFilteredFlights, selectedDate, mobileSearch]);

  const selectedDateLabel = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const renderDayCell = (dateStr: string) => {
    const key = dateStr.split('T')[0];
    const count = flightCountByDate[key] ?? 0;
    const day = new Date(dateStr).getUTCDate();
    const bg =
      count === 0 ? 'transparent'
      : count === 1 ? 'rgba(34,139,230,0.20)'
      : count === 2 ? 'rgba(34,139,230,0.45)'
      :               'rgba(34,139,230,0.72)';
    return (
      <Tooltip label={`${count} flight${count !== 1 ? 's' : ''}`} disabled={count === 0} withArrow>
        <div style={{ width: '100%', height: '100%', borderRadius: 4, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {day}
        </div>
      </Tooltip>
    );
  };

  return (
    <Box>
      {/* Page header */}
      <Group justify="space-between" mb="md" wrap="nowrap">
        <Title order={2}>Flight Log</Title>
        <Group gap="xs" wrap="nowrap">
          {isDev && (
            <Tooltip label="Seeds full test dataset (dev only)">
              <Button size="xs" variant="light" color="grape" leftSection={<IconDatabaseImport size={14} />} loading={seeding} onClick={handleSeed}>
                Seed
              </Button>
            </Tooltip>
          )}
          <Tooltip label="Batch import">
            <ActionIcon variant="light" onClick={() => setImportModalOpen(true)} aria-label="Batch import flights">
              <IconUpload size={16} />
            </ActionIcon>
          </Tooltip>
          <Button component={Link} to="/flights/stats" variant="subtle" leftSection={<IconChartBar size={16} />} size="sm" visibleFrom="sm">
            Stats
          </Button>
          <Button leftSection={<IconCirclePlus size={16} />} onClick={() => setAddModalOpen(true)} size="sm" visibleFrom="sm">
            Log Flight
          </Button>
        </Group>
      </Group>

      {/* Spot filter alert */}
      {spotFilter && (
        <Alert color="blue" variant="light" withCloseButton onClose={() => setSearchParams({})} closeButtonLabel="Clear filter" mb="md">
          Showing flights at <strong>{filterSpot?.name ?? spotFilter}</strong>
        </Alert>
      )}

      {/* Filter bar */}
      <Group mb="sm" gap="xs">
        <Tooltip label={calendarOpen ? 'Hide calendar' : 'Show calendar'}>
          <ActionIcon
            variant={calendarOpen ? 'filled' : 'light'}
            onClick={() => setCalendarOpen(v => !v)}
            aria-label="Toggle calendar filter"
          >
            {calendarOpen ? <IconCalendarOff size={16} /> : <IconCalendar size={16} />}
          </ActionIcon>
        </Tooltip>
        {selectedDateLabel && (
          <Button
            variant="light"
            size="xs"
            rightSection={<IconX size={12} />}
            onClick={() => setSelectedDate(null)}
          >
            {selectedDateLabel}
          </Button>
        )}
      </Group>

      {flightsLoading ? (
        <Stack gap="xs">
          {/* Table header skeleton */}
          <Group gap="sm" wrap="nowrap" px="xs">
            {[24, 18, 14, 10, 8].map((w, i) => (
              <Skeleton key={i} height={12} width={`${w}%`} radius="xl" />
            ))}
          </Group>
          {/* Table row skeletons */}
          {Array.from({ length: 8 }, (_, i) => (
            <Group key={i} gap="sm" wrap="nowrap" px="xs" py={6}
              style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
              {[22, 16, 13, 9, 7].map((w, j) => (
                <Skeleton key={j} height={14} width={`${w + (i % 3)}%`} radius="xl" />
              ))}
            </Group>
          ))}
        </Stack>
      ) : (
        <>
          {/* Desktop: collapsible calendar + full table */}
          {isDesktop && (
            <>
              <Collapse expanded={calendarOpen}>
                <Box mb="md">
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    renderDay={renderDayCell}
                  />
                </Box>
              </Collapse>
              <FlightTable
                flights={spotFilteredFlights}
                selectedDate={selectedDate}
                highlightId={highlightId}
                onDelete={handleDeleteConfirmed}
                onUpdate={handleUpdate}
              />
            </>
          )}

          {/* Mobile: search + date modal + card list */}
          {!isDesktop && (
            <>
              <TextInput
                placeholder="Search flights…"
                leftSection={<IconSearch size={16} />}
                value={mobileSearch}
                onChange={e => setMobileSearch(e.target.value)}
                mb="sm"
                size="sm"
              />

              <Modal
                opened={calendarOpen && !isDesktop}
                onClose={() => setCalendarOpen(false)}
                title="Filter by date"
                size="sm"
              >
                <DatePicker
                  value={selectedDate}
                  onChange={(v) => { setSelectedDate(v); setCalendarOpen(false); }}
                  renderDay={renderDayCell}
                />
              </Modal>

              {mobileVisibleFlights.length === 0 ? (
                <Text c="dimmed" ta="center" mt="xl">No flights found.</Text>
              ) : (
                <Stack gap="xs">
                  {mobileVisibleFlights.map(f => (
                    <FlightCard
                      key={f.id}
                      flight={f}
                      spot={spots.find(s => s.id === f.spotId)}
                      onEdit={setEditingFlight}
                      onDelete={setPendingDeleteId}
                    />
                  ))}
                </Stack>
              )}

              <FlightInfoEditDialog
                open={editingFlight !== null}
                flight={editingFlight}
                onSave={handleUpdate}
                onClose={() => setEditingFlight(null)}
              />
              <ConfirmDialog
                open={pendingDeleteId !== null}
                title="Delete flight"
                message="This flight will be permanently deleted."
                confirmLabel="Delete"
                danger
                onConfirm={async () => {
                  if (pendingDeleteId) await handleDeleteConfirmed(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
                onClose={() => setPendingDeleteId(null)}
              />
            </>
          )}
        </>
      )}

      {/* FAB for mobile */}
      <Affix position={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 16px)', right: 16 }} hiddenFrom="sm">
        <ActionIcon
          size={56}
          radius="xl"
          variant="filled"
          color="blue"
          aria-label="Log flight"
          onClick={() => setAddModalOpen(true)}
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        >
          <IconCirclePlus size={28} />
        </ActionIcon>
      </Affix>

      <AddFlightModal opened={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAdd} />
      <BatchImportModal opened={importModalOpen} onClose={() => setImportModalOpen(false)} />
    </Box>
  );
}
