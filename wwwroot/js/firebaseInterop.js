// wwwroot/js/firebaseInterop.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
    getFirestore,
    connectFirestoreEmulator,
    enableIndexedDbPersistence,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {
    getStorage,
    connectStorageEmulator,
    ref,
    uploadString,
    deleteObject,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

// 1) Ініціалізація Firebase App
const firebaseConfig = {
    apiKey: "AIzaSyBhb2rdqC80K2HJK2cZNgOQxzDcE6x_ye4",
    authDomain: "fpv-companion.firebaseapp.com",
    projectId: "fpv-companion",
    storageBucket: "fpv-companion.firebasestorage.app",
    messagingSenderId: "402996862257",
    appId: "1:402996862257:web:68020e9223a616410"
};
const app = initializeApp(firebaseConfig);

// 2) Ініціалізація Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 3) Ініціалізація Firestore (але ми не робимо жодних викликів CRUD прямо тут)
const db = getFirestore(app);

// 4) Ініціалізація Storage
const storage = getStorage(app);

// === A. Функція для підключення емуляторів ===
export function connectEmulators() {
    // а) Firestore Emulator
    connectFirestoreEmulator(db, "localhost", 8080);
    // б) Storage Emulator
    connectStorageEmulator(storage, "localhost", 9199);

    console.log("🔥 Emulators connected: Firestore @ localhost:8080, Storage @ localhost:9199");
}

// === B. Функція для вмикання Offline Persistence ===
export async function enableOfflinePersistence() {
    try {
        await enableIndexedDbPersistence(db);
        console.log("✅ Offline Persistence enabled for Firestore");
    } catch (err) {
        // Найчастіші причини: браузер не підтримує або кілька вкладок
        console.warn("⚠️ Could not enable Offline Persistence:", err.code);
    }
}

// === C. Методи Auth ===
window.signInWithGoogle = async () => {
    const { user } = await signInWithPopup(auth, provider);
    return { uid: user.uid, email: user.email, displayName: user.displayName };
};
window.signOutUser = () => signOut(auth);
window.getCurrentUser = () => {
    const u = auth.currentUser;
    return u ? { uid: u.uid, email: u.email, displayName: u.displayName } : null;
};
window.subscribeAuthState = dotnetRef =>
    onAuthStateChanged(auth, user => dotnetRef.invokeMethodAsync("OnAuthStateChanged", user?.uid || null));

// === D. Методи Firestore CRUD ===
function userColl(uid, collName) {
    return collection(db, "users", uid, collName);
}

window.addUserDoc = async (uid, coll, obj) => {
    const docRef = await addDoc(userColl(uid, coll), obj);
    return docRef.id;
};
window.getUserDocs = async (uid, coll) => {
    const snap = await getDocs(userColl(uid, coll));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
window.updateUserDoc = (uid, coll, id, obj) =>
    setDoc(doc(db, "users", uid, coll, id), obj, { merge: true });
window.deleteUserDoc = (uid, coll, id) =>
    deleteDoc(doc(db, "users", uid, coll, id));

// === E. Методи Storage CRUD ===
window.uploadToFirebaseStorage = async function (path, base64Data, contentType) {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64Data, 'base64', { contentType });
    return await getDownloadURL(storageRef);
};
window.deleteFromFirebaseStorage = async function (path) {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
};
