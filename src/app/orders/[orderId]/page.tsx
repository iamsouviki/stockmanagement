
// src/app/orders/[orderId]/page.tsx
import { getOrders } from '@/services/firebaseService';
import OrderDetailPageClient from './OrderDetailPageClient';
import type { Metadata, ResolvingMetadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Define an explicit interface for the route parameters
interface DynamicPageParams {
  orderId: string;
}

// This function tells Next.js which params to generate statically.
// It should return an array of objects matching DynamicPageParams.
export async function generateStaticParams(): Promise<DynamicPageParams[]> {
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

// This function generates metadata for each statically generated page.
// The props for this function will include 'params' of type DynamicPageParams.
export async function generateMetadata(
  { params }: { params: DynamicPageParams },
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
// Its props will include 'params' of type DynamicPageParams.
export default function OrderDetailPage({ params }: { params: DynamicPageParams }) {
  return (
    <Suspense fallback={<OrderDetailLoadingSkeleton />}>
      <OrderDetailPageClient orderId={params.orderId} />
    </Suspense>
  );
}
