import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRainViewerFrames, useTomorrowIoFrames, type AnimatedFrame } from '../hooks/useWeatherRadar';

export type RadarSource = 'rainviewer' | 'tomorrowio' | null;

interface WeatherAnimationContextType {
  // Per-source frame data (consumed by SmoothRadarLayer in each overlay)
  rvFrames: AnimatedFrame[];
  tioFrames: AnimatedFrame[];
  // Which overlay is currently driving the timeline control
  activeSource: RadarSource;
  setActiveSource: (s: RadarSource) => void;
  // Derived from activeSource — what the timeline control displays
  frames: AnimatedFrame[];
  nowcastStartIndex: number;
  loading: boolean;
  error: string | null;
  // Shared animation state
  currentFrameIndex: number;
  isPlaying: boolean;
  setCurrentFrameIndex: (i: number | ((prev: number) => number)) => void;
  setIsPlaying: (p: boolean | ((prev: boolean) => boolean)) => void;
}

const WeatherAnimationContext = createContext<WeatherAnimationContextType>(null!);

export function WeatherAnimationProvider({
  children,
  tomorrowIoApiKey,
}: {
  children: React.ReactNode;
  tomorrowIoApiKey?: string;
}) {
  const rv = useRainViewerFrames();
  const tio = useTomorrowIoFrames(tomorrowIoApiKey);

  const [activeSource, setActiveSource] = useState<RadarSource>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Pick the active frame set for the timeline control
  const activeData = activeSource === 'tomorrowio' ? tio : rv;
  const { frames, nowcastStartIndex, loading, error } = activeData;

  // Snap to "now" when source switches or frames first arrive
  useEffect(() => {
    if (frames.length === 0) return;
    const nowTs = Date.now() / 1000;
    const idx = frames.reduce((best, f, i) =>
      Math.abs(f.time - nowTs) < Math.abs(frames[best].time - nowTs) ? i : best, 0);
    setCurrentFrameIndex(idx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSource, frames.length]);

  // Animation loop — loops seamlessly with %
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const id = setInterval(() => {
      setCurrentFrameIndex(i => (i + 1) % frames.length);
    }, 600);
    return () => clearInterval(id);
  }, [isPlaying, frames.length]);

  return (
    <WeatherAnimationContext.Provider
      value={{
        rvFrames: rv.frames,
        tioFrames: tio.frames,
        activeSource,
        setActiveSource,
        frames,
        nowcastStartIndex,
        loading,
        error,
        currentFrameIndex,
        isPlaying,
        setCurrentFrameIndex,
        setIsPlaying,
      }}
    >
      {children}
    </WeatherAnimationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWeatherAnimation = () => {
  const ctx = useContext(WeatherAnimationContext);
  if (!ctx) throw new Error('useWeatherAnimation must be used inside WeatherAnimationProvider');
  return ctx;
};
