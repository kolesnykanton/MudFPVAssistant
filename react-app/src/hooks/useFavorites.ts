import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection, onSnapshot, doc, increment, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export function useFavorites() {
  const { uid } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const favoriteIdsRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      favoriteIdsRef.current = new Set();
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(collection(db, `users/${uid}/favoritedCommunitySpots`), snap => {
      const ids = new Set(snap.docs.map(d => d.id));
      favoriteIdsRef.current = ids;
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

    const isFavorited = favoriteIdsRef.current.has(spotId);

    try {
      if (isFavorited) {
        // Unfavorite
        const batch = writeBatch(db);
        batch.delete(doc(db, `communitySpots/${spotId}/favorites/${uid}`));
        batch.delete(doc(db, `users/${uid}/favoritedCommunitySpots/${spotId}`));
        batch.update(doc(db, `communitySpots/${spotId}`), {
          favoriteCount: increment(-1),
        });
        await batch.commit();
      } else {
        // Favorite
        const batch = writeBatch(db);
        batch.set(doc(db, `communitySpots/${spotId}/favorites/${uid}`), {});
        batch.set(doc(db, `users/${uid}/favoritedCommunitySpots/${spotId}`), {});
        batch.update(doc(db, `communitySpots/${spotId}`), {
          favoriteCount: increment(1),
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('[firestore] toggle favorite error:', err);
      throw err;
    } finally {
      inFlightRef.current.delete(spotId);
    }
  }, [uid]);

  return { favoriteIds, loading, toggleFavorite };
}
