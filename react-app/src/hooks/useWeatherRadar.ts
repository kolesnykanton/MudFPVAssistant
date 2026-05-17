import { useEffect, useState } from 'react';

export interface RadarFrame {
  time: number;
  path: string;
}

export interface WeatherRadarData {
  host: string;
  frames: RadarFrame[];
  nowcastStartIndex: number;
  loading: boolean;
  error: string | null;
}

export const useWeatherRadar = (): WeatherRadarData => {
  const [data, setData] = useState<WeatherRadarData>({
    host: '',
    frames: [],
    nowcastStartIndex: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    const fetchFrames = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        const response = await fetch(
          'https://api.rainviewer.com/public/weather-maps.json',
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`RainViewer API error: ${response.status}`);
        }

        const json = await response.json();
        const pastFrames = json.radar?.past || [];
        const nowcastFrames = json.radar?.nowcast || [];
        const allFrames = [...pastFrames, ...nowcastFrames].sort((a, b) => a.time - b.time);
        // Structural boundary: past frames always precede nowcast frames by timestamp,
        // so the count of past frames is a stable index for the NOW divider.
        const nowcastStartIndex = pastFrames.length;
        setData({
          host: json.host || 'https://tilecache.rainviewer.com',
          frames: allFrames,
          nowcastStartIndex,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
      }
    };

    fetchFrames();

    refreshInterval = setInterval(fetchFrames, 10 * 60 * 1000); // 10 minutes

    return () => {
      controller.abort();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  return data;
};
