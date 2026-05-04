import { createMap, addMarker, clearMarkers } from './mapCore.js';

window.fpvinitializeMap = (elementId, dotnetHelper) => {
    createMap(elementId, dotnetHelper);
};
window.fpvAddMarker = spot => {
    addMarker(spot, window._fpvMap, window._fpvDotnet);
};
window.fpvClearMarkers = () => {
    clearMarkers(window._fpvMap);
};
//TODO: Move all below to MapCore.js
window.getUserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation)
            return reject("Geolocation not supported");

        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            resolve({ latitude, longitude });
        }, err => reject(err), {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    });
};

window.getUserCityIdFromLocation = async function (apiKey) {
    try {
        const { latitude, longitude } = await window.getUserLocation();

        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`
        );
        if (!res.ok) throw `Weather API error: ${res.status}`;

        const data = await res.json();
        if (data.id) return data.id;

        throw "City ID not found in weather response";
    } catch (e) {
        console.error("getUserCityIdFromLocation error:", e);
        throw e;
    }
};

window.loadWeatherWidget = function (cityId, apiKey) {
    window.myWidgetParam = [{
        id: 15,
        cityid: cityId,
        appid: apiKey,
        units: 'metric',
        containerid: 'openweathermap-widget-15'
    }];

    const script = document.createElement('script');
    script.async = true;
    script.charset = "utf-8";
    script.src = "//openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js";
    document.getElementsByTagName('head')[0].appendChild(script);
};
