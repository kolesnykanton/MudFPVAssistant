import { getApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    setDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Retrieve the already initialized Firebase App (initialization happens in index.html)
const app = getApp();
const db = getFirestore(app);

/**
 * Helper function that returns a reference to the "FlightSpots" subcollection for a specific user.
 * @param {string} uid – user identifier
 */
function userSpotsCollection(uid) {
    return collection(db, "users", uid, "FlightSpots");
}

/**
 * Adds a new spot to Firestore in the users/{uid}/spots collection.
 * @param {string} uid – user identifier
 * @param {object} spotObj – FlightSpot object (without the id field)
 * @returns {Promise<string>} – returns only the document ID as a string
 */
window.addUserSpot = async (uid, spotObj) => {
    const docRef = await addDoc(userSpotsCollection(uid), spotObj);
    return docRef.id;
};

/**
 * Retrieves all spots of a user from Firestore.
 * @param {string} uid – user identifier
 * @returns {Promise<Array>} – array of objects { latitude, longitude, name, comments, category, tags, id }
 */
window.getUserSpots = async (uid) => {
    const snap = await getDocs(userSpotsCollection(uid));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
};

/**
 * Updates a specific spot (merge: true) in Firestore.
 * @param {string} uid – user identifier
 * @param {string} spotId – spot document ID
 * @param {object} spotObj – object containing the fields to update
 * @returns {Promise<void>}
 */
window.updateUserSpot = async (uid, spotId, spotObj) => {
    return await setDoc(doc(db, "users", uid, "spots", spotId), spotObj, { merge: true });
};

/**
 * Deletes a spot by its document ID.
 * @param {string} uid – user identifier
 * @param {string} spotId – spot document ID
 * @returns {Promise<void>}
 */
window.deleteUserSpot = async (uid, spotId) => {
    return await deleteDoc(doc(db, "users", uid, "spots", spotId));
};