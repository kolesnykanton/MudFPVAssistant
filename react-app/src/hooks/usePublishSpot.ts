import { useCallback } from 'react';
import {
  doc, setDoc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, getBytes, deleteObject } from 'firebase/storage';
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
      storagePath: spot.storagePath ? `communitySpots/${spot.name}-${Date.now()}/${spot.storagePath.split('/').pop()}` : undefined,
      ownerId: uid,
      ownerName: user.displayName || user.email || 'Anonymous',
      ownerPhotoUrl: user.photoURL || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      favoriteCount: 0,
    };

    try {
      // Copy photo if present
      if (spot.photoUrl && spot.storagePath) {
        try {
          const originalRef = storageRef(storage, spot.storagePath);
          const originalBlob = await getBytes(originalRef);
          const communityRef = storageRef(storage, communitySpot.storagePath!);
          await uploadBytes(communityRef, originalBlob);
          communitySpot.photoUrl = await getDownloadURL(communityRef);
        } catch (err) {
          console.warn('[publish] photo copy failed, continuing without photo:', err);
          communitySpot.photoUrl = undefined;
          communitySpot.storagePath = undefined;
        }
      }

      // Create community spot doc
      const communityDocRef = doc(collection(db, 'communitySpots'));
      await setDoc(communityDocRef, {
        ...communitySpot,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update private spot with reference
      await updateDoc(doc(db, `users/${uid}/FlightSpots/${spot.id}`), {
        publishedAsId: communityDocRef.id,
      });

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

      // Delete community photo
      if (communityData?.storagePath) {
        try {
          await deleteObject(storageRef(storage, communityData.storagePath));
        } catch {
          // already gone
        }
      }

      // Delete community spot
      await deleteDoc(communityDocRef);

      // Clear reference on private spot
      await updateDoc(doc(db, `users/${uid}/FlightSpots/${spotId}`), {
        publishedAsId: undefined,
      });
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
      storagePath: communitySpot.storagePath,
      clonedFromCommunityId: communitySpot.id,
    };

    try {
      const docRef = await addDoc(collection(db, `users/${uid}/FlightSpots`), mySpot);
      return docRef.id;
    } catch (err) {
      console.error('[clone] error:', err);
      throw err;
    }
  }, [uid]);

  return { publishSpot, unpublishSpot, cloneToMySpots };
}
