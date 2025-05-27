window.fpvinitializeMap = (elementId, dotnetHelper) => {
    // 1) Створюємо карту
    const map = L.map(elementId, {
        center: [40.4168, -3.7038],
        zoom: 13,
    });

    const apiKey = "cb9057bc695e65c32bd8ad9081faba9b";

    // 2) Шари базових мап
    const layers = {
        "OSM Standard": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }),
        "Esri Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri' }),
        "CartoDB Positron": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' }),
        "CartoDB Dark Matter": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CartoDB' }),
    };

    // 3) Шари погоди
    const windLayer = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`, { attribution: '&copy; OpenWeatherMap', opacity: 1 });
    const cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`, { attribution: '&copy; OpenWeatherMap', opacity: 1 });
    const rainLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png?appid=${apiKey}`, { attribution: '&copy; OpenWeatherMap', opacity: 1 });

    const overlayLayers = {
        "Вітер": windLayer,
        "Хмари": cloudsLayer,
        "Опади": rainLayer
    };

    // Додаємо базовий шар і контрол шарів
    layers["OSM Standard"].addTo(map);
    const layerControl = L.control.layers(layers, overlayLayers).addTo(map);

    // Додаємо плагіни
    L.control.locate({ position: 'topleft', strings: { title: "Показати моє місцезнаходження" }, flyTo: true }).addTo(map);
    map.addControl(L.control.fullscreen({ position: 'topright', title: '↔️ Fullscreen', titleCancel: '✕ Exit fullscreen' }));
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    L.Control.geocoder({ defaultMarkGeocode: false, placeholder: "🔍 Знайти адресу…" })
        .on('markgeocode', e => map.flyTo(e.geocode.center, 15))
        .addTo(map);
    L.control.measure({ position: 'topleft', primaryLengthUnit: 'meters', primaryAreaUnit: 'sqmeters', activeColor: '#db4a29', completedColor: '#9b2d14' }).addTo(map);
    L.control.rainviewer({ position: 'bottomleft', nextButtonText: '>', playStopButtonText: 'PlayStop', prevButtonText: '<', positionSliderLabelText: "Hour:", opacitySliderLabelText: "Opacity:", animationInterval: 500, opacity: 0.5 }).addTo(map);

    // Зберігаємо для прямого доступу
    window._fpvMap = map;
    window._fpvDotnet = dotnetHelper;

    // Додаємо додатковий RainViewer радар
    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(r => r.json())
        .then(data => {
            const last = data.radar.past.slice(-1)[0];
            const tpl = `https://tilecache.rainviewer.com${last.path}/256/{z}/{x}/{y}/2/1_1.png`;
            const rvLayer = L.tileLayer(tpl, { attribution: '&copy; RainViewer', opacity: 0.6 });
            overlayLayers["RainViewer (дощ/радар)"] = rvLayer;
            layerControl.addOverlay(rvLayer, "RainViewer (дощ/радар)");
        })
        .catch(console.error);

    // ─── Pointer Events для long-press на фоні карти ─────────────────
    const container = map.getContainer();
    let longPressTimer;

    function onLongPress(e, isPoint = false, spotId = null) {
        e.preventDefault();
        e.stopPropagation();
        const x = e.clientX;
        const y = e.clientY;
        const latlng = map.mouseEventToLatLng(e);
        dotnetHelper.invokeMethodAsync('OnContextMenu', { x, y, lat: latlng.lat, lng: latlng.lng, isPoint, id: spotId });
    }

    container.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch') {
            longPressTimer = setTimeout(() => onLongPress(e), 600);
        }
    });
    container.addEventListener('pointerup', () => clearTimeout(longPressTimer));
    container.addEventListener('pointermove', () => clearTimeout(longPressTimer));

    // ─── Фолбек десктоп contextmenu ─────────────────────────────────
    map.on('contextmenu', e => {
        if (e.originalEvent.target.closest('.leaflet-marker-icon')) return;
        e.originalEvent.preventDefault();
        dotnetHelper.invokeMethodAsync('OnContextMenu', { x: e.originalEvent.clientX, y: e.originalEvent.clientY, lat: e.latlng.lat, lng: e.latlng.lng, isPoint: false });
    });

    // 4) Автоматичне визначення поточної локації + маркер "Ви тут"
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude: lat, longitude: lng } = pos.coords;
            map.setView([lat, lng], 13);

            const you = L.marker([lat, lng]).addTo(map)
                .bindPopup('<b>Ви тут</b>')
                .openPopup();

            // long-press для маркера "Ви тут"
            let youTimer;
            you.on('pointerdown', e => {
                if (e.originalEvent.pointerType === 'touch') {
                    youTimer = setTimeout(() => onMarkerLongPress(e, false, null), 600);
                }
            });
            you.on('pointerup pointermove', () => clearTimeout(youTimer));

            function onMarkerLongPress(e, isPoint, spotId) {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
                const x = e.originalEvent.clientX;
                const y = e.originalEvent.clientY;
                dotnetHelper.invokeMethodAsync('OnContextMenu', { x, y, lat: e.latlng.lat, lng: e.latlng.lng, isPoint, id: spotId });
            }

            // фолбек десктоп
            you.on('contextmenu', e => {
                e.originalEvent.preventDefault();
                dotnetHelper.invokeMethodAsync('OnContextMenu', { x: e.originalEvent.clientX, y: e.originalEvent.clientY, lat: e.latlng.lat, lng: e.latlng.lng, isPoint: false });
            });

            dotnetHelper.invokeMethodAsync('AutoLocated', lat, lng);
        }, err => console.warn("Geo error:", err), {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    }

    // 5) Лівий клік — відміна спота
    map.on('click', e => {
        dotnetHelper.invokeMethodAsync('HandleClick', e.latlng.lat, e.latlng.lng);
    });
};

// Додавання маркера зі своїм long-press / contextmenu
window.fpvAddMarker = (spot) => {
    const map = window._fpvMap;
    const dotnet = window._fpvDotnet;
    if (!map || !spot) return;

    const m = L.marker([spot.latitude, spot.longitude]).addTo(map);
    if (spot.name) m.bindPopup(`<b>${spot.name}</b>`);
    m.spotId = spot.id;

    let markerTimer;
    m.on('pointerdown', e => {
        if (e.originalEvent.pointerType === 'touch') {
            markerTimer = setTimeout(() => onMarkerLongPress(e, true, m.spotId), 600);
        }
    });
    m.on('pointerup pointermove', () => clearTimeout(markerTimer));

    function onMarkerLongPress(e, isPoint, spotId) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        const x = e.originalEvent.clientX;
        const y = e.originalEvent.clientY;
        dotnet.invokeMethodAsync('OnContextMenu', { x, y, lat: e.latlng.lat, lng: e.latlng.lng, id: spotId, isPoint });
    }

    // десктоп-fallback
    m.on('contextmenu', e => {
        e.originalEvent.preventDefault();
        dotnet.invokeMethodAsync('OnContextMenu', { x: e.originalEvent.clientX, y: e.originalEvent.clientY, lat: e.latlng.lat, lng: e.latlng.lng, id: m.spotId, isPoint: true });
    });
};

// Очищення всіх спотових маркерів (крім маркера "Ви тут")
window.fpvClearMarkers = () => {
    const map = window._fpvMap;
    if (!map) return;
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && !layer.getPopup()?.getContent().includes('Ви тут')) {
            map.removeLayer(layer);
        }
    });
};
