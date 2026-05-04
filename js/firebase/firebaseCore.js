import {initializeApp} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import {getAuth, GoogleAuthProvider} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import {getStorage} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBhb2rdqC80K2HJK2cZNgOQxzDcE6x_ye4",
    authDomain: "fpv-companion.firebaseapp.com",
    projectId: "fpv-companion",
    storageBucket: "fpv-companion.firebasestorage.app",
    messagingSenderId: "402996862257",
    appId: "1:402996862257:web:68020e9223a616410"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

export {app, db, auth, provider, storage};
