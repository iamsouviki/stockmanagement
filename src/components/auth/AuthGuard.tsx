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
    // console.log(`AuthGuard (${pathname}): Effect triggered. AuthLoading: ${isAuthLoading}, CurrentUser: ${!!currentUser}, UserProfile: ${!!userProfile}`);
    
    if (isAuthLoading) {
      // console.log(`AuthGuard (${pathname}): Auth is loading. Setting isAuthorizedToRender to false.`);
      setIsAuthorizedToRender(false);
      return;
    }

    if (!currentUser) {
      // console.log(`AuthGuard (${pathname}): No current user.`);
      if (pathname !== redirectPath) {
        // console.log(`AuthGuard (${pathname}): Not on redirect path. Redirecting to ${redirectPath}.`);
        router.replace(redirectPath);
      } else {
        // console.log(`AuthGuard (${pathname}): On redirect path (${redirectPath}), user not logged in. LoginForm should handle display.`);
        // If on login page, and no user, login form should be shown by the LoginPage itself.
        // If children of AuthGuard on login page is LoginForm, this path allows it to render.
        setIsAuthorizedToRender(true); 
      }
      return;
    }

    // User is authenticated (currentUser exists)
    if (allowedRoles && allowedRoles.length > 0) {
      // console.log(`AuthGuard (${pathname}): Roles required: ${allowedRoles.join(', ')}.`);
      if (!userProfile) {
        // console.warn(`AuthGuard (${pathname}): User authenticated but profile is null. Cannot check roles. Redirecting to /.`);
        if (pathname !== '/') router.replace('/');
        else setIsAuthorizedToRender(false); // Avoid self-redirect loop if on '/' and profile is missing
        return;
      }
      if (!allowedRoles.includes(userProfile.role)) {
        // console.warn(`AuthGuard (${pathname}): User role '${userProfile.role}' not in allowed roles: ${allowedRoles.join(', ')}. Redirecting to /.`);
        if (pathname !== '/') router.replace('/');
        else setIsAuthorizedToRender(false); // Avoid self-redirect loop
        return;
      }
    }
    
    // console.log(`AuthGuard (${pathname}): Authorization checks passed. Setting isAuthorizedToRender to true.`);
    setIsAuthorizedToRender(true);

  }, [currentUser, userProfile, isAuthLoading, router, allowedRoles, redirectPath, pathname]);

  if (isAuthLoading) {
    // console.log(`AuthGuard (${pathname}): Rendering PageSkeleton because isAuthLoading is true.`);
    return <PageSkeleton />;
  }

  if (isAuthorizedToRender) {
    // console.log(`AuthGuard (${pathname}): Rendering children because isAuthorizedToRender is true.`);
    return <>{children}</>;
  }

  // If not AuthLoading and not AuthorizedToRender, means a redirect is likely pending or conditions not met.
  // console.log(`AuthGuard (${pathname}): Rendering PageSkeleton as fallback (not loading, not authorized to render).`);
  return <PageSkeleton />;
}
