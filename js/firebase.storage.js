import { getStorage, ref, uploadString, deleteObject, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-storage.js";
import { getApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";

const storage = getStorage(getApp());

window.uploadToFirebaseStorage = async function (path, base64Data, contentType) {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64Data, 'base64', { contentType });
    // Public URL
    return await getDownloadURL(storageRef);
};

window.deleteFromFirebaseStorage = async function (path) {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
}
