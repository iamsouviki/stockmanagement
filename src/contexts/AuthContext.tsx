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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          if (!profile && pathname !== '/user-setup') { // Redirect if profile doesn't exist, unless on setup page
            // Potentially redirect to a profile setup page or handle as needed.
            // For now, we assume profiles are pre-created or managed elsewhere.
            // console.warn("User profile not found for UID:", user.uid);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null); // Ensure profile is null on error
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
         // Redirect to login if not authenticated and not on public pages
        if (pathname !== '/login') { // Add other public paths if any
          // router.push('/login'); // Commented out for now, AuthGuard will handle this.
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      // Handle error (e.g., show toast)
    } finally {
        setIsLoading(false);
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
