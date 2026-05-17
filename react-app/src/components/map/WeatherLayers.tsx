import { LayerGroup, LayersControl, TileLayer } from 'react-leaflet';
import { useWeatherAnimation } from '../../context/WeatherAnimationContext';

export const RAINVIEWER_OVERLAY_NAME = 'RainViewer (animated radar)';
export const TOMORROWIO_OVERLAY_NAME = 'Forecast 6h (Tomorrow.io)';

interface WeatherLayersProps {
  openWeatherApiKey?: string;
}

/**
 * Declares LayersControl entries for all weather overlays.
 * Radar overlays use an empty LayerGroup as a placeholder — the actual animated tiles
 * are managed imperatively by SmoothRadarLayer in FpvMap (via RadarOverlayManager),
 * which mounts only when the overlay is toggled on.
 */
export function WeatherLayers({ openWeatherApiKey }: WeatherLayersProps) {
  const { tioFrames } = useWeatherAnimation();
  const hasTio = tioFrames.length > 0;

  return (
    <>
      <LayersControl.Overlay name={RAINVIEWER_OVERLAY_NAME}>
        <LayerGroup />
      </LayersControl.Overlay>

      {hasTio && (
        <LayersControl.Overlay name={TOMORROWIO_OVERLAY_NAME}>
          <LayerGroup />
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
