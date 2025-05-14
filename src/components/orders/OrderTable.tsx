
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
import { Eye, Copy, Edit } from 'lucide-react'; // Added Edit
import Link from 'next/link';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
// Card imports removed as table is now usually inside a Card in parent page
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from '@/hooks/useAuth'; // Import useAuth to check roles

interface OrderTableProps {
  orders: Order[];
  filtersActive?: boolean;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, filtersActive }) => {
  const { userProfile } = useAuth();

  const formatDate = (dateValue: Timestamp | string | Date | undefined | null) => {
    if (!dateValue) return 'N/A';
    let dateToFormat: Date;

    if (dateValue instanceof Timestamp) {
      try {
        dateToFormat = dateValue.toDate();
      } catch (e) {
        console.error("Error converting Firestore Timestamp in OrderTable:", e, dateValue);
        return 'Invalid Date';
      }
    } else if (dateValue instanceof Date) {
      dateToFormat = dateValue;
    } else if (typeof dateValue === 'string') {
      try {
        dateToFormat = new Date(dateValue);
        if (isNaN(dateToFormat.getTime())) throw new Error("Invalid date string parsed");
      } catch (e) {
        console.error("Error parsing date string in OrderTable:", e, dateValue);
        return 'Invalid Date';
      }
    } else if (typeof (dateValue as any)?.toDate === 'function') {
       try {
         dateToFormat = (dateValue as any).toDate();
         if (isNaN(dateToFormat.getTime())) throw new Error("Invalid date from toDate()");
       } catch (e) {
          console.error("Error formatting object with toDate() in OrderTable:", e, dateValue);
          return 'Invalid Date';
       }
     } else {
      console.warn("Unformattable dateValue type in OrderTable:", typeof dateValue, dateValue);
      return 'N/A';
    }

    try {
      return format(dateToFormat, 'PPpp');
    } catch (e) {
      console.error("Error formatting final Date object in OrderTable:", e, dateToFormat);
      return 'Invalid Date';
    }
  };


  const canEditOrder = (order: Order): boolean => {
    return userProfile?.role === 'owner';
  };

  const canRecreateBill = (order: Order): boolean => {
    return userProfile?.role === 'owner' || userProfile?.role === 'admin';
  };


  return (
    // Card wrapper removed
    <ScrollArea className="w-full whitespace-nowrap rounded-md border-b">
        <Table className="min-w-[700px] sm:min-w-full"><TableHeader>
            <TableRow>
                <TableHead className="px-2 sm:px-4">Order Number</TableHead>
                <TableHead className="px-2 sm:px-4">Customer</TableHead>
                <TableHead className="px-2 sm:px-4">Date</TableHead>
                <TableHead className="text-right px-2 sm:px-4">Total Amount</TableHead>
                <TableHead className="text-center px-2 sm:px-4">Items</TableHead>
                <TableHead className="text-center w-[100px] sm:w-[140px] px-2 sm:px-4">Actions</TableHead>
            </TableRow>
            </TableHeader><TableBody>
            {orders.length === 0 ? (
                <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm sm:text-base">
                    {filtersActive ? "No orders match your filters." : "No orders found."}
                </TableCell>
                </TableRow>
            ) : (
                orders.map((order) => (
                <TableRow key={order.id}>
                    <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4">{order.orderNumber}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{order.customerName || order.customerMobile || 'Walk-in'}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{formatDate(order.orderDate)}</TableCell>
                    <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4">₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-center text-xs sm:text-sm px-2 sm:px-4">{order.items.length}</TableCell>
                    <TableCell className="text-center px-2 sm:px-4">
                    <div className="flex justify-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" asChild title="View Order Details">
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          </Link>
                        </Button>
                        {canRecreateBill(order) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" asChild title="Re-create Bill from this Order">
                          <Link href={`/billing?fromOrder=${order.id}`}>
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                          </Link>
                        </Button>
                        )}
                    </div>
                    </TableCell>
                </TableRow>
                ))
            )}
            </TableBody></Table>
        <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default OrderTable;
