// Each plugin is wrapped so that a missing CDN script (network error, blocked
// host, etc.) only logs a warning instead of throwing — and breaking everything
// registered after it in createMap.
export function addPlugins(map) {
    const L = window.L;
    const failed = [];

    function safe(name, fn) {
        try {
            fn();
        } catch (err) {
            console.warn(`[map] plugin "${name}" failed to initialize:`, err);
            failed.push(name);
        }
    }

    safe('locate', () => {
        L.control.locate({ position: 'topleft', strings: { title: 'Show me' }, flyTo: true }).addTo(map);
    });

    safe('fullscreen', () => {
        map.addControl(new L.Control.FullScreen({ position: 'topright', title: 'Fullscreen', titleCancel: 'Exit fullscreen' }));
    });

    safe('scale', () => {
        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    });

    safe('geocoder', () => {
        L.Control.geocoder({ defaultMarkGeocode: false, placeholder: '🔍 Find…' })
            .on('markgeocode', e => map.flyTo(e.geocode.center, 15))
            .addTo(map);
    });

    safe('measure', () => {
        L.control.measure({
            position: 'topleft',
            primaryLengthUnit: 'meters',
            primaryAreaUnit: 'sqmeters',
            activeColor: '#db4a29',
            completedColor: '#9b2d14',
        }).addTo(map);
    });

    safe('rainviewer', () => {
        L.control.rainviewer({
            position: 'bottomleft',
            nextButtonText: '>',
            playStopButtonText: 'PlayStop',
            prevButtonText: '<',
            positionSliderLabelText: 'Hour:',
            opacitySliderLabelText: 'Opacity:',
            animationInterval: 500,
            opacity: 0.5,
        }).addTo(map);

        setTimeout(() => {
            const link = document.querySelector('.leaflet-control-rainviewer a');
            if (link) link.removeAttribute('href');
            const controlContainer = document.querySelector('.leaflet-control-rainviewer');
            if (controlContainer) {
                L.DomEvent.disableClickPropagation(controlContainer);
                L.DomEvent.disableScrollPropagation(controlContainer);
            }
        }, 100);
    });

    return failed;
}
