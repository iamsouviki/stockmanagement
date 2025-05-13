'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { getUserProfile } from '@/services/userService';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; // Ensure toast is imported if used

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
  const [isLoading, setIsLoading] = useState(true); // Start true
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // console.log("AuthProvider: Mounting. Initial isLoading:", isLoading);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // console.log("AuthProvider: onAuthStateChanged triggered. User:", user ? user.uid : null);
      setIsLoading(true); // Ensure loading is true while processing auth state
      if (user) {
        setCurrentUser(user);
        try {
          // console.log("AuthProvider: Fetching profile for UID:", user.uid);
          const profile = await getUserProfile(user.uid);
          // console.log("AuthProvider: Profile fetched:", profile ? { id: profile.id, role: profile.role } : null);
          setUserProfile(profile);
          if (!profile) {
            // console.warn("AuthProvider: User profile is null for authenticated user:", user.uid);
          }
        } catch (error) {
          console.error("AuthProvider: Error fetching user profile:", error);
          setUserProfile(null); 
        }
      } else {
        // console.log("AuthProvider: No authenticated user.");
        setCurrentUser(null);
        setUserProfile(null);
      }
      setIsLoading(false); 
      // console.log("AuthProvider: Finished processing auth state. isLoading:", false, "currentUser:", user ? user.uid : 'null', "userProfile:", userProfile ? userProfile.role : 'null');
    });

    return () => {
      // console.log("AuthProvider: Unmounting. Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount.

  const logout = async () => {
    // console.log("AuthProvider: Logout called.");
    // setIsLoading(true); // No need, onAuthStateChanged will handle state updates
    try {
      await firebaseSignOut(auth);
      // currentUser and userProfile will be set to null by onAuthStateChanged
      // which will also set isLoading appropriately.
      router.push('/login'); 
    } catch (error) {
      console.error("AuthProvider: Error signing out:", error);
      toast({ title: "Logout Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
      // setIsLoading(false); // Not needed here
    }
  };
  
  return (
    <AuthContext.Provider value={{ currentUser, userProfile, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
