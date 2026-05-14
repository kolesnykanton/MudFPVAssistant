function buildGoogleMapsUrl(destLat: number, destLng: number): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${destLat},${destLng}`);
  url.searchParams.set('travelmode', 'driving');
  return url.toString();
}

const isIOS = /iP(hone|ad|od)/i.test(navigator.userAgent);

export function openGoogleMaps(destLat: number, destLng: number): void {
  window.open(buildGoogleMapsUrl(destLat, destLng), '_blank', 'noopener,noreferrer');
}

export function openAppleMaps(destLat: number, destLng: number): void {
  if (isIOS) {
    // maps:// scheme triggers the Maps app instantly — no blank page, no redirect delay.
    // On iOS, window.open() with a custom URL scheme hands off to the registered app
    // without opening a browser tab, so the PWA/page stays in the foreground.
    window.open(`maps://?daddr=${destLat},${destLng}&dirflg=d`);
  } else {
    const url = new URL('https://maps.apple.com/');
    url.searchParams.set('daddr', `${destLat},${destLng}`);
    url.searchParams.set('dirflg', 'd');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }
}
