import { useEffect, useState } from 'react';
import { useWeatherRadar } from './useWeatherRadar';

export const useWeatherAnimation = () => {
  const { host, frames } = useWeatherRadar();
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    const id = setInterval(() => setCurrentFrameIndex(i => (i + 1) % frames.length), 600);
    return () => clearInterval(id);
  }, [isPlaying, frames.length]);

  const currentFrame = frames[currentFrameIndex];

  return {
    host,
    frames,
    currentFrame,
    currentFrameIndex,
    isPlaying,
    setCurrentFrameIndex,
    setIsPlaying,
  };
};
