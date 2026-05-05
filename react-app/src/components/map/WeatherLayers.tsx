import { useEffect, useState } from 'react';
import { TileLayer, LayersControl } from 'react-leaflet';

interface WeatherLayersProps {
  openWeatherApiKey?: string;
}

export function WeatherLayers({ openWeatherApiKey }: WeatherLayersProps) {
  const [rainTileUrl, setRainTileUrl] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('https://api.rainviewer.com/public/weather-maps.json', { signal: controller.signal })
      .then(r => r.json())
      .then((data: { radar: { past: Array<{ path: string }> } }) => {
        const last = data.radar.past.at(-1);
        if (last) setRainTileUrl(`https://tilecache.rainviewer.com${last.path}/256/{z}/{x}/{y}/2/1_1.png`);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });
    return () => controller.abort();
  }, []);

  return (
    <>
      {rainTileUrl && (
        <LayersControl.Overlay name="RainViewer (rain/radar)">
          <TileLayer url={rainTileUrl} attribution="&copy; RainViewer" opacity={0.6} />
        </LayersControl.Overlay>
      )}
      {openWeatherApiKey && (
        <>
          <LayersControl.Overlay name="Wind">
            <TileLayer
              url={`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${openWeatherApiKey}`}
              attribution="&copy; OpenWeatherMap"
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Clouds">
            <TileLayer
              url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${openWeatherApiKey}`}
              attribution="&copy; OpenWeatherMap"
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Rain">
            <TileLayer
              url={`https://tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png?appid=${openWeatherApiKey}`}
              attribution="&copy; OpenWeatherMap"
            />
          </LayersControl.Overlay>
        </>
      )}
    </>
  );
}
