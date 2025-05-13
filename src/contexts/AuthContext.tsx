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

// Firebase Auth handles user session persistence by default.
// - By default, it uses 'local' persistence, meaning the user stays signed in
//   even after closing the browser, until they explicitly sign out.
// - ID tokens are short-lived (1 hour) but are automatically refreshed by the SDK
//   as long as the user's session is active and the refresh token is valid.
// - This means users "don't have to login every time" and will "stay login for 24 hr" (and much longer)
//   without needing additional state management libraries like Redux for this specific purpose.
// - This AuthContext makes the currentUser and userProfile available throughout the app.

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          if (!profile && pathname !== '/user-setup' && pathname !== '/login') { 
            // If profile doesn't exist and not on setup/login, further action might be needed.
            // For example, redirect to a profile setup page or show an error.
            // console.warn("User profile not found for UID:", user.uid, "on page:", pathname);
            // If roles are critical for routing and the profile is null, AuthGuard should handle redirection.
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null); 
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]); // Added router to dependencies, though its direct use in this effect is minimal now

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // State will be updated by onAuthStateChanged listener
      // setCurrentUser(null);
      // setUserProfile(null);
      router.push('/login'); // Explicitly redirect to login after sign out
    } catch (error) {
      console.error("Error signing out:", error);
      // Handle error (e.g., show toast)
    } finally {
        // setIsLoading(false); // isLoading will be set to false by onAuthStateChanged
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
