
// src/contexts/AuthContext.tsx
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase'; // Import db
import type { UserProfile, UserRole } from '@/types';
import { getUserProfile, createFirestoreUserProfile } from '@/services/userService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

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
    console.log("AuthContext: Subscribing to onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: onAuthStateChanged triggered. User:", user ? user.uid : null);
      setIsLoading(true); 
      try {
        if (user) {
          setCurrentUser(user);
          console.log("AuthContext: User is authenticated. Fetching profile for UID:", user.uid);
          let profile = await getUserProfile(user.uid);
          console.log("AuthContext: Initial getUserProfile returned:", JSON.stringify(profile));

          if (!profile) {
            console.log(`AuthContext: No profile for ${user.uid}, attempting to create one.`);
            const usersCollectionRef = collection(db, 'users');
            const ownerQuery = query(usersCollectionRef, where('role', '==', 'owner'), limit(1));
            console.log("AuthContext: Querying for existing owner...");
            const ownerSnapshot = await getDocs(ownerQuery);
            console.log("AuthContext: Owner query snapshot empty:", ownerSnapshot.empty);

            let newRole: UserRole = 'employee'; 
            if (ownerSnapshot.empty) {
              newRole = 'owner';
              toast({
                title: "Welcome, Owner!",
                description: "You are the first user and have been assigned the Owner role.",
                duration: 7000,
              });
              console.log(`AuthContext: Assigning role 'owner' to ${user.uid}.`);
            } else {
              newRole = 'employee';
               toast({
                title: "Account Initialized",
                description: "Your user profile has been created with the Employee role.",
                duration: 5000,
              });
              console.log(`AuthContext: Assigning role 'employee' to ${user.uid}.`);
            }
            
            await createFirestoreUserProfile(
              user.uid,
              user.email,
              user.displayName,
              newRole,
              user.phoneNumber
            );
            console.log(`AuthContext: Profile creation attempt for ${user.uid} with role ${newRole} finished. Refetching profile...`);
            profile = await getUserProfile(user.uid); 
            if (!profile) {
                console.error(`AuthContext: CRITICAL - Profile still null after creation for ${user.uid}`);
            } else {
                console.log(`AuthContext: Profile created and refetched for ${user.uid}:`, JSON.stringify(profile));
            }
          } else {
            console.log(`AuthContext: Profile found for ${user.uid}:`, JSON.stringify(profile));
          }
          setUserProfile(profile);
          console.log("AuthContext: setUserProfile called with (after fetch/create):", JSON.stringify(profile));

        } else {
          console.log("AuthContext: No user authenticated. Clearing currentUser and userProfile.");
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("AuthContext: Error during onAuthStateChanged logic:", error);
        setCurrentUser(null); // Ensure states are cleared on error too
        setUserProfile(null);
      } finally {
        console.log("AuthContext: Setting isLoading to false.");
        setIsLoading(false);
      }
    });

    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const logout = async () => {
    setIsLoading(true); // Optional: set loading true during logout process
    try {
      await firebaseSignOut(auth);
      // Auth state change (currentUser to null) will be handled by onAuthStateChanged
      router.push('/login');
      // No need to manually set currentUser/userProfile to null here, onAuthStateChanged handles it.
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      console.error("AuthProvider: Error signing out:", error);
      toast({ title: "Logout Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
    } finally {
        // setIsLoading(false); // onAuthStateChanged will set this once user becomes null
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
