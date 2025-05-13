'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { getUserProfile } from '@/services/userService';
import { useRouter, usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  useEffect(() => {
    // console.log("AuthProvider: useEffect triggered. Pathname:", pathname);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // console.log("AuthProvider: onAuthStateChanged fired. User:", user ? user.uid : null);
      setIsLoading(true); // Set loading true at the start of auth state processing
      if (user) {
        setCurrentUser(user);
        try {
          // console.log("AuthProvider: Fetching profile for UID:", user.uid);
          const profile = await getUserProfile(user.uid);
          // console.log("AuthProvider: Profile fetched:", profile);
          setUserProfile(profile);
        } catch (error) {
          console.error("AuthProvider: Error fetching user profile:", error);
          setUserProfile(null); 
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setIsLoading(false); // Set loading false after all processing
      // console.log("AuthProvider: isLoading set to false. currentUser:", user ? user.uid : null, "userProfile:", userProfile ? userProfile.role : null);
    });

    return () => {
      // console.log("AuthProvider: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    }
  }, []); // Removed pathname and router from dependencies; onAuthStateChanged should only run once to set up listener.

  const logout = async () => {
    // console.log("AuthProvider: Logout called.");
    setIsLoading(true); // Indicate loading during logout
    try {
      await firebaseSignOut(auth);
      // currentUser and userProfile will be set to null by onAuthStateChanged
      router.push('/login'); 
    } catch (error) {
      console.error("AuthProvider: Error signing out:", error);
      toast({ title: "Logout Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
    } finally {
      // setIsLoading(false); // onAuthStateChanged will handle setting isLoading to false
    }
  };
  
  // Add a toast import if you uncomment the toast line above
  // import { toast } from '@/hooks/use-toast';


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
