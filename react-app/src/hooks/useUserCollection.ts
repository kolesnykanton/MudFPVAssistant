import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export type CollectionName = 'FlightSpots' | 'FlightInfos' | 'settings';

export function useUserCollection<T extends { id?: string }>(collectionName: CollectionName) {
  const { uid } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const colRef = collection(db, `users/${uid}/${collectionName}`);
    const unsub = onSnapshot(colRef, snapshot => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T)));
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
