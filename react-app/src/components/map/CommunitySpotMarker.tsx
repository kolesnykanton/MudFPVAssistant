import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Avatar, Stack, Text, Group, Button, ActionIcon, Anchor } from '@mantine/core';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { CATEGORY_COLORS } from '../../types';
import type { CommunitySpot, WithId } from '../../types';
import droneIconUrl from '../../assets/drone-icon.svg';
import { openGoogleMaps, openAppleMaps } from '../../utils/navigation';

const communityIconCache = new Map<string, L.DivIcon>();

function makeIcon(category: string | undefined): L.DivIcon {
  const key = `community-${category ?? ''}`;
  const cached = communityIconCache.get(key);
  if (cached) return cached;

  const colour = category ? CATEGORY_COLORS[category] : '#888';

  const html = `
    <div style="position:relative;width:28px;height:28px;overflow:visible;">
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:${colour};border:2px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        outline: 2px solid ${colour}; outline-offset: 2px;">
        <img src="${droneIconUrl}" width="16" height="16" style="filter:brightness(0) invert(1);" alt="" />
      </div>
    </div>`;

  const icon = L.divIcon({
    html,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  communityIconCache.set(key, icon);
  return icon;
}

interface Props {
  spot: WithId<CommunitySpot>;
  isFavorited: boolean;
  isOwnSpot: boolean;
  isCloning: boolean;
  isFavoriting?: boolean;
  isAlreadyCloned?: boolean;
  onFavoriteToggle: (spotId: string) => Promise<void>;
  onClone: (spot: WithId<CommunitySpot>) => void;
}

export function CommunitySpotMarker({
  spot, isFavorited, isOwnSpot, isCloning, isFavoriting, isAlreadyCloned, onFavoriteToggle, onClone,
}: Props) {
  const icon = useMemo(() => makeIcon(spot.category), [spot.category]);

  const categoryColor = spot.category ? CATEGORY_COLORS[spot.category] : undefined;

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
    >
      <Popup minWidth={220}>
        <div style={{ fontFamily: 'inherit' }}>
          <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            {spot.name}
            {categoryColor && spot.category && (
              <span style={{
                fontSize: 10, background: categoryColor, color: 'white',
                padding: '1px 6px', borderRadius: 8,
              }}>
                {spot.category}
              </span>
            )}
          </div>

          <Group gap={6} mb={8} align="center">
            <Avatar size={28} name={spot.ownerName} src={spot.ownerPhotoUrl} />
            <Stack gap={0}>
              <Text size="xs" fw={500}>{spot.ownerName}</Text>
              <Text size="xs" c="dimmed">❤ {spot.favoriteCount}</Text>
            </Stack>
          </Group>

          <Group gap={4} mb={8}>
            <ActionIcon
              size="sm"
              variant="light"
              color="red"
              loading={isFavoriting}
              disabled={isFavoriting}
              aria-label={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
              onClick={() => onFavoriteToggle(spot.id!)}
            >
              {isFavorited ? <IconHeartFilled size={14} /> : <IconHeart size={14} />}
            </ActionIcon>
            {!isOwnSpot && (
              <Button
                size="xs"
                variant="light"
                loading={isCloning}
                disabled={isAlreadyCloned}
                onClick={() => onClone(spot)}
                style={{ flex: 1 }}
              >
                {isAlreadyCloned ? 'Already saved' : 'Save to my spots'}
              </Button>
            )}
          </Group>

          <Group gap={6} mt={8} style={{ borderTop: '1px solid var(--mantine-color-gray-3)', paddingTop: 8 }}>
            <Anchor
              size="xs"
              fw={600}
              style={{ flex: 1, textAlign: 'center' }}
              onClick={() => openGoogleMaps(spot.latitude, spot.longitude)}
            >
              Google Maps ↗
            </Anchor>
            <Anchor
              size="xs"
              fw={600}
              style={{ flex: 1, textAlign: 'center' }}
              onClick={() => openAppleMaps(spot.latitude, spot.longitude)}
            >
              Apple Maps ↗
            </Anchor>
          </Group>
        </div>
      </Popup>
    </Marker>
  );
}
