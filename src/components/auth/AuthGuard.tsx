'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import type { UserRole } from '@/types';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectPath?: string; // Path to redirect if not authorized/authenticated
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
  const { currentUser, userProfile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return; // Wait until authentication status is resolved

    if (!currentUser) {
      // If not authenticated and not already on the redirectPath (login page), redirect
      if (pathname !== redirectPath) {
        router.replace(redirectPath);
      }
      return;
    }

    // If authenticated, check roles if specified
    if (allowedRoles && allowedRoles.length > 0) {
      if (!userProfile || !allowedRoles.includes(userProfile.role)) {
        // If user profile doesn't exist or role is not allowed, redirect to home or an unauthorized page
        // For simplicity, redirecting to home. A dedicated '/unauthorized' page might be better.
        console.warn(`User with role '${userProfile?.role}' not authorized for this page. Allowed: ${allowedRoles.join(', ')}`);
        router.replace('/'); 
        return;
      }
    }
    // If authenticated and no specific roles required, or role is allowed, continue
  }, [currentUser, userProfile, isLoading, router, allowedRoles, redirectPath, pathname]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!currentUser && pathname !== redirectPath) {
    // Still show skeleton or minimal content if redirecting and not on login page
    return <PageSkeleton />;
  }
  
  if (currentUser && allowedRoles && allowedRoles.length > 0 && (!userProfile || !allowedRoles.includes(userProfile.role))) {
    // Still show skeleton or minimal content if authorized roles check fails and redirecting
    return <PageSkeleton />;
  }

  return <>{children}</>;
}
