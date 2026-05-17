import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlayerSkipBack, IconPlayerPlay, IconPlayerPause, IconPlayerSkipForward } from '@tabler/icons-react';
import type { RadarFrame } from '../../hooks/useWeatherRadar';

interface WeatherAnimationControlProps {
  frames: RadarFrame[];
  currentIndex: number;
  isPlaying: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
}

export const WeatherAnimationControl = ({
  frames,
  currentIndex,
  isPlaying,
  onPrev,
  onNext,
  onTogglePlay,
}: WeatherAnimationControlProps) => {
  const isMobile = useMediaQuery('(max-width: 48em)', true);

  if (frames.length === 0) return null;

  const nowTs = Date.now() / 1000;
  const frameTs = frames[currentIndex]?.time ?? nowTs;
  const offsetSec = frameTs - nowTs;

  const frameTime = new Date(frameTs * 1000);
  const timeStr = frameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let badge: { label: string; color: string };
  if (offsetSec > 60) {
    badge = { label: 'FCST', color: 'blue' };
  } else if (offsetSec < -(8 * 60)) {
    badge = { label: 'PAST', color: 'gray' };
  } else {
    badge = { label: 'NOW', color: 'green' };
  }

  return (
    <Group
      style={{
        position: 'absolute',
        bottom: '16px',
        left: isMobile ? '8px' : '56px',
        zIndex: 998,
        backgroundColor: '#fff',
        borderRadius: '6px',
        padding: isMobile ? '6px 8px' : '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        pointerEvents: 'auto',
      }}
      gap={isMobile ? 4 : 8}
      align="center"
      wrap="nowrap"
    >
      <Button
        variant="light"
        size="xs"
        onClick={onPrev}
        leftSection={<IconPlayerSkipBack size={16} />}
        disabled={currentIndex === 0}
        px={6}
      />

      <Button
        variant={isPlaying ? 'filled' : 'light'}
        size="xs"
        onClick={onTogglePlay}
        leftSection={isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
        px={6}
      />

      <Button
        variant="light"
        size="xs"
        onClick={onNext}
        leftSection={<IconPlayerSkipForward size={16} />}
        disabled={currentIndex === frames.length - 1}
        px={6}
      />

      <Stack gap={2} ml={isMobile ? 2 : 6}>
        <Group gap={4} align="center" wrap="nowrap">
          <Text size="xs" fw={600} style={{ fontFamily: 'monospace' }}>
            {timeStr}
          </Text>
          <Badge size="xs" color={badge.color} variant="filled" radius="sm" px={4}>
            {badge.label}
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" style={{ fontSize: '10px' }}>
          {currentIndex + 1}/{frames.length}
        </Text>
      </Stack>
    </Group>
  );
};
