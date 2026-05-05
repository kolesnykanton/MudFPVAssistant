export type BatteryType = 'Unknown' | 'LiPo' | 'LiIon';

export interface FlightInfo {
  id?: string;
  name: string;
  usedMah?: number;
  date?: string;
  comment?: string;
  location: string;
  flightTime?: string; // "mm:ss"
  batType: BatteryType;
  cellCount: number;
}

export interface FlightSpot {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  comments?: string;
  category?: string;
  tags: string[];
  photoUrl?: string;
  storagePath?: string;
}

export interface UserApiKeys {
  openWeatherApiKey?: string;
  googleApiKey?: string;
  weatherApiKey?: string;
}

export interface UserSettings {
  id?: string;
  apiKeys: UserApiKeys;
}

export interface LeafletMap {
  remove(): void;
  mouseEventToLatLng(e: MouseEvent | PointerEvent): { lat: number; lng: number };
  eachLayer(fn: (layer: unknown) => void): void;
  removeLayer(layer: unknown): void;
  setView(latlng: [number, number], zoom: number): void;
  _layerControl: unknown;
  _weatherLayersAdded?: boolean;
  _userLocationMarker: unknown;
  _rainviewerController?: AbortController;
  _pluginFailures?: string[];
}
