import droneIconUrl from '../assets/drone-icon.svg';

export function addMarker(spot, map) {
    const L = window.L;
    const icon = L.icon({
        iconUrl: droneIconUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [32, 32],
        shadowAnchor: [16, 16],
    });
    const m = L.marker([spot.latitude, spot.longitude], { icon }).addTo(map);
    if (spot.name) {
        const el = document.createElement('b');
        el.textContent = spot.name;
        m.bindPopup(el);
    }

    // Expose spot id on the DOM so React contextmenu/long-press handlers
    // can identify the marker via event.target.closest('.leaflet-marker-icon').
    if (m._icon && spot.id) m._icon.dataset.spotId = spot.id;
    if (m._shadow && spot.id) m._shadow.dataset.spotId = spot.id;

    return m;
}

export function clearMarkers(map) {
    const L = window.L;
    const toRemove = [];
    map.eachLayer(layer => {
        if (layer instanceof L.Marker && layer !== map._userLocationMarker) {
            toRemove.push(layer);
        }
    });
    toRemove.forEach(layer => map.removeLayer(layer));
}

export function createMarkerRegistry() {
    /** @type {Map<string, object>} spot.id -> L.Marker */
    const registry = new Map();

    function sync(spots, map) {
        const incomingIds = new Set(spots.map(s => s.id).filter(Boolean));
        for (const [id, marker] of registry) {
            if (!incomingIds.has(id)) {
                map.removeLayer(marker);
                registry.delete(id);
            }
        }
        for (const spot of spots) {
            if (!spot.id || registry.has(spot.id)) continue;
            const marker = addMarker(spot, map);
            registry.set(spot.id, marker);
        }
    }

    function clear(map) {
        for (const marker of registry.values()) map.removeLayer(marker);
        registry.clear();
    }

    return { sync, clear };
}
