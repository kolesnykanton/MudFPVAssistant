import { useCallback } from 'react';
import {
  doc, collection, addDoc, updateDoc, serverTimestamp, getDoc,
  writeBatch, deleteField,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, getBytes, deleteObject, getMetadata } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import type { FlightSpot, CommunitySpot } from '../types';

export function usePublishSpot() {
  const { uid, user } = useAuth();

  const publishSpot = useCallback(async (spot: FlightSpot & { id: string }) => {
    if (!uid || !user) throw new Error('Not authenticated');

    const communitySpot: Omit<CommunitySpot, 'id'> = {
      name: spot.name,
      latitude: spot.latitude,
      longitude: spot.longitude,
      comments: spot.comments,
      category: spot.category,
      tags: spot.tags,
      photoUrl: spot.photoUrl,
      storagePath: spot.storagePath ? `communitySpots/${spot.name.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}/${spot.storagePath.split('/').pop()}` : undefined,
      ownerId: uid,
      ownerName: user.displayName || user.email || 'Anonymous',
      ownerPhotoUrl: user.photoURL || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      favoriteCount: 0,
    };

    try {
      // Copy photo if present. Failure aborts the whole publish so we never
      // create a community spot with a broken/missing photo.
      if (spot.photoUrl && spot.storagePath) {
        const originalRef = storageRef(storage, spot.storagePath);
        const [originalBlob, originalMeta] = await Promise.all([
          getBytes(originalRef),
          getMetadata(originalRef),
        ]);
        const communityRef = storageRef(storage, communitySpot.storagePath!);
        await uploadBytes(communityRef, originalBlob, { contentType: originalMeta.contentType });
        communitySpot.photoUrl = await getDownloadURL(communityRef);
      }

      // Atomically create community spot + back-reference on private spot
      const communityDocRef = doc(collection(db, 'communitySpots'));
      const docData = Object.fromEntries(
        Object.entries({ ...communitySpot, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
          .filter(([, v]) => v !== undefined),
      );
      const batch = writeBatch(db);
      batch.set(communityDocRef, docData);
      batch.update(doc(db, `users/${uid}/FlightSpots/${spot.id}`), {
        publishedAsId: communityDocRef.id,
      });
      await batch.commit();

      return communityDocRef.id;
    } catch (err) {
      console.error('[publish] error:', err);
      throw err;
    }
  }, [uid, user]);

  const unpublishSpot = useCallback(async (spotId: string, publishedAsId: string) => {
    if (!uid) throw new Error('Not authenticated');

    try {
      const communityDocRef = doc(db, `communitySpots/${publishedAsId}`);
      const communityDoc = await getDoc(communityDocRef);
      const communityData = communityDoc.data() as CommunitySpot | undefined;

      if (!communityDoc.exists()) {
        // Community spot already gone — clear the dangling publishedAsId so the user can re-publish
        await updateDoc(doc(db, `users/${uid}/FlightSpots/${spotId}`), {
          publishedAsId: deleteField(),
        });
        return;
      }

      if (communityData?.ownerId !== uid) throw new Error('Not authorized to unpublish this spot');

      // Delete community photo
      if (communityData?.storagePath) {
        try {
          await deleteObject(storageRef(storage, communityData.storagePath));
        } catch {
          // already gone
        }
      }

      // Atomically delete community spot + clear reference on private spot
      const unpublishBatch = writeBatch(db);
      unpublishBatch.delete(communityDocRef);
      unpublishBatch.update(doc(db, `users/${uid}/FlightSpots/${spotId}`), {
        publishedAsId: deleteField(),
      });
      await unpublishBatch.commit();
    } catch (err) {
      console.error('[unpublish] error:', err);
      throw err;
    }
  }, [uid]);

  const cloneToMySpots = useCallback(async (communitySpot: CommunitySpot & { id: string }) => {
    if (!uid) throw new Error('Not authenticated');

    const mySpot: FlightSpot = {
      name: communitySpot.name,
      latitude: communitySpot.latitude,
      longitude: communitySpot.longitude,
      comments: communitySpot.comments,
      category: communitySpot.category,
      tags: communitySpot.tags,
      photoUrl: communitySpot.photoUrl,
      // storagePath intentionally omitted: clone must not share community storage path,
      // otherwise photo deletion on the clone would delete the shared community file.
      clonedFromCommunityId: communitySpot.id,
    };

    try {
      const docData = Object.fromEntries(
        Object.entries(mySpot).filter(([, v]) => v !== undefined),
      );
      const docRef = await addDoc(collection(db, `users/${uid}/FlightSpots`), docData);
      return docRef.id;
    } catch (err) {
      console.error('[clone] error:', err);
      throw err;
    }
  }, [uid]);

  return { publishSpot, unpublishSpot, cloneToMySpots };
}
