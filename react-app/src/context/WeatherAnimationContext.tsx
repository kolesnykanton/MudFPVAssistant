import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWeatherRadar, type RadarFrame } from '../hooks/useWeatherRadar';

interface WeatherAnimationContextType {
  host: string;
  frames: RadarFrame[];
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
  const { host, frames, loading, error } = useWeatherRadar();
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Reset frame index when frames change
  useEffect(() => {
    setCurrentFrameIndex(0);
  }, [frames.length]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const id = setInterval(() => setCurrentFrameIndex(i => (i + 1) % frames.length), 600);
    return () => clearInterval(id);
  }, [isPlaying, frames.length]);

  const currentFrame = frames[currentFrameIndex];

  return (
    <WeatherAnimationContext.Provider
      value={{
        host,
        frames,
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
export const useWeatherAnimation = () => useContext(WeatherAnimationContext);
