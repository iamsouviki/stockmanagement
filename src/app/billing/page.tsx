// src/app/billing/page.tsx
import { Suspense } from 'react';
import BillingPageContent from '@/components/billing/BillingPageContent';
import BillingPageLoadingSkeleton from '@/components/billing/BillingPageLoadingSkeleton';
import AuthGuard from '@/components/auth/AuthGuard';
import type { UserRole } from '@/types';

const allowedRoles: UserRole[] = ['owner', 'admin', 'employee']; // Added 'admin'

export default function BillingPage() {
  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <Suspense fallback={<BillingPageLoadingSkeleton />}>
        <BillingPageContent />
      </Suspense>
    </AuthGuard>
  );
}

