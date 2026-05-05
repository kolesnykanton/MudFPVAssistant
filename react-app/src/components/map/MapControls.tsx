import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocateControl } from 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';
import 'leaflet.fullscreen';
import 'leaflet.fullscreen/dist/Control.FullScreen.css';
import { geocoder } from 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-measure';
import 'leaflet-measure/dist/leaflet-measure.css';

export function MapControls() {
  const map = useMap();

  useEffect(() => {
    const controls: L.Control[] = [];

    function safe(name: string, fn: () => L.Control) {
      try { controls.push(fn()); }
      catch (e) { console.warn(`[map] plugin "${name}" failed:`, e); }
    }

    safe('locate', () =>
      new LocateControl({ position: 'topleft', strings: { title: 'Show me' }, flyTo: true }).addTo(map)
    );

    safe('fullscreen', () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (L.Control as any).FullScreen({ position: 'topright', title: 'Fullscreen', titleCancel: 'Exit fullscreen' }).addTo(map)
    );

    safe('scale', () =>
      L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)
    );

    safe('geocoder', () =>
      geocoder({ defaultMarkGeocode: false, placeholder: '🔍 Find…' })
        .on('markgeocode', (e) => map.flyTo(e.geocode.center, 15))
        .addTo(map)
    );

    safe('measure', () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (L.control as any).measure({
        position: 'topleft',
        primaryLengthUnit: 'meters',
        primaryAreaUnit: 'sqmeters',
        activeColor: '#db4a29',
        completedColor: '#9b2d14',
      }).addTo(map)
    );

    return () => {
      controls.forEach(c => { try { map.removeControl(c); } catch { /* already removed */ } });
    };
  }, [map]);

  return null;
}
