import { useEffect } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { notifications } from '@mantine/notifications';
import { storage, db } from '../firebase/firebaseConfig';
import { pendingPhotoStore } from '../utils/pendingPhotoStore';

async function syncPendingPhotos(uid: string) {
  let entries;
  try {
    entries = await pendingPhotoStore.getAll();
  } catch {
    return;
  }

  const mine = entries.filter(e => e.uid === uid);
  if (!mine.length) return;

  let synced = 0;
  for (const entry of mine) {
    try {
      const path = `users/${uid}/FlightSpots/${entry.spotId}/${entry.fileName}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, entry.blob);
      const photoUrl = await getDownloadURL(fileRef);
      await updateDoc(doc(db, `users/${uid}/FlightSpots/${entry.spotId}`), {
        photoUrl,
        storagePath: path,
      });
      await pendingPhotoStore.remove(entry.id!);
      synced++;
    } catch {
      // leave in queue for next reconnect attempt
    }
  }

  if (synced > 0) {
    notifications.show({
      color: 'green',
      message: `${synced} spot photo${synced > 1 ? 's' : ''} uploaded.`,
    });
  }
}

export function useOfflineSync(uid: string | null) {
  useEffect(() => {
    if (!uid) return;
    // Run on mount in case there are queued photos from a previous offline session
    if (navigator.onLine) syncPendingPhotos(uid);
    const handler = () => syncPendingPhotos(uid);
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [uid]);
}
