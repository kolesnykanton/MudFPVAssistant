export type BatteryType = 'Unknown' | 'LiPo' | 'LiIon';

/** Adds a mandatory `id` field to a Firestore-backed type. */
export type WithId<T> = T & { id: string };

export const SPOT_CATEGORIES = ['Mountain', 'Beach', 'Building', 'Forest', 'Field'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Mountain: '#8d6e63',
  Beach:    '#29b6f6',
  Building: '#7e57c2',
  Forest:   '#66bb6a',
  Field:    '#ffb300',
};

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
  spotId?: string;
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
  publishedAsId?: string;
  clonedFromCommunityId?: string;
}

export interface CommunitySpot {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  comments?: string;
  category?: string;
  tags: string[];
  photoUrl?: string;
  storagePath?: string;
  ownerId: string;
  ownerName: string;
  ownerPhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  favoriteCount: number;
}

export interface UserApiKeys {
  openWeatherApiKey?: string;
  googleApiKey?: string;
  tomorrowIoApiKey?: string;
}

export interface UserSettings {
  id?: string;
  apiKeys: UserApiKeys;
}
