import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { CommunitySpot, WithId } from '../types';

export function useCommunitySpots(uid: string | null) {
  const [communitySpots, setCommunitySpots] = useState<WithId<CommunitySpot>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setCommunitySpots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'communitySpots'),
      orderBy('createdAt', 'desc'),
      limit(200),
    );
    const unsub = onSnapshot(q, snap => {
      setCommunitySpots(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() ?? new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(data.updatedAt),
        } as WithId<CommunitySpot>;
      }));
      setLoading(false);
    }, err => {
      console.error('[firestore] community spots listener error:', err);
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  return { communitySpots, loading };
}
