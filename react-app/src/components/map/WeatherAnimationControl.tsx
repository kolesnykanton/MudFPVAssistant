import './WeatherAnimationControl.css';
import { memo, useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ActionIcon, Badge, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { RadarFrame } from '../../hooks/useWeatherRadar';

type FrameZone = 'past' | 'now' | 'forecast';

const ZONE_META: Record<FrameZone, { color: string; label: string; border: string }> = {
  past:     { color: 'gray',  label: 'PAST', border: 'var(--mantine-color-gray-5)' },
  now:      { color: 'green', label: 'NOW',  border: 'var(--mantine-color-green-5)' },
  forecast: { color: 'blue',  label: 'FCST', border: 'var(--mantine-color-blue-5)' },
} as const;

function getZone(offsetSec: number): FrameZone {
  if (offsetSec > 60) return 'forecast';
  if (offsetSec < -(8 * 60)) return 'past';
  return 'now';
}

function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const NOW_PULSE_STYLE: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateX(-50%) translateY(-50%)',
  width: '2px',
  height: '14px',
  background: 'rgba(255,255,255,0.95)',
  borderRadius: '1px',
  boxShadow: '0 0 4px rgba(255,255,255,0.6)',
  animation: 'rainviewer-now-pulse 2s ease-in-out infinite',
  pointerEvents: 'none',
};

// Frames change only on API refresh (every 10 min) — memoize so the 600ms
// animation tick doesn't rebuild N elements on every render.
const TickMarks = memo(function TickMarks({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const pct = count > 1 ? (i / (count - 1)) * 100 : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${pct}%`,
              top: '6px',
              height: '6px',
              width: '1px',
              background: 'rgba(255,255,255,0.35)',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </>
  );
});

interface WeatherAnimationControlProps {
  frames: RadarFrame[];
  currentIndex: number;
  nowcastStartIndex: number;
  isPlaying: boolean;
  onSeek: (index: number) => void;
  onTogglePlay: () => void;
  /** Called on slider pointerdown — should call map.dragging.disable() */
  onMapDragStart: () => void;
  /** Called on slider pointerup/cancel — should call map.dragging.enable() */
  onMapDragEnd: () => void;
}

export const WeatherAnimationControl = memo(function WeatherAnimationControl({
  frames,
  currentIndex,
  nowcastStartIndex,
  isPlaying,
  onSeek,
  onTogglePlay,
  onMapDragStart,
  onMapDragEnd,
}: WeatherAnimationControlProps) {
  const isMobile = useMediaQuery('(max-width: 48em)', true);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (frames.length === 0) return null;

  const nowTs = Date.now() / 1000;
  const frameTs = frames[currentIndex]?.time ?? nowTs;
  const offsetSec = frameTs - nowTs;
  const zone = getZone(offsetSec);
  const zoneMeta = ZONE_META[zone];

  const hasForecast = nowcastStartIndex < frames.length;
  // −0.5 places the divider midway between the last past tick and first nowcast tick
  const nowPct = hasForecast ? ((nowcastStartIndex - 0.5) / (frames.length - 1)) * 100 : 100;
  const thumbPct = frames.length > 1 ? (currentIndex / (frames.length - 1)) * 100 : 0;

  const posToIndex = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (frames.length - 1));
  }, [frames.length]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    onMapDragStart();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    onSeek(posToIndex(e.clientX));
  }, [onMapDragStart, onSeek, posToIndex]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    onSeek(posToIndex(e.clientX));
  }, [onSeek, posToIndex]);

  const handlePointerUp = useCallback(() => {
    onMapDragEnd();
    setIsDragging(false);
  }, [onMapDragEnd]);

  // pointercancel fires when the browser forcibly releases capture (e.g. phone notification)
  const handlePointerCancel = useCallback(() => {
    onMapDragEnd();
    setIsDragging(false);
  }, [onMapDragEnd]);

  const trackBg = hasForecast
    ? `linear-gradient(to right, var(--mantine-color-gray-5) 0%, var(--mantine-color-gray-5) ${nowPct}%, var(--mantine-color-blue-5) ${nowPct}%, var(--mantine-color-indigo-5) 100%)`
    : 'var(--mantine-color-gray-5)';

  const firstFrame = frames[0];
  const lastFrame = frames[frames.length - 1];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: isMobile ? '8px' : '56px',
        right: isMobile ? '8px' : undefined,
        zIndex: 998,
        pointerEvents: 'auto',
        minWidth: isMobile ? undefined : '280px',
      }}
    >
      <Group
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          borderRadius: '10px',
          padding: isMobile ? '7px 10px' : '8px 14px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        }}
        gap={10}
        align="center"
        wrap="nowrap"
      >
        <ActionIcon
          variant={isPlaying ? 'filled' : 'light'}
          color="blue"
          size="sm"
          radius="xl"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause radar animation' : 'Play radar animation'}
          style={{ flexShrink: 0 }}
        >
          {isPlaying ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />}
        </ActionIcon>

        <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={{
              position: 'relative',
              height: '6px',
              borderRadius: '3px',
              background: trackBg,
              cursor: 'pointer',
              userSelect: 'none',
              padding: '6px 0',
              margin: '-6px 0',
              boxSizing: 'content-box',
            }}
          >
            <TickMarks count={frames.length} />

            {hasForecast && (
              <div style={{ ...NOW_PULSE_STYLE, left: `${nowPct}%` }} />
            )}

            <div
              style={{
                position: 'absolute',
                left: `${thumbPct}%`,
                top: '50%',
                transform: 'translateX(-50%) translateY(-50%)',
                width: '13px',
                height: '13px',
                borderRadius: '50%',
                background: '#fff',
                border: `2.5px solid ${zoneMeta.border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                transition: isDragging ? 'none' : 'left 80ms linear',
                pointerEvents: 'none',
              }}
            />
          </div>

          <Group justify="space-between" wrap="nowrap" gap={0}>
            <Text size="xs" c="dimmed" ff="monospace" style={{ fontSize: '10px' }}>
              {fmtTime(firstFrame.time)}
            </Text>
            {hasForecast && (
              <Text size="xs" fw={600} c="dimmed" style={{ fontSize: '10px', letterSpacing: '0.02em' }}>
                NOW
              </Text>
            )}
            <Text size="xs" c="dimmed" ff="monospace" style={{ fontSize: '10px' }}>
              {fmtTime(lastFrame.time)}
            </Text>
          </Group>

          <Group gap={5} align="center">
            <Text size="xs" fw={600} ff="monospace" style={{ lineHeight: 1 }}>
              {fmtTime(frameTs)}
            </Text>
            <Badge size="xs" color={zoneMeta.color} variant="filled" radius="sm" px={4}>
              {zoneMeta.label}
            </Badge>
            {!hasForecast && zone === 'now' && (
              <Text size="xs" c="dimmed" style={{ fontSize: '10px' }}>
                · no forecast
              </Text>
            )}
          </Group>
        </Stack>
      </Group>
    </div>
  );
});
