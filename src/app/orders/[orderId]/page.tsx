"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Order } from '@/types';
import { getOrder } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore'; // Firebase Timestamp
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Logo from '@/components/icons/Logo';
import { storeDetails } from '@/config/storeDetails';
import { generateInvoicePdf } from '@/lib/pdfGenerator'; 

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        setIsLoading(true);
        try {
          const fetchedOrder = await getOrder(orderId);
          if (fetchedOrder) {
            setOrder(fetchedOrder);
          } else {
            toast({ title: "Error", description: "Order not found.", variant: "destructive" });
            router.push('/orders');
          }
        } catch (error) {
          console.error("Error fetching order:", error);
          toast({ title: "Error", description: "Failed to fetch order details.", variant: "destructive" });
        }
        setIsLoading(false);
      };
      fetchOrder();
    }
  }, [orderId, toast, router]);

  const formatDate = (dateValue: Timestamp | string | Date | undefined | null) => {
    if (!dateValue) return 'N/A';

    if (dateValue instanceof Timestamp) { // Check for Firebase Timestamp
      try {
        return format(dateValue.toDate(), 'PPpp');
      } catch (e) {
        console.error("Error formatting Firestore Timestamp in OrderDetailPage:", e, dateValue);
        return 'Invalid Date';
      }
    }
    
    if (dateValue instanceof Date) {
      try {
        if (isNaN(dateValue.getTime())) {
             console.warn("Invalid Date object in OrderDetailPage:", dateValue);
             return 'Invalid Date';
        }
        return format(dateValue, 'PPpp');
      } catch (e) {
        console.error("Error formatting Date object in OrderDetailPage:", e, dateValue);
        return 'Invalid Date';
      }
    }

    if (typeof dateValue === 'string') {
      try {
        const parsedDate = new Date(dateValue);
        if (isNaN(parsedDate.getTime())) {
          console.warn("Invalid date string in OrderDetailPage:", dateValue);
          return 'Invalid Date';
        }
        return format(parsedDate, 'PPpp');
      } catch (e) {
        console.error("Error formatting date string in OrderDetailPage:", e, dateValue);
        return 'Invalid Date';
      }
    }
    
    // Fallback for plain objects that might have a toDate method
     if (typeof (dateValue as any)?.toDate === 'function') {
       try {
         return format((dateValue as any).toDate(), 'PPpp');
       } catch (e) {
          console.error("Error formatting object with toDate() in OrderDetailPage:", e, dateValue);
          return 'Invalid Date';
       }
     }

    console.warn("Unformattable dateValue in OrderDetailPage:", dateValue);
    return 'N/A';
  };

  const handlePrintOrderPDF = (currentOrder: Order) => {
    try {
      generateInvoicePdf(currentOrder, storeDetails);
      toast({ title: "PDF Ready for Printing", description: "The bill is opening in a new window for printing." });
    } catch (error) {
      console.error("Error generating PDF for printing:", error);
      toast({ title: "Error", description: "Failed to generate PDF for printing.", variant: "destructive" });
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-1/2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <CardFooter>
          <Skeleton className="h-10 w-1/4" />
        </CardFooter>
      </div>
    );
  }

  if (!order) {
    return <p>Order not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Order Details: {order.orderNumber}</CardTitle>
          <CardDescription>Date: {formatDate(order.orderDate)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Customer Information</h3>
            <p>Name: {order.customerName}</p>
            <p>Mobile: {order.customerMobile}</p>
            <p>Address: {order.customerAddress || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Items Ordered</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SN/Barcode</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={item.productId + index}>
                    <TableCell>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                          data-ai-hint={item.imageHint || "product item"}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center overflow-hidden">
                           <Logo className="h-full w-auto p-1" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.serialNumber || item.barcode || 'N/A'}</TableCell>
                    <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{item.billQuantity}</TableCell>
                    <TableCell className="text-right">₹{(item.price * item.billQuantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-right space-y-1 pr-4">
            <p>
              Subtotal: <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
            </p>
            <p>
              GST: <span className="font-semibold">₹{order.taxAmount.toFixed(2)}</span>
            </p>
            <p className="text-xl font-bold">
              Total: <span className="text-primary">₹{order.totalAmount.toFixed(2)}</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => handlePrintOrderPDF(order)}>
            <Printer className="mr-2 h-4 w-4" /> Print Bill
          </Button>
          <Button onClick={() => router.push(`/billing?fromOrder=${order.id}`)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Copy className="mr-2 h-4 w-4" /> Re-create Bill
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
