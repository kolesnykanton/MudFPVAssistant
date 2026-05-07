export type BatteryType = 'Unknown' | 'LiPo' | 'LiIon';

/** Adds a mandatory `id` field to a Firestore-backed type. */
export type WithId<T> = T & { id: string };

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
}

export interface UserSettings {
  id?: string;
  apiKeys: UserApiKeys;
}
