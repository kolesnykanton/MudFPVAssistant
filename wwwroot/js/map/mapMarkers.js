// Кастомні іконки (приклад, розширюй по мірі необхідності)
const customIcons = {
    drone: L.icon({iconUrl: '/icons/drone.png', iconSize: [32, 32], iconAnchor: [16, 16]}), // Додай інші типи
};

// Add spot, context menu events, etc
export function addMarker(spot, map, dotnetHelper) {
    let markerOptions = {};
    if (spot.iconType && customIcons[spot.iconType]) {
        markerOptions.icon = customIcons[spot.iconType];
    }
    const m = L.marker([spot.latitude, spot.longitude], markerOptions).addTo(map);

    if (spot.name) m.bindPopup(`<b>${spot.name}</b>`);
    m.spotId = spot.id;

    // long-press for touch display
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
        dotnetHelper.invokeMethodAsync('OnContextMenu', {
            x, y, lat: e.latlng.lat, lng: e.latlng.lng, id: spotId, isPoint
        });
    }

    // desktop-fallback
    m.on('contextmenu', e => {
        e.originalEvent.preventDefault();
        dotnetHelper.invokeMethodAsync('OnContextMenu', {
            x: e.originalEvent.clientX,
            y: e.originalEvent.clientY,
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            id: m.spotId,
            isPoint: true
        });
    });
}

// Clean all markers except 'You'
export function clearMarkers(map) {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && !layer.getPopup()?.getContent().includes('You')) {
            map.removeLayer(layer);
        }
    });
}
