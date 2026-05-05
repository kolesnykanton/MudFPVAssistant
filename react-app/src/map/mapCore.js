import { addPlugins } from './mapPlugins.js';
import { addMarker, clearMarkers, createMarkerRegistry } from './mapMarkers.js';

/**
 * Create the Leaflet map. Pure rendering — all interaction (click, right-click,
 * long-press) is handled in React (see MapSpotSave.tsx) so that state lives in
 * a single place and there is no double-hop between vanilla JS and React.
 */
export function createMap(elementId) {
    const L = window.L;
    const map = L.map(elementId, { center: [40.4168, -3.7038], zoom: 13 });

    const layers = {
        "OSM Standard": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }),
        "Esri Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri' }),
        "CartoDB Positron": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' }),
        "CartoDB Dark Matter": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' }),
    };

    const overlayLayers = {};

    layers["OSM Standard"].addTo(map);
    const layerControl = L.control.layers(layers, overlayLayers).addTo(map);
    map._layerControl = layerControl;

    const pluginFailures = addPlugins(map);
    map._pluginFailures = pluginFailures;

    const rainviewerController = new AbortController();
    map._rainviewerController = rainviewerController;
    fetch('https://api.rainviewer.com/public/weather-maps.json', { signal: rainviewerController.signal })
        .then(r => r.json())
        .then(data => {
            const last = data.radar.past.slice(-1)[0];
            const tpl = `https://tilecache.rainviewer.com${last.path}/256/{z}/{x}/{y}/2/1_1.png`;
            const rvLayer = L.tileLayer(tpl, { attribution: '&copy; RainViewer', opacity: 0.6 });
            overlayLayers["RainViewer (rain/radar)"] = rvLayer;
            layerControl.addOverlay(rvLayer, "RainViewer (rain/radar)");
        })
        .catch(err => { if (err.name !== 'AbortError') console.error(err); });

    map._userLocationMarker = null;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            map.setView([lat, lng], 13);
            // Store reference so clearMarkers can skip this marker by identity.
            map._userLocationMarker = L.marker([lat, lng]).addTo(map).bindPopup('<b>You</b>').openPopup();
        }, err => console.warn('Geo error:', err), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }

    return map;
}

export function addWeatherOverlays(map, apiKey) {
    if (!apiKey || !map._layerControl || map._weatherLayersAdded) return;
    map._weatherLayersAdded = true;
    const L = window.L;
    const lc = map._layerControl;
    lc.addOverlay(L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`, { attribution: '&copy; OpenWeatherMap', opacity: 1 }), 'Wind');
    lc.addOverlay(L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`, { attribution: '&copy; OpenWeatherMap', opacity: 1 }), 'Clouds');
    lc.addOverlay(L.tileLayer(`https://tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png?appid=${apiKey}`, { attribution: '&copy; OpenWeatherMap', opacity: 1 }), 'Rain');
}

export { addMarker, clearMarkers, createMarkerRegistry };
