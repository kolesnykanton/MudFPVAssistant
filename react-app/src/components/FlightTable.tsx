import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon, Group, Pagination, Paper, ScrollArea, Stack, Table, Text, TextInput, Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react';
import type { FlightInfo, WithId } from '../types';
import ConfirmDialog from './ConfirmDialog';
import FlightInfoEditDialog from './FlightInfoEditDialog';

const PAGE_SIZE = 20;

interface FlightTableProps {
  flights: WithId<FlightInfo>[];
  selectedDate: string | null;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Omit<FlightInfo, 'id'>>) => Promise<void>;
}

export default function FlightTable({ flights, selectedDate, onDelete, onUpdate }: FlightTableProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingFlight, setEditingFlight] = useState<WithId<FlightInfo> | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const [page, setPage] = useState(1);

  const pendingFlight = pendingDeleteId
    ? flights.find(f => f.id === pendingDeleteId) ?? null
    : null;

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [selectedDate, debouncedSearch]);

  const filtered = useMemo(() => {
    let rows = selectedDate
      ? flights.filter(f => f.date?.split('T')[0] === selectedDate)
      : flights;
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter(f =>
        (f.name?.toLowerCase().includes(q) ?? false) ||
        (f.location?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...rows].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  }, [flights, selectedDate, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb="sm" wrap="nowrap">
        <Title order={5}>
          Flight History {selectedDate ? `— ${selectedDate}` : '(all)'}
        </Title>
        <TextInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or location"
          size="xs"
          leftSection={<IconSearch size={14} />}
          aria-label="Search flights"
          maw={240}
        />
      </Group>

      {filtered.length === 0 ? (
        <Text c="dimmed" py="sm">
          No flights found{selectedDate ? ' for this date' : ''}{debouncedSearch ? ' matching your search' : ''}.
        </Text>
      ) : (
        <Stack gap="sm">
          <ScrollArea>
            <Table striped highlightOnHover withTableBorder withColumnBorders fz="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Time</Table.Th>
                  <Table.Th>mAh</Table.Th>
                  <Table.Th>Cells</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Comment</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pageRows.map(flight => (
                  <Table.Tr key={flight.id}>
                    <Table.Td>{flight.date ?? '—'}</Table.Td>
                    <Table.Td>{flight.name}</Table.Td>
                    <Table.Td>{flight.location}</Table.Td>
                    <Table.Td>{flight.flightTime ?? '—'}</Table.Td>
                    <Table.Td>{flight.usedMah ?? '—'}</Table.Td>
                    <Table.Td>{flight.cellCount}S</Table.Td>
                    <Table.Td>{flight.batType}</Table.Td>
                    <Table.Td
                      style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {flight.comment ?? '—'}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => setEditingFlight(flight)}
                          aria-label="Edit flight"
                        >
                          <IconEdit size={14} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          color="red"
                          variant="subtle"
                          onClick={() => setPendingDeleteId(flight.id)}
                          aria-label="Delete flight"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {totalPages > 1 && (
            <Group justify="space-between" wrap="nowrap">
              <Text size="xs" c="dimmed">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </Text>
              <Pagination
                value={safePage}
                onChange={setPage}
                total={totalPages}
                size="sm"
              />
            </Group>
          )}
        </Stack>
      )}

      <FlightInfoEditDialog
        open={editingFlight !== null}
        flight={editingFlight}
        onSave={onUpdate}
        onClose={() => setEditingFlight(null)}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete flight"
        message={`Delete the flight "${pendingFlight?.name ?? ''}"${pendingFlight?.date ? ` from ${pendingFlight.date}` : ''}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (pendingDeleteId) onDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onClose={() => setPendingDeleteId(null)}
      />
    </Paper>
  );
}
