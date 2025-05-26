window.registerContextMenu = (wrapperEl, dotnetHelper) => {

    const container = wrapperEl.querySelector('.leaflet-container')
        ?? wrapperEl.firstElementChild;
    if (!container) return;

    const mapId = container._leaflet_id;
    const map   = (L.Map && L.Map._instances)?.[mapId];
    if (!map) return;

    map.on('contextmenu', e => {

        // якщо latlng нема – рахуємо
        const ll = e.latlng ?? map.mouseEventToLatLng(e.originalEvent);

        dotnetHelper.invokeMethodAsync('OnContextMenu', {
            x:   e.originalEvent.clientX,
            y:   e.originalEvent.clientY,
            lat: ll.lat,
            lng: ll.lng,
            isPoint: e.sourceTarget instanceof L.Marker
        });

        e.originalEvent.preventDefault();   // блокуємо штатне меню
    });
};