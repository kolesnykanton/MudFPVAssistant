import { useEffect, useState } from 'react';

export interface HourlyEntry {
  time: string;
  precipProbability: number;
  windSpeed: number;
  windDir: number;
}

export interface ForecastData {
  temp: number;
  windSpeed: number;
  windDir: number;
  windGusts: number;
  precipProb: number;
  cloudCover: number;
  nextHours: HourlyEntry[];
}

interface UseLocationForecastResult {
  data: ForecastData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (lat: number, lng: number): string => `forecast_${lat.toFixed(4)}_${lng.toFixed(4)}`;

interface CacheEntry {
  timestamp: number;
  data: ForecastData;
}

export const useLocationForecast = (
  lat: number | null,
  lng: number | null
): UseLocationForecastResult => {
  const [state, setState] = useState<UseLocationForecastResult>({
    data: null,
    loading: false,
    error: null,
    refetch: () => {},
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const fetchForecast = async () => {
    if (lat === null || lng === null) {
      setState(prev => ({ ...prev, data: null, loading: false }));
      return;
    }

    const cacheKey = getCacheKey(lat, lng);
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() - entry.timestamp < CACHE_DURATION_MS) {
        setState(prev => ({ ...prev, data: entry.data, loading: false, error: null }));
        return;
      }
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'MudFPVAssistant/1.0 kolesnyk.antony@gmail.com',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Yr.no API error: ${response.status}`);
      }

      const json = await response.json();
      const timeseries = json.properties?.timeseries || [];

      if (timeseries.length === 0) {
        throw new Error('No forecast data available');
      }

      const current = timeseries[0].data.instant.details;
      const nextHours: HourlyEntry[] = timeseries.slice(1, 7).map((ts: any) => ({
        time: ts.time.substring(11, 16), // HH:mm from ISO string
        precipProbability: ts.data.next_1_hours?.details?.probability_of_precipitation || 0,
        windSpeed: ts.data.instant?.details?.wind_speed || 0,
        windDir: ts.data.instant?.details?.wind_from_direction || 0,
      }));

      const forecastData: ForecastData = {
        temp: current.air_temperature || 0,
        windSpeed: current.wind_speed || 0,
        windDir: current.wind_from_direction || 0,
        windGusts: current.wind_speed_of_gust || 0,
        precipProb: timeseries[0].data.next_1_hours?.details?.probability_of_precipitation || 0,
        cloudCover: current.cloud_area_fraction || 0,
        nextHours,
      };

      sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: forecastData }));

      setState(prev => ({ ...prev, data: forecastData, loading: false, error: null }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [lat, lng, refreshKey]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      refetch: () => {
        sessionStorage.removeItem(getCacheKey(lat ?? 0, lng ?? 0));
        setRefreshKey(k => k + 1);
      },
    }));
  }, [lat, lng]);

  return state;
};
