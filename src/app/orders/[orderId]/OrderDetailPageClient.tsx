
// src/app/orders/[orderId]/OrderDetailPageClient.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } 
from 'next/navigation';
import type { Order, UserRole } from '@/types';
import { getOrder } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Printer, Package, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { storeDetails } from '@/config/storeDetails';
import { generateInvoicePdf } from '@/lib/pdfGenerator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';

const allowedPageAccessRoles: UserRole[] = ['owner', 'admin', 'employee'];
const allowedRecreateRoles: UserRole[] = ['owner', 'admin'];
const allowedEditRoles: UserRole[] = ['owner'];

interface OrderDetailPageClientProps {
  orderId: string;
}

export default function OrderDetailPageClient({ orderId }: OrderDetailPageClientProps) {
  const router = useRouter();
  const { userProfile } = useAuth();

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
    let dateToFormat: Date;

    if (dateValue instanceof Timestamp) {
      try {
        dateToFormat = dateValue.toDate();
      } catch (e) {
        console.error("Error converting Firestore Timestamp in OrderDetailPage:", e, dateValue);
        return 'Invalid Date';
      }
    } else if (dateValue instanceof Date) {
      dateToFormat = dateValue;
    } else if (typeof dateValue === 'string') {
      try {
        dateToFormat = new Date(dateValue);
      } catch(e) {
        console.error("Error parsing date string in OrderDetailPage:", e, dateValue);
        return 'Invalid Date';
      }
    } else if (typeof (dateValue as any)?.toDate === 'function') {
       try {
         dateToFormat = (dateValue as any).toDate();
       } catch (e) {
          console.error("Error formatting object with toDate() in OrderDetailPage:", e, dateValue);
          return 'Invalid Date';
       }
     }
    else {
      console.warn("Unformattable dateValue type in OrderDetailPage:", typeof dateValue, dateValue);
      return 'N/A';
    }

    try {
      if (isNaN(dateToFormat.getTime())) {
           console.warn("Invalid Date object after conversion in OrderDetailPage:", dateToFormat, "Original:", dateValue);
           return 'Invalid Date';
      }
      return format(dateToFormat, 'PPpp');
    } catch (e) {
      console.error("Error formatting final Date object in OrderDetailPage:", e, dateToFormat);
      return 'Invalid Date';
    }
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

  const handleEditOrder = () => {
    if (order) {
      router.push(`/billing?fromOrder=${order.id}&intent=edit`);
    }
  };

  const handleRecreateBill = () => {
    if (order) {
      router.push(`/billing?fromOrder=${order.id}`);
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
    return <p className="text-center text-lg">Order not found.</p>;
  }

  const canEditOrder = userProfile && allowedEditRoles.includes(userProfile.role);
  const canRecreateBill = userProfile && allowedRecreateRoles.includes(userProfile.role);

  return (
    <AuthGuard allowedRoles={allowedPageAccessRoles}>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl text-primary">Order Details: {order.orderNumber}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Date: {formatDate(order.orderDate)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 text-sm sm:text-base">
            <div>
              <h3 className="font-semibold text-md sm:text-lg mb-1">Customer Information</h3>
              <p>Name: {order.customerName}</p>
              <p>Mobile: {order.customerMobile}</p>
              <p className="whitespace-normal break-words">Address: {order.customerAddress || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-md sm:text-lg mb-2">Items Ordered</h3>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <Table className="min-w-[600px] sm:min-w-full"><TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] sm:w-[60px] px-2 sm:px-4">Image</TableHead>
                      <TableHead className="px-2 sm:px-4">Product</TableHead>
                      <TableHead className="px-2 sm:px-4">SN/Barcode</TableHead>
                      <TableHead className="text-right px-2 sm:px-4">Price</TableHead>
                      <TableHead className="text-center px-2 sm:px-4">Quantity</TableHead>
                      <TableHead className="text-right px-2 sm:px-4">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader><TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={item.productId + index}>
                        <TableCell className="px-2 sm:px-4">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              width={32}
                              height={32}
                              className="rounded-md object-cover sm:w-10 sm:h-10"
                              data-ai-hint={item.imageHint || "product item"}
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
                              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words max-w-[120px] sm:max-w-xs">{item.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{item.serialNumber || item.barcode || 'N/A'}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm px-2 sm:px-4">{item.billQuantity}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4">₹{(item.price * item.billQuantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody></Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            <div className="text-right space-y-1 pr-2 sm:pr-4">
              <p>
                Subtotal: <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
              </p>
              <p>
                GST: <span className="font-semibold">₹{order.taxAmount.toFixed(2)}</span>
              </p>
              <p className="text-lg sm:text-xl font-bold">
                Total: <span className="text-primary">₹{order.totalAmount.toFixed(2)}</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6">
            {canEditOrder && (
              <Button variant="outline" onClick={handleEditOrder} className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" /> Edit Order
              </Button>
            )}
            <Button variant="outline" onClick={() => handlePrintOrderPDF(order)} className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" /> Print Bill
            </Button>
            {canRecreateBill && (
              <Button onClick={handleRecreateBill} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                <Copy className="mr-2 h-4 w-4" /> Re-create Bill
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}

