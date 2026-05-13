import { TileLayer, LayersControl } from 'react-leaflet';
import { useWeatherAnimation } from '../../context/WeatherAnimationContext';

export const RAINVIEWER_OVERLAY_NAME = 'RainViewer (animated radar)';

interface WeatherLayersProps {
  openWeatherApiKey?: string;
}

export function WeatherLayers({ openWeatherApiKey }: WeatherLayersProps) {
  const { host, currentFrame } = useWeatherAnimation();

  return (
    <>
      {currentFrame && host && (
        <LayersControl.Overlay name={RAINVIEWER_OVERLAY_NAME}>
          <TileLayer
            url={`${host}${currentFrame.path}/512/{z}/{x}/{y}/2/1_1.png`}
            attribution="&copy; RainViewer"
            opacity={0.6}
            maxNativeZoom={7}
            zIndex={2}
            className="mfa-rainviewer"
          />
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
