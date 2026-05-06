import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import type { WithId } from '../types';

export const COLLECTIONS = {
  FlightSpots: 'FlightSpots',
  FlightInfos: 'FlightInfos',
  settings:    'settings',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

export function useUserCollection<T extends object>(collectionName: CollectionName) {
  const { uid } = useAuth();
  const [items, setItems] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setItems([]);
      setLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    setLoading(true);
    const colRef = collection(db, `users/${uid}/${collectionName}`);
    const unsub = onSnapshot(colRef, snapshot => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WithId<T>)));
      setLoading(false);
    });
    return unsub;
  }, [uid, collectionName]);

  const add = async (item: Omit<T, 'id'>): Promise<string> => {
    if (!uid) throw new Error('Not authenticated');
    const colRef = collection(db, `users/${uid}/${collectionName}`);
    const docRef = await addDoc(colRef, item);
    return docRef.id;
  };

  const update = async (id: string, data: Partial<Omit<T, 'id'>>) => {
    if (!uid) throw new Error('Not authenticated');
    await updateDoc(doc(db, `users/${uid}/${collectionName}/${id}`), data as Record<string, unknown>);
  };

  const remove = async (id: string) => {
    if (!uid) throw new Error('Not authenticated');
    await deleteDoc(doc(db, `users/${uid}/${collectionName}/${id}`));
  };

  return { items, loading, add, update, remove };
}
