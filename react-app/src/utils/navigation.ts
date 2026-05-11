function buildGoogleMapsUrl(destLat: number, destLng: number, originLat?: number, originLng?: number): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  if (originLat != null && originLng != null) {
    url.searchParams.set('origin', `${originLat},${originLng}`);
  }
  url.searchParams.set('destination', `${destLat},${destLng}`);
  url.searchParams.set('travelmode', 'driving');
  return url.toString();
}

function buildAppleMapsUrl(destLat: number, destLng: number, originLat?: number, originLng?: number): string {
  const url = new URL('https://maps.apple.com/');
  if (originLat != null && originLng != null) {
    url.searchParams.set('saddr', `${originLat},${originLng}`);
  }
  url.searchParams.set('daddr', `${destLat},${destLng}`);
  url.searchParams.set('dirflg', 'd');
  return url.toString();
}

async function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) return null;
  return new Promise(resolve =>
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 },
    )
  );
}

export async function openGoogleMaps(destLat: number, destLng: number): Promise<void> {
  const origin = await getUserLocation();
  const url = buildGoogleMapsUrl(destLat, destLng, origin?.lat, origin?.lng);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function openAppleMaps(destLat: number, destLng: number): Promise<void> {
  const origin = await getUserLocation();
  const url = buildAppleMapsUrl(destLat, destLng, origin?.lat, origin?.lng);
  window.open(url, '_blank', 'noopener,noreferrer');
}
