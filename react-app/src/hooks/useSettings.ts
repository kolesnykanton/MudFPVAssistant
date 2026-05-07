import { useState, useEffect } from 'react';
import { onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import type { UserSettings } from '../types';

const DEFAULT_SETTINGS: Omit<UserSettings, 'id'> = {
  apiKeys: { openWeatherApiKey: '', googleApiKey: '' },
};

// Fixed document path — one settings doc per user, no ambiguity.
function settingsDocRef(uid: string) {
  return doc(db, `users/${uid}/settings/user`);
}

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
    const docRef = settingsDocRef(uid);
    const unsub = onSnapshot(docRef, snap => {
      if (snap.exists()) {
        setSettings({ id: snap.id, ...(snap.data() as Omit<UserSettings, 'id'>) });
      } else {
        // First-time user: write defaults, snapshot will fire again with the data.
        setDoc(docRef, DEFAULT_SETTINGS).catch(err => console.error('[settings] init error:', err));
      }
      setLoading(false);
    }, err => {
      console.error('[firestore] settings listener error:', err);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const updateSettings = async (data: Partial<Omit<UserSettings, 'id'>>) => {
    if (!uid) return;
    await setDoc(settingsDocRef(uid), data, { merge: true });
  };

  return { settings, loading, updateSettings };
}
