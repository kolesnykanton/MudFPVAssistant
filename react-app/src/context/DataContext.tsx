import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from './AuthContext';
import type { FlightInfo, FlightSpot, WithId } from '../types';

interface DataContextValue {
  flights: WithId<FlightInfo>[];
  spots: WithId<FlightSpot>[];
  flightsLoading: boolean;
  spotsLoading: boolean;
  addFlight: (f: Omit<FlightInfo, 'id'>) => Promise<string>;
  updateFlight: (id: string, data: Partial<Omit<FlightInfo, 'id'>>) => Promise<void>;
  deleteFlight: (id: string) => Promise<void>;
  addSpot: (s: Omit<FlightSpot, 'id'>) => Promise<string>;
  updateSpot: (id: string, data: Partial<Omit<FlightSpot, 'id'>>) => Promise<void>;
  deleteSpot: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { uid } = useAuth();
  const [flights, setFlights] = useState<WithId<FlightInfo>[]>([]);
  const [spots, setSpots] = useState<WithId<FlightSpot>[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(true);
  const [spotsLoading, setSpotsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setFlights([]);
      setFlightsLoading(false);
      setSpots([]);
      setSpotsLoading(false);
      return;
    }

    setFlightsLoading(true);
    const flightsQ = query(
      collection(db, `users/${uid}/FlightInfos`),
      orderBy('date', 'desc'),
      limit(100),
    );
    const unsubFlights = onSnapshot(flightsQ, snap => {
      setFlights(snap.docs.map(d => ({ id: d.id, ...d.data() } as WithId<FlightInfo>)));
      setFlightsLoading(false);
    });

    setSpotsLoading(true);
    const unsubSpots = onSnapshot(collection(db, `users/${uid}/FlightSpots`), snap => {
      setSpots(snap.docs.map(d => ({ id: d.id, ...d.data() } as WithId<FlightSpot>)));
      setSpotsLoading(false);
    });

    return () => {
      unsubFlights();
      unsubSpots();
    };
  }, [uid]);

  const addFlight = async (f: Omit<FlightInfo, 'id'>): Promise<string> => {
    if (!uid) throw new Error('Not authenticated');
    const ref = await addDoc(collection(db, `users/${uid}/FlightInfos`), f);
    return ref.id;
  };

  const updateFlight = async (id: string, data: Partial<Omit<FlightInfo, 'id'>>) => {
    if (!uid) throw new Error('Not authenticated');
    await updateDoc(doc(db, `users/${uid}/FlightInfos/${id}`), data as Record<string, unknown>);
  };

  const deleteFlight = async (id: string) => {
    if (!uid) throw new Error('Not authenticated');
    await deleteDoc(doc(db, `users/${uid}/FlightInfos/${id}`));
  };

  const addSpot = async (s: Omit<FlightSpot, 'id'>): Promise<string> => {
    if (!uid) throw new Error('Not authenticated');
    const ref = await addDoc(collection(db, `users/${uid}/FlightSpots`), s);
    return ref.id;
  };

  const updateSpot = async (id: string, data: Partial<Omit<FlightSpot, 'id'>>) => {
    if (!uid) throw new Error('Not authenticated');
    await updateDoc(doc(db, `users/${uid}/FlightSpots/${id}`), data as Record<string, unknown>);
  };

  const deleteSpot = async (id: string) => {
    if (!uid) throw new Error('Not authenticated');
    await deleteDoc(doc(db, `users/${uid}/FlightSpots/${id}`));
  };

  return (
    <DataContext.Provider value={{
      flights, spots, flightsLoading, spotsLoading,
      addFlight, updateFlight, deleteFlight,
      addSpot, updateSpot, deleteSpot,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
