window.registerContextMenu = (div, dotnet) => {

    div.addEventListener('contextmenu', e => {
        const cont = e.target.closest('.leaflet-container');
        if (!cont) {
            console.warn('[ctx]  no .leaflet-container');
            return;
        }

        const map = window[cont.id];                     // ← головне нове місце
        if (!map) {
            console.warn('[ctx]  window[' + cont.id + '] undefined');
            return;
        }

        /* pixels → lat/lng */
        const ll = map.mouseEventToLatLng(e);

        console.log('[ctx]  right-click', e.clientX, e.clientY, '→', ll);

        dotnet.invokeMethodAsync('OnContextMenu', {
            x: e.clientX,
            y: e.clientY,
            lat: ll.lat,
            lng: ll.lng,
            isPoint: e.target.closest('.leaflet-marker-pane') !== null
        });

        e.preventDefault();                              // блокуємо штатний menu
    });

    console.log('[ctx]  listener attached on', div);
};