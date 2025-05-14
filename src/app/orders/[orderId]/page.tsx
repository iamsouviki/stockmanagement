
// src/app/orders/[orderId]/page.tsx
import { getOrders } from '@/services/firebaseService';
import OrderDetailPageClient from './OrderDetailPageClient';
import type { Metadata, ResolvingMetadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// This function tells Next.js which params to generate statically.
// The return type is now Promise<Array<{ orderId: string }>>
export async function generateStaticParams(): Promise<{ orderId: string }[]> {
  try {
    const orders = await getOrders();
    return orders.map((order) => ({
      orderId: order.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params for orders:", error);
    return []; // Return empty array on error to avoid build failure
  }
}

// This function generates metadata for each statically generated page.
// The params type is now inlined as { orderId: string }
export async function generateMetadata(
  { params }: { params: { orderId: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const orderId = params.orderId;
  // In a real app, you might fetch order details here to generate a more specific title
  // Example: const order = await getOrder(orderId); 
  // const title = order ? `Order #${order.orderNumber}` : `Order Details`;
  return {
    title: `Order Details - ${orderId ? orderId.substring(0, 6) + '...' : 'Order'}`,
    description: `View details for order ${orderId || ''}`,
  };
}

// Basic Skeleton for Suspense fallback
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

// The Page component itself.
// The params type is now inlined as { orderId: string }
export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
  return (
    <Suspense fallback={<OrderDetailLoadingSkeleton />}>
      <OrderDetailPageClient orderId={params.orderId} />
    </Suspense>
  );
}
