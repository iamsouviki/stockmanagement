'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectPath?: string;
}

const PageSkeleton = () => (
  <div className="space-y-6 p-4">
    <Skeleton className="h-10 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
    <Skeleton className="h-60 w-full" />
  </div>
);

export default function AuthGuard({ children, allowedRoles, redirectPath = '/login' }: AuthGuardProps) {
  const { currentUser, userProfile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorizedToRender, setIsAuthorizedToRender] = useState(false);

  useEffect(() => {
    // Default to not authorized until checks pass
    let newAuthorizedState = false; 
    // console.log(
    //   `AuthGuard (${pathname}): Effect run. AuthLoading: ${isAuthLoading}, ` +
    //   `CurrentUser: ${currentUser ? currentUser.uid : 'null'}, ` +
    //   `UserProfile: ${userProfile ? userProfile.role : 'null'}, ` +
    //   `AllowedRoles: ${allowedRoles?.join(',')}, ` +
    //   `Current isAuthorizedToRender: ${isAuthorizedToRender}`
    // );

    if (isAuthLoading) {
      // console.log(`AuthGuard (${pathname}): Auth is loading. Not authorizing render yet.`);
      // newAuthorizedState remains false
    } else {
      // Auth loading is false, proceed with checks
      if (!currentUser) {
        // console.log(`AuthGuard (${pathname}): No current user.`);
        if (pathname !== redirectPath) {
          // console.log(`AuthGuard (${pathname}): Not on redirect path. Redirecting to ${redirectPath}.`);
          router.replace(redirectPath);
          // newAuthorizedState remains false (skeleton shown during redirect)
        } else {
          // console.log(`AuthGuard (${pathname}): On redirect path (${redirectPath}). Authorizing render (e.g., LoginForm).`);
          newAuthorizedState = true; // On login page, allow rendering children (LoginForm)
        }
      } else {
        // User is authenticated (currentUser exists)
        // console.log(`AuthGuard (${pathname}): User ${currentUser.uid} is authenticated.`);
        if (allowedRoles && allowedRoles.length > 0) {
          // console.log(`AuthGuard (${pathname}): Roles required: ${allowedRoles.join(', ')}.`);
          if (!userProfile) {
            // console.warn(`AuthGuard (${pathname}): User authenticated but profile is null. Cannot check roles. Redirecting to /.`);
            if (pathname !== '/') router.replace('/'); // Or a specific "unauthorized" page
            // newAuthorizedState remains false
          } else if (!allowedRoles.includes(userProfile.role)) {
            // console.warn(`AuthGuard (${pathname}): User role '${userProfile.role}' not in allowed roles: ${allowedRoles.join(', ')}. Redirecting to /.`);
            if (pathname !== '/') router.replace('/'); // Or a specific "unauthorized" page
            // newAuthorizedState remains false
          } else {
            // console.log(`AuthGuard (${pathname}): User role '${userProfile.role}' is allowed. Authorizing render.`);
            newAuthorizedState = true; // Role check passed
          }
        } else {
          // No specific roles required, user is authenticated
          // console.log(`AuthGuard (${pathname}): No specific roles required. Authorizing render.`);
          newAuthorizedState = true;
        }
      }
    }
    
    if (isAuthorizedToRender !== newAuthorizedState) {
      setIsAuthorizedToRender(newAuthorizedState);
    }

  }, [currentUser, userProfile, isAuthLoading, router, allowedRoles, redirectPath, pathname, isAuthorizedToRender]);


  if (isAuthLoading) {
    // console.log(`AuthGuard (${pathname}): Rendering PageSkeleton because isAuthLoading is true.`);
    return <PageSkeleton />;
  }

  if (isAuthorizedToRender) {
    // console.log(`AuthGuard (${pathname}): Rendering children because isAuthorizedToRender is true.`);
    return <>{children}</>;
  }
  
  // This state means: not loading, but not yet authorized to render (e.g., redirect is pending, or checks failed)
  // console.log(`AuthGuard (${pathname}): Rendering PageSkeleton as fallback (not loading, not authorized to render).`);
  return <PageSkeleton />;
}
