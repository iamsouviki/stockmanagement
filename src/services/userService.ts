'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
  }
  return null;
};

// This function would typically be called by an admin or a secure cloud function
// For now, it's here for completeness but not directly used by client-side user creation.
export const createUserProfile = async (
  uid: string,
  email: string | null,
  displayName: string | null,
  role: UserRole
): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, {
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
