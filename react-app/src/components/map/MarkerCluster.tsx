import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { FlightSpot } from '../../types';
import { SpotMarker } from './SpotMarker';
import type { ContextMenuState } from './FpvMap';

interface MarkerClusterProps {
  spots: FlightSpot[];
  onContextMenu: (state: ContextMenuState) => void;
  longPressActiveRef: React.MutableRefObject<boolean>;
  markerRefs: React.MutableRefObject<Record<string, L.Marker>>;
  clusterGroupRef: React.MutableRefObject<L.MarkerClusterGroup | null>;
}

export function MarkerCluster({
  spots,
  onContextMenu,
  longPressActiveRef,
  markerRefs,
  clusterGroupRef,
}: MarkerClusterProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || spots.length === 0) return;

    // Clean up old cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    // Create new cluster group with a small delay to ensure markers are registered
    const timer = setTimeout(() => {
      const markerGroup = L.markerClusterGroup({
        maxClusterRadius: 80,
        disableClusteringAtZoom: 17,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true,
      });

      // Add markers to cluster group
      spots.forEach((spot) => {
        if (spot.id && markerRefs.current[spot.id]) {
          markerGroup.addLayer(markerRefs.current[spot.id]);
        }
      });

      if (markerGroup.getLayers().length > 0) {
        markerGroup.addTo(map);
        clusterGroupRef.current = markerGroup;  // expose to FlyToTarget
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, spots.length]);

  return (
    <>
      {spots.map(spot => spot.id
        ? <SpotMarker key={spot.id} spot={spot} onContextMenu={onContextMenu} longPressActiveRef={longPressActiveRef} markerRefs={markerRefs} />
        : null
      )}
    </>
  );
}
