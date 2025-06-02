import {initializeApp} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
    getFirestore, enableIndexedDbPersistence,
    collection, addDoc, getDocs,
    deleteDoc, doc, setDoc
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup, signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBhb2rdqC80K2HJK2cZNgOQxzDcE6x_ye4",
    authDomain: "fpv-companion.firebaseapp.com",
    projectId: "fpv-companion",
    storageBucket: "fpv-companion.appspot.com",
    messagingSenderId: "402996862257",
    appId: "1:402996862257:web:68020e9223e6883a616410"
};

const app = initializeApp(firebaseConfig);

/* === 2. Enable Firestore offline persistence === */
const db = getFirestore(app);
enableIndexedDbPersistence(db)
    .catch((err) => {
        // If multiple tabs are open, persistence can only be enabled
        // in one tab at a a time. If another tab has persistence enabled,
        // you will get a failed-precondition error.
        if (err.code === 'failed-precondition') {
            console.warn("Persistence failed: another tab already has persistence enabled.");
        } else if (err.code === 'unimplemented') {
            // The browser does not support all features required to enable persistence
            console.warn("Persistence is not available in this browser.");
        }
    });
// If successful, Firestore will now cache data locally in IndexedDB
// and serve reads from cache when offline.
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* === 2.  AUTH helpers (JS-interop) === */
window.signInWithGoogle = async () => {
    const {user} = await signInWithPopup(auth, provider);
    return {uid: user.uid, email: user.email, displayName: user.displayName};
};
window.signOutUser = () => signOut(auth);
window.getCurrentUser = () => {
    const u = auth.currentUser;
    return u ? {uid: u.uid, email: u.email, displayName: u.displayName} : null;
};
window.subscribeAuthState = dotnetRef =>
    onAuthStateChanged(auth, user => dotnetRef.invokeMethodAsync("OnAuthStateChanged", user?.uid || null));

/* === 3.  Firestore CRUD with UID === */
const userColl = (uid, coll) => collection(db, "users", uid, coll);

window.addUserDoc = async (uid, coll, obj) => {
    const docRef = await addDoc(userColl(uid, coll), obj);
    return docRef.id;
};

window.getUserDocs = async (uid, coll) => {
    const snap = await getDocs(userColl(uid, coll));
    return snap.docs.map(d => ({id: d.id, ...d.data()}));
};
window.updateUserDoc = (uid, coll, id, obj) =>
    setDoc(doc(db, "users", uid, coll, id), obj, {merge: true});
window.deleteUserDoc = (uid, coll, id) =>
    deleteDoc(doc(db, "users", uid, coll, id));
window.addDocument = async function (collectionName, docObj) {
    return await addDoc(collection(db, collectionName), docObj);
};