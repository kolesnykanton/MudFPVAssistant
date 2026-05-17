import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWeatherRadar, type RadarFrame } from '../hooks/useWeatherRadar';

interface WeatherAnimationContextType {
  host: string;
  frames: RadarFrame[];
  nowcastStartIndex: number;
  currentFrame: RadarFrame | undefined;
  currentFrameIndex: number;
  isPlaying: boolean;
  loading: boolean;
  error: string | null;
  setCurrentFrameIndex: (index: number | ((prev: number) => number)) => void;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
}

const WeatherAnimationContext = createContext<WeatherAnimationContextType>(null!);

export function WeatherAnimationProvider({ children }: { children: React.ReactNode }) {
  const { host, frames, nowcastStartIndex, loading, error } = useWeatherRadar();
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Start at the frame nearest to current time when frames load
  useEffect(() => {
    if (frames.length === 0) return;
    const nowTs = Date.now() / 1000;
    const idx = frames.reduce((best, f, i) =>
      Math.abs(f.time - nowTs) < Math.abs(frames[best].time - nowTs) ? i : best, 0);
    setCurrentFrameIndex(idx);
  }, [frames.length]);

  // Loop through frames while playing. Wrapping with % keeps this a single
  // effect with a single cleanup — no inter-effect dep cancellation possible.
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const id = setInterval(() => {
      setCurrentFrameIndex(i => (i + 1) % frames.length);
    }, 600);
    return () => clearInterval(id);
  }, [isPlaying, frames.length]);

  const currentFrame = frames[currentFrameIndex];

  return (
    <WeatherAnimationContext.Provider
      value={{
        host,
        frames,
        nowcastStartIndex,
        currentFrame,
        currentFrameIndex,
        isPlaying,
        loading,
        error,
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
