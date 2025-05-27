window.fpvinitializeMap = (elementId, dotnetHelper) => {
    // 1) Створюємо карту
    const map = L.map(elementId, {
        center: [40.4168, -3.7038], zoom: 13,
    });
    const apiKey = "cb9057bc695e65c32bd8ad9081faba9b";
    // 2) Оголошуємо шари
    const layers = {
        "OSM Standard": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; OSM'}),
        "Esri Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {attribution: '&copy; Esri'}),
        "CartoDB Positron": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {attribution: '&copy; CartoDB'}),
        "CartoDB Dark Matter": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {attribution: '&copy; CartoDB'}),
    };
    // 1) Шар вітру
    const windLayer = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
        attribution: '&copy; OpenWeatherMap',
        opacity: 1
    });

    // 2) Шар хмарності
    const cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`, {
        attribution: '&copy; OpenWeatherMap',
        opacity: 1
    });

    // 3) Шар опадів
    const rainLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png?appid=${apiKey}`, {
        attribution: '&copy; OpenWeatherMap',
        opacity: 1
    });

    // 4) Додаємо їх в контрол overlay
    const overlayLayers = {
        "Вітер": windLayer, "Хмари": cloudsLayer, "Опади": rainLayer
    };
    // 5) Додаємо за замовчуванням перший
    layers["OSM Standard"].addTo(map);
    const layerControl = L.control.layers(layers, overlayLayers).addTo(map);
    
    // 6) PLUGINS
    L.control.locate({
        position: 'topleft', strings: {
            title: "Показати моє місцезнаходження"
        }, flyTo: true
    }).addTo(map);
    // Додаємо контрол повноекранного режиму
    map.addControl(L.control.fullscreen({
        position: 'topright', title: '↔️ Fullscreen', titleCancel: '✕ Exit fullscreen'
    }));

    // Шкала в метрах
    L.control.scale({
        imperial: false,   // вимкнути мілі, залишити тільки метри
        position: 'bottomleft'
    }).addTo(map);

    // Пошук по адресі / місцям
    L.Control.geocoder({
        defaultMarkGeocode: false, placeholder: "🔍 Знайти адресу…"
    })
        .on('markgeocode', e => {
            const center = e.geocode.center;
            map.flyTo(center, 15);
            // можна додати маркер
            /*            L.marker(center)
                            .addTo(map)
                            .bindPopup(e.geocode.name)
                            .openPopup();*/
        })
        .addTo(map);

    // Вимірювання відстані/площі
    L.control.measure({
        position: 'topleft', primaryLengthUnit: 'meters', primaryAreaUnit: 'sqmeters', activeColor: '#db4a29',      // колір активного креслення
        completedColor: '#9b2d14'    // колір завершених фігур
    }).addTo(map);

    L.control.rainviewer({
        position: 'bottomleft',
        nextButtonText: '>',
        playStopButtonText: 'PlayStop',
        prevButtonText: '<',
        positionSliderLabelText: "Hour:",
        opacitySliderLabelText: "Opacity:",
        animationInterval: 500,
        opacity: 0.5
    }).addTo(map);

    // Зберігаємо для подальших викликів
    window._fpvMap = map;
    window._fpvDotnet = dotnetHelper;

    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(r => r.json())
        .then(data => {
            const last = data.radar.past.slice(-1)[0];
            const urlTpl = `https://tilecache.rainviewer.com${last.path}/256/{z}/{x}/{y}/2/1_1.png`;
            const rainLayer = L.tileLayer(urlTpl, {
                attribution: '&copy; RainViewer',
                opacity: 0.6
            });

            overlayLayers["RainViewer (дощ/радаp)"] = rainLayer;

            layerControl.addOverlay(rainLayer, "RainViewer (дощ/радар)");
        })
        .catch(console.error);
    
    // 2) Автолокейт + маркер "Ви тут"
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const {latitude: lat, longitude: lng} = pos.coords;
            map.setView([lat, lng], 13);

            const you = L.marker([lat, lng]).addTo(map)
                .bindPopup('<b>Ви тут</b>')
                .openPopup();

            you.on('contextmenu', e => {
                dotnetHelper.invokeMethodAsync('OnContextMenu', {
                    x: e.originalEvent.clientX,
                    y: e.originalEvent.clientY,
                    lat: e.latlng.lat,
                    lng: e.latlng.lng,
                    isPoint: false
                });
                e.originalEvent.preventDefault();
            });

            dotnetHelper.invokeMethodAsync('AutoLocated', lat, lng);
        }, err => {
            console.warn("Geo error:", err);
        }, {
            enableHighAccuracy: true, // 🔹 включити GPS, якщо доступний
            timeout: 10000,           // 🔹 максимум 10 секунд на відповідь
            maximumAge: 0             // 🔹 не використовувати кешовані координати
        });
    }

    // 3) Лівий клік — відмітаємо спот
    map.on('click', e => {
        dotnetHelper.invokeMethodAsync('HandleClick', e.latlng.lat, e.latlng.lng);
    });

    // 4) Правий клік по фону карти
    map.on('contextmenu', e => {
        // якщо клік по маркеру — не обробляємо тут
        if (e.originalEvent.target.closest('.leaflet-marker-icon')) return;

        dotnetHelper.invokeMethodAsync('OnContextMenu', {
            x: e.originalEvent.clientX, y: e.originalEvent.clientY, lat: e.latlng.lat, lng: e.latlng.lng, isPoint: false
        });
        e.originalEvent.preventDefault();
    });
};

// 5) Додавання маркера зі своїм контекст‐меню
window.fpvAddMarker = (spot) => {
    const map = window._fpvMap;
    const dotnet = window._fpvDotnet;
    if (!map || !spot) return;

    const m = L.marker([spot.latitude, spot.longitude]).addTo(map);
    if (spot.name) m.bindPopup(`<b>${spot.name}</b>`);

    // 🔽 зберігаємо ID в маркері
    m.spotId = spot.id;
    console.log("Adding spot to map:", m.spotId);
    m.on('contextmenu', e => {
        dotnet.invokeMethodAsync('OnContextMenu', {
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            id: m.spotId,
            isPoint: true
        });
        e.originalEvent.preventDefault();
    });
};

// 6) Очистити всі спотові маркери (крім "Ви тут")
window.fpvClearMarkers = () => {
    const map = window._fpvMap;
    if (!map) return;
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && !layer.getPopup()?.getContent().includes('Ви тут')) {
            map.removeLayer(layer);
        }
    });
};
