import { NextPage } from 'next';
import { getOrders } from '@/services/firebaseService';
import OrderDetailPageClient from './OrderDetailPageClient';
import type { Metadata, ResolvingMetadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Generate static params
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

// Generate metadata
export async function generateMetadata(
  // Use type assertion to bypass params mismatch
  { params }: { params: { orderId: string } } | any,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const orderId = params.orderId as string;
  return {
    title: `Order Details - ${orderId ? orderId.substring(0, 6) + '...' : 'Order'}`,
    description: `View details for order ${orderId || ''}`,
  };
}

// Skeleton for Suspense fallback
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

// Define the page with type assertion
const OrderDetailPage: NextPage<{ params: { orderId: string } } | any> = ({ params }) => {
  const orderId = params.orderId as string;
  return (
    <Suspense fallback={<OrderDetailLoadingSkeleton />}>
      <OrderDetailPageClient orderId={orderId} />
    </Suspense>
  );
};

export default OrderDetailPage;