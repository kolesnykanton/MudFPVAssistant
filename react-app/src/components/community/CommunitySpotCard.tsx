import { Paper, Group, Stack, Text, ActionIcon, Avatar, Badge, Button } from '@mantine/core';
import { IconHeart, IconHeartFilled, IconMapPin } from '@tabler/icons-react';
import { CATEGORY_COLORS } from '../../types';
import type { CommunitySpot, WithId } from '../../types';

interface Props {
  spot: WithId<CommunitySpot>;
  isFavorited: boolean;
  isOwnSpot: boolean;
  isCloning: boolean;
  isFavoriting?: boolean;
  isAlreadyCloned?: boolean;
  onFavoriteToggle: (spotId: string) => Promise<void>;
  onClone: (spot: WithId<CommunitySpot>) => void;
  onLocate?: (spot: WithId<CommunitySpot>) => void;
}

export function CommunitySpotCard({
  spot, isFavorited, isOwnSpot, isCloning, isFavoriting, isAlreadyCloned, onFavoriteToggle, onClone, onLocate,
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
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
              <Group gap={6} align="center">
                <Text fw={600} size="sm" truncate>{spot.name}</Text>
                {isOwnSpot && (
                  <Badge size="xs" variant="light" color="blue">Your spot</Badge>
                )}
              </Group>
              {spot.category && (
                <Badge
                  size="xs"
                  color={categoryColor}
                  variant="filled"
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
                loading={isFavoriting}
                disabled={isFavoriting}
                onClick={() => onFavoriteToggle(spot.id!)}
                aria-label={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
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

          {!isOwnSpot && (
            <Button
              size="xs"
              fullWidth
              loading={isCloning}
              disabled={isAlreadyCloned}
              onClick={() => onClone(spot)}
            >
              {isAlreadyCloned ? 'Already saved' : 'Save to my spots'}
            </Button>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
