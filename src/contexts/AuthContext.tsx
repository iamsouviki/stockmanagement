// src/contexts/AuthContext.tsx
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase'; // Import db
import type { UserProfile, UserRole } from '@/types';
import { getUserProfile, createFirestoreUserProfile } from '@/services/userService'; // Import createFirestoreUserProfile
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, limit } from 'firebase/firestore'; // Import Firestore functions

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          let profile = await getUserProfile(user.uid);

          if (!profile) {
            // No profile exists, determine role and create one
            const usersCollectionRef = collection(db, 'users');
            const ownerQuery = query(usersCollectionRef, where('role', '==', 'owner'), limit(1));
            const ownerSnapshot = await getDocs(ownerQuery);

            let newRole: UserRole = 'employee';
            if (ownerSnapshot.empty) {
              newRole = 'owner';
              toast({
                title: "Welcome, Owner!",
                description: "You are the first user and have been assigned the Owner role.",
                duration: 7000,
              });
            } else {
              newRole = 'employee';
               toast({
                title: "Account Initialized",
                description: "Your user profile has been created with the Employee role.",
                duration: 5000,
              });
            }
            
            // Use available info from FirebaseUser. displayName and phoneNumber might be null.
            await createFirestoreUserProfile(
              user.uid,
              user.email,
              user.displayName,
              newRole,
              user.phoneNumber // This is often null unless explicitly set or from certain auth providers
            );
            profile = await getUserProfile(user.uid); // Fetch the newly created profile
          }
          setUserProfile(profile);
          if (!profile) {
            console.warn("AuthProvider: User profile is null for authenticated user after attempted creation:", user.uid);
          }

        } catch (error) {
          console.error("AuthProvider: Error during profile processing:", error);
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // Added toast to dependency array

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      // Auth state change will be handled by onAuthStateChanged
      router.push('/login');
    } catch (error) {
      console.error("AuthProvider: Error signing out:", error);
      toast({ title: "Logout Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => { // Renamed to avoid conflict with hook folder
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
