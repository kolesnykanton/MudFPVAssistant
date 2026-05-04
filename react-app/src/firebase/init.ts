import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { app } from './firebaseConfig';

export function initFirebase() {
  try {
    initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (e: unknown) {
    // initializeFirestore throws if called after getFirestore; safe to ignore
    const err = e as { code?: string };
    if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
      console.error('Offline persistence error:', e);
    }
  }
}
