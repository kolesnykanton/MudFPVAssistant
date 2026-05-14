import { useState, useMemo } from 'react';
import {
  Paper,
  TextInput,
  Chip,
  Group,
  Stack,
  ScrollArea,
  UnstyledButton,
  Text,
  Title,
  ActionIcon,
  useComputedColorScheme,
} from '@mantine/core';
import { IconSearch, IconEdit, IconTrash, IconNavigation } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import type { FlightSpot, WithId } from '../../types';
import { SPOT_CATEGORIES, CATEGORY_COLORS } from '../../types';
import { openGoogleMaps } from '../../utils/navigation';

interface SpotsListPanelProps {
  spots: WithId<FlightSpot>[];
  onLocate: (spot: WithId<FlightSpot>) => void;
  onEdit: (spot: WithId<FlightSpot>) => void;
  onDelete: (spot: WithId<FlightSpot>) => void;
  onClose?: () => void;
}

export function SpotsListPanel({ spots, onLocate, onEdit, onDelete, onClose }: SpotsListPanelProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const colorScheme = useComputedColorScheme('light');
  const hoverBg = colorScheme === 'dark' ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)';

  const filteredSpots = useMemo(() => {
    const queryLower = debouncedQuery.toLowerCase();
    return spots.filter(spot => {
      const nameMatch = spot.name.toLowerCase().includes(queryLower);
      const tagsMatch = spot.tags.some(tag => tag.toLowerCase().includes(queryLower));
      const commentsMatch = spot.comments?.toLowerCase().includes(queryLower) ?? false;
      const textMatch = nameMatch || tagsMatch || commentsMatch;

      if (!textMatch) return false;
      if (categoryFilter && spot.category !== categoryFilter) return false;
      return true;
    });
  }, [spots, debouncedQuery, categoryFilter]);

  const formatCoords = (lat: number, lng: number) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  return (
    <Paper p="md" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Group justify="space-between" mb="md">
        <Title order={4}>Spots ({filteredSpots.length})</Title>
        {onClose && (
          <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Close panel">
            ✕
          </ActionIcon>
        )}
      </Group>

      <TextInput
        placeholder="Search spots..."
        leftSection={<IconSearch size={14} />}
        value={query}
        onChange={e => setQuery(e.currentTarget.value)}
        size="sm"
        mb="sm"
      />

      <Group gap="xs" mb="sm">
        <Chip
          key="all"
          value="all"
          checked={categoryFilter === null}
          onChange={() => setCategoryFilter(null)}
          size="xs"
        >
          All
        </Chip>
        {SPOT_CATEGORIES.map(cat => (
          <Chip
            key={cat}
            value={cat}
            checked={categoryFilter === cat}
            onChange={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            size="xs"
          >
            {cat}
          </Chip>
        ))}
      </Group>

      <ScrollArea flex={1} type="auto">
        {filteredSpots.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            {spots.length === 0 ? 'No spots saved yet.' : 'No spots match your search.'}
          </Text>
        ) : (
          <Stack gap="xs">
            {filteredSpots.map(spot => (
              <div
                key={spot.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--mantine-radius-sm)',
                  padding: 'var(--mantine-spacing-sm)',
                  transition: 'background-color 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <UnstyledButton
                  onClick={() => onLocate(spot)}
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Group gap="xs" flex={1}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: spot.category ? CATEGORY_COLORS[spot.category] : '#ccc',
                        flexShrink: 0,
                      }}
                    />
                    <Stack gap={2} flex={1}>
                      <Text size="sm" fw={500}>
                        {spot.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {spot.category && `${spot.category} · `}
                        {formatCoords(spot.latitude, spot.longitude)}
                      </Text>
                    </Stack>
                  </Group>
                </UnstyledButton>
                <Group gap={2} style={{ flexShrink: 0 }}>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="teal"
                    onClick={() => openGoogleMaps(spot.latitude, spot.longitude)}
                    aria-label="Navigate to spot"
                    title="Navigate via Google Maps"
                  >
                    <IconNavigation size={14} />
                  </ActionIcon>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="blue"
                    onClick={() => onEdit(spot)}
                    aria-label="Edit spot"
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={() => onDelete(spot)}
                    aria-label="Delete spot"
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </div>
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Paper>
  );
}
