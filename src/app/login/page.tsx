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


  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100vh-var(--header-height,10rem))] py-8 sm:py-12 bg-background">
        {/* Adjusted min-height to account for potential header, py for padding */}
      <LoginForm />
    </div>
  );
}
