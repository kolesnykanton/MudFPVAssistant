import { useState } from 'react';
import { ActionIcon, Paper, ScrollArea, Table, Text, Title } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { FlightInfo } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface FlightTableProps {
  flights: FlightInfo[];
  selectedDate: string | null; // "YYYY-MM-DD" or null
  onDelete: (id: string) => void;
}

export default function FlightTable({ flights, selectedDate, onDelete }: FlightTableProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingFlight = pendingDeleteId
    ? flights.find(f => f.id === pendingDeleteId) ?? null
    : null;

  const filtered = selectedDate
    ? flights.filter(f => f.date?.split('T')[0] === selectedDate)
    : flights;

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  return (
    <Paper withBorder p="md" radius="md">
      <Title order={5} mb="sm">
        Flight History {selectedDate ? `— ${selectedDate}` : '(all)'}
      </Title>

      {sorted.length === 0 ? (
        <Text c="dimmed" py="sm">
          No flights found{selectedDate ? ' for this date' : ''}.
        </Text>
      ) : (
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
                <Table.Th>Delete</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sorted.map(flight => (
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
                    <ActionIcon
                      size="sm"
                      color="red"
                      variant="subtle"
                      onClick={() => flight.id && setPendingDeleteId(flight.id)}
                      disabled={!flight.id}
                      aria-label="Delete flight"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete flight"
        message={
          pendingFlight
            ? `Delete the flight "${pendingFlight.name}"${pendingFlight.date ? ` from ${pendingFlight.date}` : ''}? This cannot be undone.`
            : 'Delete this flight? This cannot be undone.'
        }
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
