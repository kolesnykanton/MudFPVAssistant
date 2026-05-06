import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  type AuthError,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, provider } from '../firebase/firebaseConfig';

interface AuthContextType {
  user: User | null;
  uid: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle the return leg of signInWithRedirect (popup fallback).
    // Errors here surface from Firebase itself, not user action — log and move on.
    getRedirectResult(auth).catch(err => console.warn('[auth] redirect result:', err));

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = (e as AuthError)?.code;
      // Popup is unavailable in many in-app browsers and on some PWAs.
      // Fall back to redirect; ignore deliberate user cancels.
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      throw e;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, uid: user?.uid ?? null, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
