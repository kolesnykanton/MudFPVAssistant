import L from 'leaflet';
import droneIconUrl from '../assets/drone-icon.svg';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { CATEGORY_COLORS } from '../types';

const iconCache = new Map<string, L.DivIcon | L.Icon>();

export function makeDroneMarkerIcon(options: {
  category?: string;
  badgeCount?: number;
  outlined?: boolean;
}): L.DivIcon | L.Icon {
  const { category, badgeCount = 0, outlined = false } = options;
  const key = `${category ?? ''}-${badgeCount}-${outlined}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const colour = category ? CATEGORY_COLORS[category] : undefined;
  if (!colour) {
    const icon = L.icon({
      iconUrl: droneIconUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      shadowUrl: markerShadowUrl,
      shadowSize: [32, 32],
      shadowAnchor: [16, 16],
    });
    iconCache.set(key, icon);
    return icon;
  }

  const badgeHtml = badgeCount > 0
    ? `<div style="position:absolute;top:-6px;right:-8px;background:#1971c2;color:white;font-size:8px;font-weight:700;padding:1px 4px;border-radius:8px;min-width:14px;text-align:center;line-height:14px;pointer-events:none;">${badgeCount}</div>`
    : '';

  const outlineStyle = outlined ? `outline:2px solid ${colour};outline-offset:2px;` : '';
  const iconSize = outlined ? 16 : 18;

  const html = `
    <div style="position:relative;width:28px;height:28px;overflow:visible;">
      <div style="
        width:28px;height:28px;border-radius:50%;
        background:${colour};border:2px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        ${outlineStyle}">
        <img src="${droneIconUrl}" width="${iconSize}" height="${iconSize}" style="filter:brightness(0) invert(1);" alt="" />
      </div>
      ${badgeHtml}
    </div>`;

  const icon = L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
  iconCache.set(key, icon);
  return icon;
}
