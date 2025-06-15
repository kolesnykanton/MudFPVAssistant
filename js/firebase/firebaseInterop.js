import { app, db, auth, provider, storage } from './firebaseCore.js';
import {
    connectFirestoreEmulator, enableIndexedDbPersistence,
    collection, addDoc, getDocs, setDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import {
    connectStorageEmulator, ref, uploadString, deleteObject, getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";
import {
    signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// 1. Emulators
export function connectEmulators() {
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
    console.log("Emulators connected");
}
export async function enableOfflinePersistence() {
    try {
        await enableIndexedDbPersistence(db);
        console.log("Offline Persistence enabled");
    } catch (err) {
        console.warn("Could not enable Offline Persistence:", err.code);
    }
}

// 2. Auth
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

// 3. Global CRUD for User Collections
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
window.updateUserDoc = async (uid, coll, id, data) => {
    const collRef = collection(db, "users", uid, coll);

    if (!id) {
        // 1) If id null or empty - create
        const docRef = await addDoc(collRef, data);
        return docRef.id;
    } else {
        // 2) OR — Update with merge: true
        const docRef = doc(collRef, id);
        await setDoc(docRef, data, { merge: true });
        return id;
    }
};
window.deleteUserDoc = (uid, coll, id) =>
    deleteDoc(doc(db, "users", uid, coll, id));

// 4. Storage
window.uploadToFirebaseStorage = async function (path, base64Data, contentType) {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64Data, 'base64', { contentType });
    return await getDownloadURL(storageRef);
};
window.deleteFromFirebaseStorage = async function (path) {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
};
