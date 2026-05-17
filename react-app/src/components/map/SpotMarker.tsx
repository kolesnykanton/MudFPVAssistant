/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@mantine/core';
import type { FlightInfo, FlightSpot, WithId } from '../../types';
import { CATEGORY_COLORS } from '../../types';
import type { ContextMenuState } from './FpvMap';
import { makeDroneMarkerIcon } from '../../utils/markerIcon';
import { openGoogleMaps, openAppleMaps } from '../../utils/navigation';

interface SpotMarkerProps {
  spot: FlightSpot;
  onContextMenu: (state: ContextMenuState) => void;
  longPressActiveRef: React.RefObject<boolean>;
  markerRefs?: React.MutableRefObject<Record<string, L.Marker>>;
  flightCount: number;
  recentFlights: WithId<FlightInfo>[];
  onEdit?: (spot: WithId<FlightSpot>) => void;
  onDelete?: (spot: WithId<FlightSpot>) => void;
}

export function SpotMarker({
  spot, onContextMenu, longPressActiveRef, markerRefs,
  flightCount, recentFlights, onEdit, onDelete,
}: SpotMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !spot.id) return;
    const spotId = spot.id;
    // Re-apply on every 'add' because markercluster calls _removeIcon() when it
    // takes ownership of the marker, nulling _icon. The next time the marker
    // becomes visible a fresh DOM element is created and needs the attribute.
    const applyAttribute = () => {
      const el = marker.getElement();
      if (el) el.dataset.spotId = spotId;
    };
    applyAttribute();
    marker.on('add', applyAttribute);
    return () => { marker.off('add', applyAttribute); };
  }, [spot.id]);

  useEffect(() => {
    if (markerRefs && spot.id && markerRef.current) {
      const refs = markerRefs.current;
      const spotId = spot.id as string;
      refs[spotId] = markerRef.current;
      return () => { delete refs[spotId]; };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot.id]);

  const icon = useMemo(() => makeDroneMarkerIcon({ category: spot.category, badgeCount: flightCount }), [spot.category, flightCount]);

  const eventHandlers = useMemo(() => ({
    contextmenu: (e: L.LeafletMouseEvent) => {
      if (longPressActiveRef.current) return;
      L.DomEvent.stopPropagation(e);
      onContextMenu({
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        isPoint: true,
        spotId: spot.id ?? null,
      });
    },
  // longPressActiveRef is a stable ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [spot.id, onContextMenu]);

  const categoryColor = spot.category ? (CATEGORY_COLORS[spot.category] ?? '#888') : undefined;

  return (
    <Marker
      ref={markerRef}
      position={[spot.latitude, spot.longitude]}
      icon={icon}
      eventHandlers={eventHandlers}
    >
      <Popup minWidth={190}>
        <div style={{ fontFamily: 'inherit' }}>
          <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            {spot.name}
            {categoryColor && spot.category && (
              <span style={{
                fontSize: 10, background: categoryColor, color: 'white',
                padding: '1px 6px', borderRadius: 8,
              }}>
                {spot.category}
              </span>
            )}
            {spot.publishedAsId && (
              <Badge size="xs" variant="light">Community</Badge>
            )}
          </div>
          {flightCount === 0 ? (
            <div style={{ fontSize: 11, color: '#888' }}>No flights logged here yet</div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                {flightCount} flight{flightCount !== 1 ? 's' : ''} logged here
              </div>
              {recentFlights.map(f => (
                <div key={f.id} style={{ fontSize: 11, marginBottom: 2, color: '#333' }}>
                  • {f.name}{f.usedMah ? ` · ${f.usedMah}mAh` : ''}{f.date ? ` · ${f.date.slice(5)}` : ''}
                </div>
              ))}
              <button
                onClick={() => navigate(`/flights?spotId=${spot.id}`)}
                style={{
                  marginTop: 6, fontSize: 11, color: '#1971c2',
                  background: 'none', border: 'none', padding: 0,
                  cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                See all flights →
              </button>
            </>
          )}
          {(onEdit || onDelete) && spot.id && (
            <div style={{ marginTop: 8, borderTop: '1px solid #eee', paddingTop: 8, display: 'flex', gap: 5 }}>
              {onEdit && (
                <button
                  onClick={() => onEdit(spot as WithId<FlightSpot>)}
                  style={{
                    flex: 1, fontSize: 10, padding: '4px 6px',
                    background: '#f1f3f5', color: '#1f2937',
                    border: '1px solid #dee2e6', borderRadius: 4, cursor: 'pointer',
                    fontWeight: 600, letterSpacing: '0.01em',
                  }}
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(spot as WithId<FlightSpot>)}
                  style={{
                    flex: 1, fontSize: 10, padding: '4px 6px',
                    background: '#fff5f5', color: '#c92a2a',
                    border: '1px solid #ffc9c9', borderRadius: 4, cursor: 'pointer',
                    fontWeight: 600, letterSpacing: '0.01em',
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
          <div style={{ marginTop: 8, borderTop: '1px solid #eee', paddingTop: 8, display: 'flex', gap: 5 }}>
            <button
              onClick={() => openGoogleMaps(spot.latitude, spot.longitude)}
              title="Open route in Google Maps"
              style={{
                flex: 1, fontSize: 10, padding: '4px 6px',
                background: '#4285F4', color: 'white',
                border: 'none', borderRadius: 4, cursor: 'pointer',
                fontWeight: 600, letterSpacing: '0.01em',
              }}
            >
              Google Maps
            </button>
            <button
              onClick={() => openAppleMaps(spot.latitude, spot.longitude)}
              title="Open route in Apple Maps"
              style={{
                flex: 1, fontSize: 10, padding: '4px 6px',
                background: '#1c1c1e', color: 'white',
                border: 'none', borderRadius: 4, cursor: 'pointer',
                fontWeight: 600, letterSpacing: '0.01em',
              }}
            >
              Apple Maps
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
