// src/app/billing/page.tsx
import { Suspense } from 'react';
import BillingPageContent from '@/components/billing/BillingPageContent';
import BillingPageLoadingSkeleton from '@/components/billing/BillingPageLoadingSkeleton';

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageLoadingSkeleton />}>
      <BillingPageContent />
    </Suspense>
  );
}
