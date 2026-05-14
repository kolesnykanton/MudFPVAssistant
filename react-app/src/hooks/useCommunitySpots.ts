import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { CommunitySpot, WithId } from '../types';

export function useCommunitySpots() {
  const [communitySpots, setCommunitySpots] = useState<WithId<CommunitySpot>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'communitySpots'), snap => {
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
  }, []);

  return { communitySpots, loading };
}
