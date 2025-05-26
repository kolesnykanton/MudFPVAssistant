// wwwroot/js/mapInterop.js

window.fpvinitializeMap = (elementId, dotnetHelper) => {
    // 1) Ініціалізація карти
    const map = L.map(elementId).setView([40.4168, -3.7038], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Зберігаємо для подальших викликів
    window._fpvMap = map;
    window._fpvDotnet = dotnetHelper;

    // 2) Автолокейт + маркер "Ви тут"
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            map.setView([lat, lng], 13);
            const youMarker = L.marker([lat, lng]).addTo(map)
                .bindPopup('<b>Ви тут</b>')
                .openPopup();

            // контекст‐меню для "Ви тут"
            youMarker.on('contextmenu', e => {
                dotnetHelper.invokeMethodAsync('OnContextMenu', {
                    x: e.originalEvent.clientX,
                    y: e.originalEvent.clientY,
                    lat: e.latlng.lat,
                    lng: e.latlng.lng,
                    isPoint: true
                });
                e.originalEvent.preventDefault();
            });

            dotnetHelper.invokeMethodAsync('AutoLocated', lat, lng);
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
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            isPoint: false
        });
        e.originalEvent.preventDefault();
    });
};

// 5) Додавання маркера зі своїм контекст‐меню
window.fpvAddMarker = (lat, lng, popupHtml) => {
    const map = window._fpvMap;
    const dotnet = window._fpvDotnet;
    if (!map || !dotnet) return;

    const marker = L.marker([lat, lng]).addTo(map);
    if (popupHtml) {
        marker.bindPopup(popupHtml);
    }

    // контекст‐меню для кожного маркера
    marker.on('contextmenu', e => {
        dotnet.invokeMethodAsync('OnContextMenu', {
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            lat: e.latlng.lat,
            lng: e.latlng.lng,
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
        if (layer instanceof L.Marker &&
            !layer.getPopup()?.getContent().includes('Ви тут')) {
            map.removeLayer(layer);
        }
    });
};
