// src/components/billing/BillingPageLoadingSkeleton.tsx
"use client"; // Explicitly mark as a client component

import { Skeleton } from "@/components/ui/skeleton";

export default function BillingPageLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
      
      {/* Customer Details Skeleton */}
      <Skeleton className="h-24 w-full" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
              {/* Barcode Entry Skeleton */}
              <Skeleton className="h-40 w-full" />
              {/* Bill Items List Skeleton */}
              <Skeleton className="h-60 w-full" />
          </div>
          <div className="lg:col-span-1">
              {/* Bill Summary Card Skeleton */}
              <Skeleton className="h-48 w-full" />
          </div>
      </div>
    </div>
  );
}
