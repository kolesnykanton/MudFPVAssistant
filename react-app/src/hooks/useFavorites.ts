import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection, onSnapshot, doc, increment, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export function useFavorites() {
  const { uid } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Latest-value ref: assigned on every render so callbacks always read current
  // state without needing favoriteIds as a useCallback dependency.
  const latestFavoriteIdsRef = useRef(favoriteIds);
  latestFavoriteIdsRef.current = favoriteIds;

  // Prevents a second tap from running while the first write is in-flight.
  const inFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!uid) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(collection(db, `users/${uid}/favoritedCommunitySpots`), snap => {
      const ids = new Set(snap.docs.map(d => d.id));
      setFavoriteIds(ids);
      setLoading(false);
    }, err => {
      console.error('[firestore] favorites listener error:', err);
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  const toggleFavorite = useCallback(async (spotId: string) => {
    if (!uid) throw new Error('Not authenticated');
    if (inFlightRef.current.has(spotId)) return;
    inFlightRef.current.add(spotId);

    const isFavorited = latestFavoriteIdsRef.current.has(spotId);

    // Optimistic update: flip state immediately for instant UI response and so
    // that a second tap after the write resolves (but before the snapshot arrives)
    // reads the correct value and takes the opposite branch.
    // favoriteCount is client-maintained and may drift by ±1 under rapid taps;
    // the two-layer guard (inFlightRef + optimistic state) keeps it correct in
    // the common case without requiring a Cloud Function or server transaction.
    const next = new Set(latestFavoriteIdsRef.current);
    isFavorited ? next.delete(spotId) : next.add(spotId);
    setFavoriteIds(next);
    latestFavoriteIdsRef.current = next;

    try {
      if (isFavorited) {
        const batch = writeBatch(db);
        batch.delete(doc(db, `communitySpots/${spotId}/favorites/${uid}`));
        batch.delete(doc(db, `users/${uid}/favoritedCommunitySpots/${spotId}`));
        batch.update(doc(db, `communitySpots/${spotId}`), { favoriteCount: increment(-1) });
        await batch.commit();
      } else {
        const batch = writeBatch(db);
        batch.set(doc(db, `communitySpots/${spotId}/favorites/${uid}`), {});
        batch.set(doc(db, `users/${uid}/favoritedCommunitySpots/${spotId}`), {});
        batch.update(doc(db, `communitySpots/${spotId}`), { favoriteCount: increment(1) });
        await batch.commit();
      }
    } catch (err) {
      // Revert optimistic update so UI stays consistent with actual DB state.
      const reverted = new Set(latestFavoriteIdsRef.current);
      isFavorited ? reverted.add(spotId) : reverted.delete(spotId);
      setFavoriteIds(reverted);
      latestFavoriteIdsRef.current = reverted;
      console.error('[firestore] toggle favorite error:', err);
      throw err;
    } finally {
      inFlightRef.current.delete(spotId);
    }
  }, [uid]);

  return { favoriteIds, loading, toggleFavorite };
}
