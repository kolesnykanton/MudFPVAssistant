export function addPlugins(map, dotnetHelper) {
    // Locate me
    L.control.locate({position: 'topleft', strings: {title: "Show me"}, flyTo: true}).addTo(map);

    // Fullscreen
    map.addControl(L.control.fullscreen({position: 'topright', title: 'Fullscreen', titleCancel: 'Exit fullscreen'}));

    // Scale
    L.control.scale({imperial: false, position: 'bottomleft'}).addTo(map);

    // Geocoder
    L.Control.geocoder({defaultMarkGeocode: false, placeholder: "🔍 Find…"})
        .on('markgeocode', e => map.flyTo(e.geocode.center, 15))
        .addTo(map);

    // Measure
    L.control.measure({
        position: 'topleft',
        primaryLengthUnit: 'meters',
        primaryAreaUnit: 'sqmeters',
        activeColor: '#db4a29',
        completedColor: '#9b2d14'
    }).addTo(map);

    // RainViewer
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

    setTimeout(function () {
        var link = document.querySelector('.leaflet-control-rainviewer a');
        if (link) link.setAttribute('href', 'javascript:void(0)');
        var controlContainer = document.querySelector('.leaflet-control-rainviewer');
        if (controlContainer) {
            L.DomEvent.disableClickPropagation(controlContainer);
            L.DomEvent.disableScrollPropagation(controlContainer);
        }
    }, 100);
}
