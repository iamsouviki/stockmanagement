"use client";

import { useState, useEffect } from 'react';
import type { Order } from '@/types';
import { getOrders } from '@/services/firebaseService';
import OrderTable from '@/components/orders/OrderTable';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const fetchedOrders = await getOrders();
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({ title: "Error", description: "Failed to fetch orders.", variant: "destructive" });
      }
      setIsLoading(false);
    };
    fetchOrders();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Order History</h1>
            <p className="text-muted-foreground">
            View and manage past orders.
            </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
            <Link href="/billing">Create New Bill</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <OrderTable orders={orders} />
      )}
    </div>
  );
}
