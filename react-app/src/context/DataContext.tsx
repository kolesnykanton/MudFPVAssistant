import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc,
  query, orderBy, limit,
} from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';
import { useCommunitySpots } from '../hooks/useCommunitySpots';
import { useFavorites } from '../hooks/useFavorites';
import type { FlightInfo, FlightSpot, CommunitySpot, WithId } from '../types';

interface DataContextValue {
  flights: WithId<FlightInfo>[];
  spots: WithId<FlightSpot>[];
  communitySpots: WithId<CommunitySpot>[];
  favoriteIds: Set<string>;
  flightsLoading: boolean;
  spotsLoading: boolean;
  communityLoading: boolean;
  favoritesLoading: boolean;
  addFlight: (f: Omit<FlightInfo, 'id'>) => Promise<string>;
  updateFlight: (id: string, data: Partial<Omit<FlightInfo, 'id'>>) => Promise<void>;
  deleteFlight: (id: string) => Promise<void>;
  addSpot: (s: Omit<FlightSpot, 'id'>) => Promise<string>;
  updateSpot: (id: string, data: Partial<Omit<FlightSpot, 'id'>>) => Promise<void>;
  deleteSpot: (id: string) => Promise<void>;
  toggleFavorite: (spotId: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { uid } = useAuth();
  const [flights, setFlights] = useState<WithId<FlightInfo>[]>([]);
  const [spots, setSpots] = useState<WithId<FlightSpot>[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(true);
  const [spotsLoading, setSpotsLoading] = useState(true);

  const { communitySpots, loading: communityLoading } = useCommunitySpots(uid);
  const { favoriteIds, loading: favoritesLoading, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (!uid) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setFlights([]);
      setFlightsLoading(false);
      setSpots([]);
      setSpotsLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    setFlightsLoading(true);
    setSpotsLoading(true);

    const flightsQ = query(
      collection(db, `users/${uid}/FlightInfos`),
      orderBy('date', 'desc'),
      limit(100),
    );
    const unsubFlights = onSnapshot(flightsQ, snap => {
      setFlights(snap.docs.map(d => ({ id: d.id, ...d.data() } as WithId<FlightInfo>)));
      setFlightsLoading(false);
    }, err => {
      console.error('[firestore] flights listener error:', err);
      setFlightsLoading(false);
    });

    const unsubSpots = onSnapshot(collection(db, `users/${uid}/FlightSpots`), snap => {
      setSpots(snap.docs.map(d => ({ id: d.id, ...d.data() } as WithId<FlightSpot>)));
      setSpotsLoading(false);
    }, err => {
      console.error('[firestore] spots listener error:', err);
      setSpotsLoading(false);
    });

    return () => {
      unsubFlights();
      unsubSpots();
    };
  }, [uid]);

  const addFlight = useCallback(async (f: Omit<FlightInfo, 'id'>): Promise<string> => {
    if (!uid) throw new Error('Not authenticated');
    const ref = await addDoc(collection(db, `users/${uid}/FlightInfos`), f);
    return ref.id;
  }, [uid]);

  const updateFlight = useCallback(async (id: string, data: Partial<Omit<FlightInfo, 'id'>>) => {
    if (!uid) throw new Error('Not authenticated');
    await updateDoc(doc(db, `users/${uid}/FlightInfos/${id}`), data as Record<string, unknown>);
  }, [uid]);

  const deleteFlight = useCallback(async (id: string) => {
    if (!uid) throw new Error('Not authenticated');
    await deleteDoc(doc(db, `users/${uid}/FlightInfos/${id}`));
  }, [uid]);

  const addSpot = useCallback(async (s: Omit<FlightSpot, 'id'>): Promise<string> => {
    if (!uid) throw new Error('Not authenticated');
    const ref = await addDoc(collection(db, `users/${uid}/FlightSpots`), s);
    return ref.id;
  }, [uid]);

  const updateSpot = useCallback(async (id: string, data: Partial<Omit<FlightSpot, 'id'>>) => {
    if (!uid) throw new Error('Not authenticated');
    await updateDoc(doc(db, `users/${uid}/FlightSpots/${id}`), data as Record<string, unknown>);
  }, [uid]);

  const deleteSpot = useCallback(async (id: string) => {
    if (!uid) throw new Error('Not authenticated');
    const spotSnap = await getDoc(doc(db, `users/${uid}/FlightSpots/${id}`));
    const storagePath = spotSnap.data()?.storagePath as string | undefined;
    if (storagePath) {
      try { await deleteObject(storageRef(storage, storagePath)); } catch { /* already gone */ }
    }
    await deleteDoc(doc(db, `users/${uid}/FlightSpots/${id}`));
  }, [uid]);

  const value = useMemo(() => ({
    flights, spots, communitySpots, favoriteIds,
    flightsLoading, spotsLoading, communityLoading, favoritesLoading,
    addFlight, updateFlight, deleteFlight,
    addSpot, updateSpot, deleteSpot,
    toggleFavorite,
  }), [flights, spots, communitySpots, favoriteIds, flightsLoading, spotsLoading, communityLoading, favoritesLoading, addFlight, updateFlight, deleteFlight, addSpot, updateSpot, deleteSpot, toggleFavorite]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
