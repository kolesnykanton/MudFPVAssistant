// Додати документ у будь-яку колекцію
window.addDocument = async function (collection, doc) {
    return await window.db.collection(collection).add(doc);
};

// Отримати всі документи з колекції
window.getDocuments = async function (collection) {
    const snapshot = await window.db.collection(collection).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Оновити документ по id (merge: true оновить лише передані поля)
window.updateDocument = async function (collection, id, doc) {
    return await window.db.collection(collection).doc(id).set(doc, { merge: true });
};

// Видалити документ по id
window.deleteDocument = async function (collection, id) {
    return await window.db.collection(collection).doc(id).delete();
};
