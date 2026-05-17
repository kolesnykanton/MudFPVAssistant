import { useEffect, useRef, useState } from 'react';

export interface AnimatedFrame {
  time: number;
  url: string; // Leaflet tile URL template with {z}/{x}/{y} placeholders
}

export interface RadarData {
  frames: AnimatedFrame[];
  nowcastStartIndex: number;
  loading: boolean;
  error: string | null;
}

const EMPTY_DATA: RadarData = { frames: [], nowcastStartIndex: 0, loading: false, error: null };

export function useRainViewerFrames(): RadarData {
  const [data, setData] = useState<RadarData>({ ...EMPTY_DATA, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchFrames = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`RainViewer API error: ${res.status}`);
        const json = await res.json();
        const host: string = json.host || 'https://tilecache.rainviewer.com';
        const past: { time: number; path: string }[] = json.radar?.past || [];
        const nowcast: { time: number; path: string }[] = json.radar?.nowcast || [];
        const all = [...past, ...nowcast].sort((a, b) => a.time - b.time);
        setData({
          frames: all.map(f => ({
            time: f.time,
            url: `${host}${f.path}/512/{z}/{x}/{y}/2/1_1.png`,
          })),
          nowcastStartIndex: past.length,
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
    interval = setInterval(fetchFrames, 10 * 60 * 1000);

    return () => {
      controller.abort();
      if (interval) clearInterval(interval);
    };
  }, []);

  return data;
}

// Offsets in minutes from "now": 3h past → 6h future
const TIO_OFFSETS_MIN = [-180, -120, -60, 0, 60, 120, 180, 300, 360];
const TIO_NOW_INDEX = 3; // index of offset 0 in the array above

export function useTomorrowIoFrames(apikey?: string): RadarData {
  const [data, setData] = useState<RadarData>(EMPTY_DATA);
  const apikeyRef = useRef(apikey);
  apikeyRef.current = apikey;

  useEffect(() => {
    if (!apikey) {
      setData(EMPTY_DATA);
      return;
    }

    const buildFrames = (): AnimatedFrame[] => {
      const now = Date.now();
      return TIO_OFFSETS_MIN.map(offMin => {
        const t = Math.floor((now + offMin * 60_000) / 1000);
        // Strip milliseconds (.000Z → Z) to avoid .000Z.png confusing the path parser
        const iso = new Date(t * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
        return {
          time: t,
          url: `https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/precipitationIntensity/${iso}.png?apikey=${apikey}`,
        };
      });
    };

    setData({
      frames: buildFrames(),
      nowcastStartIndex: TIO_NOW_INDEX,
      loading: false,
      error: null,
    });

    const interval = setInterval(() => {
      if (apikeyRef.current) {
        setData(prev => ({ ...prev, frames: buildFrames() }));
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [apikey]);

  return data;
}
