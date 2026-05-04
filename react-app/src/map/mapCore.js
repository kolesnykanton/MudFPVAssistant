import { addPlugins } from './mapPlugins.js';
import { addMarker, clearMarkers } from './mapMarkers.js';

/**
 * callbacks: { onContextMenu(payload), onMapClick(lat, lng) }
 */
export function createMap(elementId, callbacks, openWeatherApiKey) {
    const L = window.L;
    const map = L.map(elementId, { center: [40.4168, -3.7038], zoom: 13 });

    const layers = {
        "OSM Standard": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }),
        "Esri Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri' }),
        "CartoDB Positron": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' }),
        "CartoDB Dark Matter": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' }),
    };

    const overlayLayers = {};
    if (openWeatherApiKey) {
        overlayLayers["Wind"] = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${openWeatherApiKey}`, { attribution: '&copy; OpenWeatherMap', opacity: 1 });
        overlayLayers["Clouds"] = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${openWeatherApiKey}`, { attribution: '&copy; OpenWeatherMap', opacity: 1 });
        overlayLayers["Rain"] = L.tileLayer(`https://tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png?appid=${openWeatherApiKey}`, { attribution: '&copy; OpenWeatherMap', opacity: 1 });
    }

    layers["OSM Standard"].addTo(map);
    const layerControl = L.control.layers(layers, overlayLayers).addTo(map);

    addPlugins(map);

    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(r => r.json())
        .then(data => {
            const last = data.radar.past.slice(-1)[0];
            const tpl = `https://tilecache.rainviewer.com${last.path}/256/{z}/{x}/{y}/2/1_1.png`;
            const rvLayer = L.tileLayer(tpl, { attribution: '&copy; RainViewer', opacity: 0.6 });
            overlayLayers["RainViewer (rain/radar)"] = rvLayer;
            layerControl.addOverlay(rvLayer, "RainViewer (rain/radar)");
        })
        .catch(console.error);

    // Long-press for touch
    const container = map.getContainer();
    let longPressTimer;
    container.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch') {
            longPressTimer = setTimeout(() => {
                e.preventDefault();
                e.stopPropagation();
                const latlng = map.mouseEventToLatLng(e);
                callbacks.onContextMenu({ x: e.clientX, y: e.clientY, lat: latlng.lat, lng: latlng.lng, isPoint: false, spotId: null });
            }, 600);
        }
    });
    container.addEventListener('pointerup', () => clearTimeout(longPressTimer));
    container.addEventListener('pointermove', () => clearTimeout(longPressTimer));

    // Right-click on map (not on marker)
    map.on('contextmenu', e => {
        if (e.originalEvent.target.closest('.leaflet-marker-icon')) return;
        e.originalEvent.preventDefault();
        callbacks.onContextMenu({ x: e.originalEvent.clientX, y: e.originalEvent.clientY, lat: e.latlng.lat, lng: e.latlng.lng, isPoint: false, spotId: null });
    });

    // Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            map.setView([lat, lng], 13);
            L.marker([lat, lng]).addTo(map).bindPopup('<b>You</b>').openPopup();
        }, err => console.warn('Geo error:', err), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    }

    // Left click
    map.on('click', e => {
        callbacks.onMapClick(e.latlng.lat, e.latlng.lng);
    });

    window._fpvMap = map;
    return map;
}

export { addMarker, clearMarkers };
