import { getOrders } from '@/services/firebaseService';
import OrderDetailPageClient from './OrderDetailPageClient';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata, ResolvingMetadata } from 'next';

// ✅ generateStaticParams (no change needed)
export async function generateStaticParams(): Promise<{ orderId: string }[]> {
  try {
    const orders = await getOrders();
    return orders.map((order) => ({
      orderId: order.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params for orders:", error);
    return [];
  }
}

// ✅ generateMetadata (params must be async and destructured properly)
export async function generateMetadata(
  { params }: { params: { orderId: string } },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const orderId = params.orderId;
  return {
    title: `Order Details - ${orderId?.substring(0, 6)}...`,
    description: `View details for order ${orderId}`,
  };
}

// ✅ Loading skeleton for fallback
function OrderDetailLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-1/4" />
    </div>
  );
}

// ✅ Page component MUST be async and receive `params` properly
export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const orderId = params.orderId;

  return (
    <Suspense fallback={<OrderDetailLoadingSkeleton />}>
      <OrderDetailPageClient orderId={orderId} />
    </Suspense>
  );
}
