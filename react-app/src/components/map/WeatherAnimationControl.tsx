import { Button, Group, Stack, Text } from '@mantine/core';
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
  if (frames.length === 0) return null;

  const minutesOffset = Math.round(
    (frames[currentIndex]?.time - frames[frames.length - 1]?.time) / 60
  );
  const timeLabel = minutesOffset === 0 ? 'now' : `${minutesOffset < 0 ? '' : '+'}${minutesOffset}m`;

  return (
    <Group
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '56px',
        zIndex: 998,
        backgroundColor: '#fff',
        borderRadius: '6px',
        padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        pointerEvents: 'auto',
      }}
      gap={8}
      align="center"
    >
      <Button
        variant="light"
        size="xs"
        onClick={onPrev}
        leftSection={<IconPlayerSkipBack size={16} />}
        disabled={currentIndex === 0}
      >
      </Button>

      <Button
        variant={isPlaying ? 'filled' : 'light'}
        size="xs"
        onClick={onTogglePlay}
        leftSection={isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
      >
      </Button>

      <Button
        variant="light"
        size="xs"
        onClick={onNext}
        leftSection={<IconPlayerSkipForward size={16} />}
        disabled={currentIndex === frames.length - 1}
      >
      </Button>

      <Stack gap={2} ml={8}>
        <Text size="xs" fw={600} style={{ fontFamily: 'monospace', minWidth: '40px' }}>
          {timeLabel}
        </Text>
        <Text size="xs" c="dimmed" style={{ fontSize: '10px' }}>
          {currentIndex + 1}/{frames.length}
        </Text>
      </Stack>
    </Group>
  );
};
