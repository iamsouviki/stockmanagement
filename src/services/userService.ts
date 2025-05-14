

import { db, auth as firebaseAuth } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, deleteDoc, writeBatch, query, orderBy, Timestamp } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/types';
// createUserWithEmailAndPassword is not used here, should be handled by client or admin SDK context
// import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser } from 'firebase/auth';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    return {
      id: userDocSnap.id,
      email: data.email || null,
      displayName: data.displayName || null,
      mobileNumber: data.mobileNumber || null,
      role: data.role,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
    } as UserProfile;
  }
  return null;
};

export const createFirestoreUserProfile = async (
  uid: string,
  email: string | null,
  displayName: string | null,
  role: UserRole,
  mobileNumber?: string | null
): Promise<UserProfile> => {
  const userDocRef = doc(db, 'users', uid);
  const profileDataToSave = {
    email,
    displayName,
    role,
    mobileNumber: mobileNumber || null,
    createdAt: serverTimestamp(), // Firestore will set this as Timestamp
    updatedAt: serverTimestamp(), // Firestore will set this as Timestamp
  };
  await setDoc(userDocRef, profileDataToSave);

  // Return a UserProfile object consistent with the type (dates as strings)
  // For immediate use after creation, we might not have the exact server timestamp resolved as string yet.
  // It's better to re-fetch using getUserProfile if the exact string representation is needed immediately.
  // Or, we can simulate it for the return type.
  // For now, the AuthProvider refetches, so this exact return value's date format might not be critical for initial display.
  // However, to be consistent with the UserProfile type, we should aim to return strings.
  // This is tricky because serverTimestamp() is a sentinel value.
  // A practical approach is that the consuming code (AuthProvider) refetches.
  // Or, we return a partial profile and let the refetch fill in the exact server-generated dates.

  // Let's return what we know, assuming AuthProvider refetches for precise timestamps.
  // The error is likely from data being passed later, not this immediate return if refetched.
  return {
    id: uid,
    email,
    displayName,
    mobileNumber: mobileNumber || null,
    role,
    // createdAt and updatedAt will be string | undefined once refetched by getUserProfile
    // For this immediate return, they are not yet server-converted ISO strings.
    // This is generally fine if the caller (AuthProvider) refetches.
  } as UserProfile; // Cast to satisfy the type, understanding refetch is key for dates.
};


export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  const usersCollectionRef = collection(db, 'users');
  const q = query(usersCollectionRef, orderBy('displayName', 'asc')); // Ensure displayName exists for sorting or use another field.
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email || null,
      displayName: data.displayName || null,
      mobileNumber: data.mobileNumber || null,
      role: data.role,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : undefined,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
    } as UserProfile;
  });
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'role' | 'mobileNumber'>>
): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  const updateData: any = { ...data, updatedAt: serverTimestamp() };
  if (data.mobileNumber === undefined && !('mobileNumber' in data)) {
    // If mobileNumber is not in data, don't try to set it to null unless explicitly provided as null
  } else if (data.mobileNumber === null || data.mobileNumber === '') {
     updateData.mobileNumber = null;
  }

  await updateDoc(userDocRef, updateData);
};

export const deleteUserAccountAndProfile = async (uidToDelete: string): Promise<void> => {
  const batch = writeBatch(db);
  const userProfileRef = doc(db, "users", uidToDelete);
  batch.delete(userProfileRef);
  // Note: Firebase Auth user deletion typically requires Admin SDK (backend process).
  // This function only deletes the Firestore profile.
  await batch.commit();
  console.warn(`Firestore profile for UID ${uidToDelete} deleted. Firebase Auth user account may still exist.`);
};
