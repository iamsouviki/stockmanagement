// src/components/billing/BillingPageLoadingSkeleton.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function BillingPageLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
          </div>
          <div className="lg:col-span-1">
              <Skeleton className="h-48 w-full" />
          </div>
      </div>
    </div>
  );
}
