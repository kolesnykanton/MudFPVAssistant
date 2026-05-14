import { Paper, Group, Stack, Text, ActionIcon, Avatar, Badge, Button } from '@mantine/core';
import { IconHeart, IconHeartFilled, IconMapPin } from '@tabler/icons-react';
import { CATEGORY_COLORS } from '../../types';
import type { CommunitySpot, WithId } from '../../types';

interface Props {
  spot: WithId<CommunitySpot>;
  isFavorited: boolean;
  onFavoriteToggle: (spotId: string) => Promise<void>;
  onClone: (spot: WithId<CommunitySpot>) => void;
  onLocate?: (spot: WithId<CommunitySpot>) => void;
}

export function CommunitySpotCard({
  spot, isFavorited, onFavoriteToggle, onClone, onLocate,
}: Props) {
  const categoryColor = spot.category ? CATEGORY_COLORS[spot.category] : undefined;

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      style={{ transition: 'box-shadow 120ms' }}
      styles={{ root: { '&:hover': { boxShadow: 'var(--mantine-shadow-sm)' } } }}
    >
      <Group gap="sm" align="flex-start" wrap="nowrap">
        {spot.photoUrl && (
          <img
            src={spot.photoUrl}
            alt=""
            style={{
              width: 72,
              height: 72,
              borderRadius: 8,
              objectFit: 'cover',
              flexShrink: 0,
              background: 'var(--mantine-color-gray-1)',
            }}
          />
        )}

        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text fw={600} size="sm" truncate>{spot.name}</Text>
              {spot.category && (
                <Badge
                  size="xs"
                  style={{ backgroundColor: categoryColor }}
                  mt={4}
                >
                  {spot.category}
                </Badge>
              )}
            </div>
            <Group gap={4}>
              {onLocate && (
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={() => onLocate(spot)}
                  aria-label="Show on map"
                  title="Show on map"
                >
                  <IconMapPin size={16} />
                </ActionIcon>
              )}
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                onClick={() => onFavoriteToggle(spot.id!)}
              >
                {isFavorited ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
              </ActionIcon>
            </Group>
          </Group>

          <Group gap={4} align="center">
            <Avatar size={24} name={spot.ownerName} src={spot.ownerPhotoUrl} />
            <div style={{ flex: 1 }}>
              <Text size="xs" c="dimmed">{spot.ownerName}</Text>
              <Text size="xs" c="dimmed" fw={500}>
                ❤ {spot.favoriteCount}
              </Text>
            </div>
          </Group>

          <Button
            size="xs"
            fullWidth
            onClick={() => onClone(spot)}
          >
            Save to my spots
          </Button>
        </Stack>
      </Group>
    </Paper>
  );
}
