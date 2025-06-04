import {addPlugins} from './mapPlugins.js';
import {addMarker, clearMarkers} from './mapMarkers.js';

export function createMap(elementId, dotnetHelper) {
    // 1) Map Creation
    const map = L.map(elementId, {center: [40.4168, -3.7038], zoom: 13});

    const apiKey = "cb9057bc695e65c32bd8ad9081faba9b";

    // 2) Map layers
    const layers = {
        "OSM Standard": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; OSM'}),
        "Esri Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {attribution: '&copy; Esri'}),
        "CartoDB Positron": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {attribution: '&copy; CartoDB'}),
        "CartoDB Dark Matter": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {attribution: '&copy; CartoDB'}),
    };

    // 3) Weather layers
    const windLayer = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
        attribution: '&copy; OpenWeatherMap', opacity: 1
    });
    const cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
        attribution: '&copy; OpenWeatherMap', opacity: 1
    });
    const rainLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png?appid=${apiKey}`, {
        attribution: '&copy; OpenWeatherMap', opacity: 1
    });

    const overlayLayers = {
        "Wind": windLayer, "Clouds": cloudsLayer, "Rain": rainLayer
    };

    // Basic layer and controls
    layers["OSM Standard"].addTo(map);
    const layerControl = L.control.layers(layers, overlayLayers).addTo(map);

    // 4) Plugins
    addPlugins(map, dotnetHelper);

    // RainViewer radar layer (requires rainview plugin)
    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(r => r.json())
        .then(data => {
            const last = data.radar.past.slice(-1)[0];
            const tpl = `https://tilecache.rainviewer.com${last.path}/256/{z}/{x}/{y}/2/1_1.png`;
            const rvLayer = L.tileLayer(tpl, {attribution: '&copy; RainViewer', opacity: 0.6});
            overlayLayers["RainViewer (дощ/радар)"] = rvLayer;
            layerControl.addOverlay(rvLayer, "RainViewer (дощ/радар)");
        })
        .catch(console.error);

    // ─── Pointer Events for long-press on map
    const container = map.getContainer();
    let longPressTimer;

    function onLongPress(e, isPoint = false, spotId = null) {
        e.preventDefault();
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        const latlng = map.mouseEventToLatLng(e);
        dotnetHelper.invokeMethodAsync('OnContextMenu', {x, y, lat: latlng.lat, lng: latlng.lng, isPoint, id: spotId});
    }

    container.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch') {
            longPressTimer = setTimeout(() => onLongPress(e), 600);
        }
    });
    container.addEventListener('pointerup', () => clearTimeout(longPressTimer));
    container.addEventListener('pointermove', () => clearTimeout(longPressTimer));

    // 7) ─── Fallback contextmenu on map 
    map.on('contextmenu', e => {
        if (e.originalEvent.target.closest('.leaflet-marker-icon')) return;
        e.originalEvent.preventDefault();
        dotnetHelper.invokeMethodAsync('OnContextMenu', {
            x: e.originalEvent.clientX, y: e.originalEvent.clientY, lat: e.latlng.lat, lng: e.latlng.lng, isPoint: false
        });
    });

    // 8) Get Current position (You)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const {latitude: lat, longitude: lng} = pos.coords;
            map.setView([lat, lng], 13);

            const you = L.marker([lat, lng]).addTo(map)
                .bindPopup('<b>You</b>')
                .openPopup();

            /*dotnetHelper.invokeMethodAsync('AutoLocated', lat, lng);*/
        }, err => console.warn("Geo error:", err), {
            enableHighAccuracy: true, timeout: 10000, maximumAge: 0
        });
    }

    // 9) Лівий клік — відміна спота
    map.on('click', e => {
        dotnetHelper.invokeMethodAsync('HandleClick', e.latlng.lat, e.latlng.lng);
    });

    // 10) Зберігаємо для window
    window._fpvMap = map;
    window._fpvDotnet = dotnetHelper;
}

// Проксі до маркерів для використання в window-функціях або імпорту в mapInterop.js
export {addMarker, clearMarkers};
