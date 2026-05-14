import { useState } from 'react';
import { Paper, Group, Stack, Text, ActionIcon, Avatar, Badge, Button } from '@mantine/core';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { CATEGORY_COLORS } from '../../types';
import type { CommunitySpot, WithId } from '../../types';

interface Props {
  spot: WithId<CommunitySpot>;
  isFavorited: boolean;
  onFavoriteToggle: (spotId: string) => Promise<void>;
  onClone: (spot: WithId<CommunitySpot>) => void;
}

export function CommunitySpotCard({
  spot, isFavorited, onFavoriteToggle, onClone,
}: Props) {
  const categoryColor = spot.category ? CATEGORY_COLORS[spot.category] : undefined;
  const [hovered, setHovered] = useState(false);

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      shadow={hovered ? 'sm' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text fw={600} size="sm">{spot.name}</Text>
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
          <ActionIcon
            variant="light"
            color="red"
            size="sm"
            onClick={() => onFavoriteToggle(spot.id!)}
          >
            {isFavorited ? <IconHeartFilled size={16} /> : <IconHeart size={16} />}
          </ActionIcon>
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
    </Paper>
  );
}
