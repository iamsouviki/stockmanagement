'use server';

import { db, auth as firebaseAuth } from '@/lib/firebase'; // Import firebaseAuth for auth operations
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { UserProfile, UserRole } from '@/types';
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser } from 'firebase/auth'; // For creating auth user

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    // Ensure the id field is the UID from the document ID, not from data
    return { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
  }
  return null;
};

export const createUserProfileAndAccount = async (
  email: string,
  passwordInCleartext: string,
  displayName: string | null,
  role: UserRole,
  mobileNumber?: string | null,
): Promise<{ uid: string; profile: UserProfile }> => {
  // Step 1: Create Firebase Auth user
  // This should ideally be done in a secure environment (e.g., Cloud Function if not an admin panel)
  // For admin panel context, direct creation might be acceptable with strong auth rules.
  // For this implementation, we'll proceed as if it's an admin panel action.
  // NOTE: This is a placeholder for proper auth user creation.
  // Directly using createUserWithEmailAndPassword client-side for *other* users is not standard.
  // This function is 'use server' so it runs on the server.
  // However, Firebase Admin SDK is typically used for this in backend environments.
  // Since we don't have Admin SDK setup here directly, we'll simulate.
  // This part needs careful consideration for production security.
  // For now, we will assume this function is called from a context where creating users is permitted.
  // A more robust solution for creating users on behalf of others would use a Cloud Function with Admin SDK.

  // Placeholder: In a real scenario, you'd use Firebase Admin SDK or a Cloud Function.
  // For this exercise, we'll mock the auth creation part if not in a true backend.
  // Let's assume the auth user part is handled elsewhere or this is a privileged operation.
  // The prompt asks to "create new users", implying auth account + profile.

  // This is a conceptual guide. For actual user creation via server action:
  // 1. Set up Firebase Admin SDK on your server environment (not client-side).
  // 2. Create an API route or server action that uses `admin.auth().createUser()`.
  // For now, let's focus on creating the Firestore profile, assuming UID is obtained.
  // We will use the client-side `createUserWithEmailAndPassword` for simplicity in this context,
  // understanding its limitations for creating users *by an admin*.
  // This is generally for user self-signup.
  // --> We will simulate the UID part, and focus on the Firestore profile.

  // **If this `userService.ts` is truly a 'use server' file imported by client components,
  // then it can't directly use client-side Firebase Auth SDKs like createUserWithEmailAndPassword easily.
  // It's better to have an API endpoint or a dedicated server action for this.
  // For now, this function will only create the Firestore profile part.
  // The actual auth account creation logic needs to be separate or handled by Admin SDK.

  // Simplified: Assuming UID is provided after auth user is created elsewhere (e.g. admin calls this after creating auth user)
  // Or, if this were a user self-signup flow, it would be different.

  // Let's adjust to the request: owner creates new users.
  // This function will create the Firestore profile. The auth account creation would be a separate step by the owner.
  // For now, we'll assume uid is passed in (after auth creation)

  // Re-evaluating based on client-side admin panel context:
  // An admin panel *can* use `createUserWithEmailAndPassword` but it signs in the *current browser session*
  // as the new user temporarily. This is not ideal.
  // The most common pattern for "admin creates user" is via Admin SDK in a backend/Cloud Function.

  // Given the current structure, we'll proceed with creating the Firestore profile,
  // and the calling code (UserManagementDialog) will handle the `createUserWithEmailAndPassword`
  // and then call this function. This is a simplification.

  const userDocRef = doc(db, 'users', email); // Using email as ID here is NOT standard. UID should be used.
                                        // This needs to be fixed if `uid` is available from auth creation.
                                        // Corrected below - this function should receive UID.

  // This function SHOULD receive UID from the auth creation step.
  // The calling component (e.g., UserManagementDialog) will handle Firebase Auth user creation
  // and then pass the UID to this function.

  throw new Error("createUserProfileAndAccount needs to be refactored. Auth user creation should be separate or use Admin SDK.");
  // This is a placeholder. The actual implementation will be in the page/dialog component.
  // This service will only handle the Firestore profile part once UID is obtained.
};


export const createFirestoreUserProfile = async (
  uid: string,
  email: string | null,
  displayName: string | null,
  role: UserRole,
  mobileNumber?: string | null
): Promise<UserProfile> => {
  const userDocRef = doc(db, 'users', uid);
  const profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
    email,
    displayName,
    role,
    mobileNumber: mobileNumber || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(userDocRef, profileData);
  return { id: uid, ...profileData } as UserProfile; // Timestamps will be resolved by Firestore
};


export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  const usersCollectionRef = collection(db, 'users');
  const q = query(usersCollectionRef, orderBy('displayName', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'role' | 'mobileNumber'>>
): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  const updateData: any = { ...data, updatedAt: serverTimestamp() };
  if (data.mobileNumber === undefined) { // Ensure mobileNumber can be explicitly set to null or removed
    updateData.mobileNumber = null;
  }
  await updateDoc(userDocRef, updateData);
};


// Deleting a user profile and their auth account.
// IMPORTANT: Deleting Firebase Auth users client-side is highly restricted for security.
// Typically, this requires the Firebase Admin SDK run in a trusted server environment (e.g., Cloud Function).
// This function will delete the Firestore profile. The Auth account deletion needs a backend solution.
export const deleteUserAccountAndProfile = async (uidToDelete: string): Promise<void> => {
  // This is a placeholder for a secure deletion process.
  // In a real app, you'd call a Cloud Function that uses the Admin SDK to delete the Auth user
  // and then deletes the Firestore profile, or use a batch write.

  // For now, we'll only delete the Firestore profile and acknowledge the Auth user remains.
  // Firebase client SDK does not allow deleting other users.
  // The logged-in user can only delete their OWN account using `auth.currentUser.delete()`.

  const batch = writeBatch(db);
  const userProfileRef = doc(db, "users", uidToDelete);
  batch.delete(userProfileRef);
  // Add deletion of other user-related data here if necessary (e.g., their specific settings)

  // Regarding Auth user deletion:
  // If you have Firebase Admin SDK setup (e.g. in a Cloud Function callable by owner):
  // await admin.auth().deleteUser(uidToDelete);
  // This is NOT possible directly from client-side for another user.

  await batch.commit();
  console.warn(`Firestore profile for UID ${uidToDelete} deleted. Firebase Auth user account may still exist if not handled by a backend process.`);
};
