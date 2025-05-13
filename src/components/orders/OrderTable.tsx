"use client";

import type { Order } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, Copy } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore'; // Firebase Timestamp
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface OrderTableProps {
  orders: Order[];
}

const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
  const formatDate = (dateValue: Timestamp | string | Date | undefined | null) => {
    if (!dateValue) return 'N/A';

    if (dateValue instanceof Timestamp) { // Check for Firebase Timestamp first
      try {
        return format(dateValue.toDate(), 'PPpp');
      } catch (e) {
        console.error("Error formatting Firestore Timestamp in OrderTable:", e, dateValue);
        return 'Invalid Date';
      }
    }
    
    if (dateValue instanceof Date) {
      try {
        if (isNaN(dateValue.getTime())) {
             console.warn("Invalid Date object in OrderTable:", dateValue);
             return 'Invalid Date';
        }
        return format(dateValue, 'PPpp');
      } catch (e) {
        console.error("Error formatting Date object in OrderTable:", e, dateValue);
        return 'Invalid Date';
      }
    }

    if (typeof dateValue === 'string') {
      try {
        const parsedDate = new Date(dateValue);
        if (isNaN(parsedDate.getTime())) {
          console.warn("Invalid date string in OrderTable:", dateValue);
          return 'Invalid Date';
        }
        return format(parsedDate, 'PPpp');
      } catch (e) {
        console.error("Error formatting date string in OrderTable:", e, dateValue);
        return 'Invalid Date';
      }
    }
    
    // Fallback for plain objects that might have a toDate method
    if (typeof (dateValue as any)?.toDate === 'function') {
       try {
         return format((dateValue as any).toDate(), 'PPpp');
       } catch (e) {
          console.error("Error formatting object with toDate() in OrderTable:", e, dateValue);
          return 'Invalid Date';
       }
     }

    console.warn("Unformattable dateValue in OrderTable:", dateValue);
    return 'N/A'; 
  };

  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl text-primary">All Orders</CardTitle>
            <CardDescription>A list of all completed transactions.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Order Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {orders.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            No orders found.
                        </TableCell>
                        </TableRow>
                    ) : (
                        orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName || order.customerMobile || 'Walk-in'}</TableCell>
                            <TableCell>{formatDate(order.orderDate)}</TableCell>
                            <TableCell className="text-right">₹{order.totalAmount.toFixed(2)}</TableCell>
                            <TableCell className="text-center">{order.items.length}</TableCell>
                            <TableCell className="text-center">
                            <div className="flex justify-center space-x-2">
                                <Button variant="ghost" size="icon" asChild title="View Order Details">
                                  <Link href={`/orders/${order.id}`}>
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild title="Re-create Bill from this Order">
                                  <Link href={`/billing?fromOrder=${order.id}`}>
                                    <Copy className="h-4 w-4 text-green-600" />
                                  </Link>
                                </Button>
                            </div>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </CardContent>
    </Card>
  );
};

export default OrderTable;
