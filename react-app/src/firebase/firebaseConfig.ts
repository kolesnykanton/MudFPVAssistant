import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBhb2rdqC80K2HJK2cZNgOQxzDcE6x_ye4',
  authDomain: 'fpv-companion.firebaseapp.com',
  projectId: 'fpv-companion',
  storageBucket: 'fpv-companion.firebasestorage.app',
  messagingSenderId: '402996862257',
  appId: '1:402996862257:web:68020e9223a616410',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const storage = getStorage(app);

// initializeFirestore must be called before any getFirestore() call to enable persistence
let _db: Firestore;
try {
  _db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  _db = getFirestore(app);
}
export const db = _db;
