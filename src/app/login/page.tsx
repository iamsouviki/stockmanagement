'use client';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/'); // Redirect to dashboard if already logged in
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || (!isLoading && currentUser)) {
    // Show a loading skeleton or a message while checking auth state or redirecting
    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <div className="w-full max-w-sm space-y-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
  }

  // If not loading and no current user, show the login form.
  // The header is now hidden on this page by logic in Header.tsx.
  // Adjust min-height to ensure proper centering.
  return (
    <div className="flex flex-col justify-center items-center min-h-screen py-8 sm:py-12 bg-background">
      <LoginForm />
    </div>
  );
}
