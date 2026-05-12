import { ActionIcon, Badge, Group, Menu, Paper, Text } from '@mantine/core';
import { IconClock, IconDotsVertical, IconEdit, IconMapPin, IconTrash } from '@tabler/icons-react';
import { CATEGORY_COLORS } from '../../types';
import type { FlightSpot, FlightInfo, WithId } from '../../types';

interface FlightCardProps {
  flight: WithId<FlightInfo>;
  spot?: WithId<FlightSpot>;
  onEdit: (flight: WithId<FlightInfo>) => void;
  onDelete: (id: string) => void;
}

export default function FlightCard({ flight, spot, onEdit, onDelete }: FlightCardProps) {
  const dateLabel = flight.date
    ? new Date(flight.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';
  const locationLabel = (spot?.name ?? flight.location) || '—';
  const categoryColor = spot?.category ? (CATEGORY_COLORS[spot.category] ?? undefined) : undefined;

  return (
    <Paper withBorder radius="md" p="sm">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group wrap="nowrap" align="flex-start" gap="sm" style={{ flex: 1, minWidth: 0 }}>
          <Badge variant="outline" size="sm" style={{ flexShrink: 0 }}>{dateLabel}</Badge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {flight.name}
            </Text>
            <Group gap={4} wrap="nowrap" mt={2}>
              <IconMapPin size={12} style={{ flexShrink: 0, color: categoryColor ?? 'var(--mantine-color-dimmed)' }} />
              <Text size="xs" c="dimmed" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {locationLabel}
              </Text>
              {flight.flightTime && (
                <>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>·</Text>
                  <IconClock size={12} style={{ flexShrink: 0 }} />
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{flight.flightTime}</Text>
                </>
              )}
              {flight.usedMah != null && (
                <>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>·</Text>
                  <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{flight.usedMah} mAh</Text>
                </>
              )}
            </Group>
            <Text size="xs" c="dimmed" mt={2}>{flight.batType} {flight.cellCount}S</Text>
          </div>
        </Group>

        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle" size="sm" aria-label="Flight actions">
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(flight)}>
              Edit
            </Menu.Item>
            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => onDelete(flight.id)}>
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Paper>
  );
}
