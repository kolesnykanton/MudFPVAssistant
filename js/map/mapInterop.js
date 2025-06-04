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
