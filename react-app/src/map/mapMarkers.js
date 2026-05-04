export function addMarker(spot, map, onContextMenu) {
    const L = window.L;
    const icon = L.icon({
        iconUrl: './img/drone-icon.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [32, 32],
        shadowAnchor: [16, 16]
    });
    const m = L.marker([spot.latitude, spot.longitude], { icon }).addTo(map);
    if (spot.name) m.bindPopup(`<b>${spot.name}</b>`);
    m.spotId = spot.id;

    let markerTimer;
    m.on('pointerdown', e => {
        if (e.originalEvent.pointerType === 'touch') {
            markerTimer = setTimeout(() => {
                e.originalEvent.preventDefault();
                e.originalEvent.stopPropagation();
                onContextMenu({ x: e.originalEvent.clientX, y: e.originalEvent.clientY, lat: e.latlng.lat, lng: e.latlng.lng, id: m.spotId, isPoint: true });
            }, 600);
        }
    });
    m.on('pointerup pointermove', () => clearTimeout(markerTimer));

    m.on('contextmenu', e => {
        e.originalEvent.preventDefault();
        onContextMenu({ x: e.originalEvent.clientX, y: e.originalEvent.clientY, lat: e.latlng.lat, lng: e.latlng.lng, id: m.spotId, isPoint: true });
    });

    return m;
}

export function clearMarkers(map) {
    const L = window.L;
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && !layer.getPopup()?.getContent().includes('You')) {
            map.removeLayer(layer);
        }
    });
}
