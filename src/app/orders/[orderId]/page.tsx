
// src/app/orders/[orderId]/page.tsx
import { getOrders } from '@/services/firebaseService';
import OrderDetailPageClient from './OrderDetailPageClient';
import type { Metadata, ResolvingMetadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // For a basic fallback

// Function to generate static paths for orders
export async function generateStaticParams() {
  try {
    const orders = await getOrders(); // Fetch all orders
    return orders.map((order) => ({
      orderId: order.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params for orders:", error);
    return [];
  }
}

// Optional: If you want dynamic metadata based on the orderId
type Props = {
  params: { orderId: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const orderId = params.orderId;
  // In a real scenario, you might fetch minimal order data here to set a dynamic title
  // For now, a generic title:
  return {
    title: `Order Details - ${orderId.substring(0, 6)}...`,
    description: `View details for order ${orderId}`,
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


export default function OrderDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<OrderDetailLoadingSkeleton />}>
      <OrderDetailPageClient orderId={params.orderId} />
    </Suspense>
  );
}
