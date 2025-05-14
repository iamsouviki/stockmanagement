// src/app/orders/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Order, UserRole } from '@/types';
import { getOrdersPaginated } from '@/services/firebaseService'; // Use paginated fetch
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
import { Timestamp, type QueryDocumentSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PaginationControls from "@/components/shared/PaginationControls";

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

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPageFirstDoc, setCurrentPageFirstDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [currentPageLastDoc, setCurrentPageLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [pageHistory, setPageHistory] = useState<(QueryDocumentSnapshot | null)[]>([null]);
  const [isFetchingPage, setIsFetchingPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchOrdersData = useCallback(async (
    direction: 'initial' | 'next' | 'prev' | 'reset' = 'initial'
  ) => {
    setIsFetchingPage(true);
    setIsLoading(direction === 'initial' || direction === 'reset');

    let startAfterDoc: QueryDocumentSnapshot | null = null;
    let endBeforeDoc: QueryDocumentSnapshot | null = null;

    if (direction === 'next' && currentPageLastDoc) {
      startAfterDoc = currentPageLastDoc;
    } else if (direction === 'prev' && currentPageFirstDoc) {
      endBeforeDoc = currentPageFirstDoc;
    } else if (direction === 'reset') {
      setPageHistory([null]);
      setCurrentPageFirstDoc(null);
      setCurrentPageLastDoc(null);
    }

    try {
      // Fetch one more item than itemsPerPage to check if there's a next page
      const fetchLimit = itemsPerPage + (direction !== 'prev' ? 1 : 0);
      const { orders: fetchedOrders, firstDoc, lastDoc } = await getOrdersPaginated(
        fetchLimit,
        'orderDate',
        'desc',
        startAfterDoc,
        endBeforeDoc
      );

      let displayOrders = fetchedOrders;
      let newHasNextPage = false;

      if (direction !== 'prev' && fetchedOrders.length > itemsPerPage) {
        displayOrders = fetchedOrders.slice(0, itemsPerPage);
        newHasNextPage = true;
      } else if (direction === 'prev' && fetchedOrders.length > 0) {
        // When fetching prev, if we got items, there might be a next page from this point
        // We need to re-evaluate hasNextPage based on whether we got *more* than itemsPerPage if we were to fetch "next" from *this* new lastDoc
        // For simplicity, after a 'prev' action, 'hasNextPage' is true if we successfully moved back.
        // A more accurate check would require another fetch or different logic.
        // For now, assume if we moved back and have items, there's a "next" page (the one we just left).
        newHasNextPage = true; 
      }
       else {
        newHasNextPage = false;
      }


      setOrders(displayOrders);
      setCurrentPageFirstDoc(firstDoc);
      setCurrentPageLastDoc(lastDoc);
      setHasNextPage(newHasNextPage);

      if (direction === 'next' && firstDoc) {
        setPageHistory(prev => [...prev, firstDoc]);
      } else if (direction === 'prev' && pageHistory.length > 1) {
        setPageHistory(prev => prev.slice(0, -1));
      }

    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: "Failed to fetch orders.", variant: "destructive" });
    }
    setIsLoading(false);
    setIsFetchingPage(false);
  }, [itemsPerPage, toast, currentPageLastDoc, currentPageFirstDoc, pageHistory]);

  useEffect(() => {
    fetchOrdersData('initial');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage]); // Initial fetch and on itemsPerPage change

  const filteredOrders = useMemo(() => {
    // Client-side filtering on the current page of orders
    return orders.filter(order => {
      const orderNumberMatch = filterOrderNumber ? order.orderNumber.toLowerCase().includes(filterOrderNumber.toLowerCase()) : true;

      const customerMatch = filterCustomer ?
        (order.customerName?.toLowerCase().includes(filterCustomer.toLowerCase()) ||
         order.customerMobile?.toLowerCase().includes(filterCustomer.toLowerCase()))
        : true;

      let dateMatch = true;
      if (filterDateRange?.from && order.orderDate) {
        const orderDateObj = order.orderDate instanceof Timestamp ? order.orderDate.toDate() : new Date(order.orderDate as any);
        if (isNaN(orderDateObj.getTime())) {
            dateMatch = false;
        } else {
            const fromDateStartOfDay = new Date(filterDateRange.from);
            fromDateStartOfDay.setHours(0,0,0,0);
            if (filterDateRange.to) {
                const toDate = new Date(filterDateRange.to);
                toDate.setHours(23, 59, 59, 999);
                dateMatch = orderDateObj >= fromDateStartOfDay && orderDateObj <= toDate;
            } else {
                dateMatch = orderDateObj >= fromDateStartOfDay;
            }
        }
      }
      return orderNumberMatch && customerMatch && dateMatch;
    }); // Sorting is handled by Firestore query
  }, [orders, filterOrderNumber, filterCustomer, filterDateRange]);

  const resetFilters = () => {
    setFilterOrderNumber("");
    setFilterCustomer("");
    setFilterDateRange(undefined);
    setShowFilters(false);
    // Note: Client-side filters don't require re-fetching, but if server-side filtering was added, it would.
  };

  const handleNextPage = () => {
    if (hasNextPage && !isFetchingPage) {
      fetchOrdersData('next');
    }
  };

  const handlePrevPage = () => {
    if (pageHistory.length > 1 && !isFetchingPage) {
      fetchOrdersData('prev');
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    // Fetching data with 'reset' will be handled by the useEffect listening to itemsPerPage
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
                Filter Orders (Client-Side)
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
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-primary">All Orders</CardTitle>
                {/* Description removed for brevity, can be re-added */}
            </CardHeader>
            <CardContent className="p-0">
                <OrderTable orders={filteredOrders} filtersActive={filterOrderNumber !== "" || filterCustomer !== "" || !!filterDateRange} />
            </CardContent>
            <PaginationControls
                canGoPrev={pageHistory.length > 1 && !isFetchingPage}
                canGoNext={hasNextPage && !isFetchingPage}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
            />
        </Card>
        )}
      </div>
    </AuthGuard>
  );
}
