import { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import type { UserSettings } from '../types';

const DEFAULT_SETTINGS: Omit<UserSettings, 'id'> = {
  apiKeys: { openWeatherApiKey: '', googleApiKey: '' },
};

export function useSettings() {
  const { uid } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    const colRef = collection(db, `users/${uid}/settings`);
    const unsub = onSnapshot(colRef, async snapshot => {
      if (snapshot.empty) {
        // Create default settings document
        const newDocRef = doc(colRef);
        await setDoc(newDocRef, DEFAULT_SETTINGS);
        setSettings({ id: newDocRef.id, ...DEFAULT_SETTINGS });
      } else {
        const d = snapshot.docs[0];
        setSettings({ id: d.id, ...(d.data() as Omit<UserSettings, 'id'>) });
      }
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const updateSettings = async (data: Partial<Omit<UserSettings, 'id'>>) => {
    if (!uid || !settings.id) return;
    const docRef = doc(db, `users/${uid}/settings/${settings.id}`);
    await setDoc(docRef, data, { merge: true });
  };

  return { settings, loading, updateSettings };
}
