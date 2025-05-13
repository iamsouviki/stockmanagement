// src/app/orders/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Order, UserRole } from '@/types';
import { getOrders } from '@/services/firebaseService';
import OrderTable from '@/components/orders/OrderTable';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { Download, Filter, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const pageAccessRoles: UserRole[] = ['owner', 'admin', 'employee'];
const exportOrderRoles: UserRole[] = ['owner'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  // Filter states
  const [filterOrderNumber, setFilterOrderNumber] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderNumberMatch = filterOrderNumber ? order.orderNumber.toLowerCase().includes(filterOrderNumber.toLowerCase()) : true;
      
      const customerMatch = filterCustomer ?
        (order.customerName?.toLowerCase().includes(filterCustomer.toLowerCase()) ||
         order.customerMobile?.toLowerCase().includes(filterCustomer.toLowerCase()))
        : true;

      let dateMatch = true;
      if (filterDateRange?.from && order.orderDate) {
        const orderDateObj = order.orderDate instanceof Timestamp ? order.orderDate.toDate() : new Date(order.orderDate as any);
        if (isNaN(orderDateObj.getTime())) { // Check if date is valid
            dateMatch = false; 
        } else {
            if (filterDateRange.to) {
                const toDate = new Date(filterDateRange.to);
                toDate.setHours(23, 59, 59, 999); // Ensure the 'to' date includes the whole day
                dateMatch = orderDateObj >= filterDateRange.from && orderDateObj <= toDate;
            } else {
                // If only 'from' is selected, match all dates from 'from' onwards
                const fromDateStartOfDay = new Date(filterDateRange.from);
                fromDateStartOfDay.setHours(0,0,0,0);
                dateMatch = orderDateObj >= fromDateStartOfDay;
            }
        }
      }
      return orderNumberMatch && customerMatch && dateMatch;
    }).sort((a,b) => { // Ensure sorting by date descending
        const dateA = a.orderDate instanceof Timestamp ? a.orderDate.toMillis() : new Date(a.orderDate as any).getTime();
        const dateB = b.orderDate instanceof Timestamp ? b.orderDate.toMillis() : new Date(b.orderDate as any).getTime();
        return dateB - dateA;
    });
  }, [orders, filterOrderNumber, filterCustomer, filterDateRange]);

  const resetFilters = () => {
    setFilterOrderNumber("");
    setFilterCustomer("");
    setFilterDateRange(undefined);
    setShowFilters(false);
  };

  return (
    <AuthGuard allowedRoles={pageAccessRoles}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Order History</h1>
              <p className="text-muted-foreground">
              View and manage past orders.
              </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full sm:w-auto">
              <Filter className="mr-2 h-5 w-5" /> {showFilters ? "Hide" : "Show"} Filters
            </Button>
            {userProfile && exportOrderRoles.includes(userProfile.role) && (
                <Button asChild variant="outline" className="w-full sm:w-auto border-accent text-accent hover:bg-accent/10 hover:text-accent">
                    <Link href="/settings/export-orders">
                        <Download className="mr-2 h-5 w-5" /> Export Orders
                    </Link>
                </Button>
            )}
            <Button asChild className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Link href="/billing">Create New Bill</Link>
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                Filter Orders
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                  <XCircle className="mr-1 h-4 w-4" /> Reset Filters
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                placeholder="Filter by Order Number..."
                value={filterOrderNumber}
                onChange={(e) => setFilterOrderNumber(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Filter by Customer Name/Mobile..."
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="text-sm"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal text-sm ${!filterDateRange && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateRange?.from ? (
                      filterDateRange.to ? (
                        <>
                          {format(filterDateRange.from, "LLL dd, y")} -{" "}
                          {format(filterDateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(filterDateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Filter by Date Range...</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filterDateRange?.from}
                    selected={filterDateRange}
                    onSelect={setFilterDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <OrderTable orders={filteredOrders} />
        )}
      </div>
    </AuthGuard>
  );
}