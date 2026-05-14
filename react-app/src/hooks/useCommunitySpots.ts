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
      setCommunitySpots(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(d.data().createdAt),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(d.data().updatedAt),
      } as WithId<CommunitySpot>)));
      setLoading(false);
    }, err => {
      console.error('[firestore] community spots listener error:', err);
      setLoading(false);
    });

    return unsub;
  }, []);

  return { communitySpots, loading };
}
