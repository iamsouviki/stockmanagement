// src/app/settings/export-orders/page.tsx
'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import type { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { exportOrdersToCsv } from '@/actions/exportActions'; // Import the server action

const allowedRoles: UserRole[] = ['owner'];

export default function ExportOrdersPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29), 
    to: new Date(),
  });


  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = await exportOrdersToCsv(dateRange);

      if (!csvContent) {
        toast({
          title: "No Data to Export",
          description: "No orders found for the selected date range.",
        });
        setIsExporting(false);
        return;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `PAS_Trading_CO_Orders_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Orders ${dateRange?.from ? `from ${format(dateRange.from, "LLL dd, y")}` : 'all'} to ${dateRange?.to ? format(dateRange.to, "LLL dd, y") : 'today'} have been exported.`,
        className: "bg-green-500 text-white",
      });

    } catch (error: any) {
      console.error("Error exporting orders:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Could not export orders. Please try again.",
        variant: "destructive",
      });
    }
    setIsExporting(false);
  };

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild>
            <Link href="/orders">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
            </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Export Orders</h1>
          <p className="text-muted-foreground">
            Download order history as a CSV file.
          </p>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Select Date Range</CardTitle>
            <CardDescription>
              Choose the period for which you want to export orders. Exports all orders if no range is selected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full sm:w-[280px] justify-start text-left font-normal ${!dateRange && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
                <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} className="ml-2 text-xs text-muted-foreground hover:text-primary">
                    Clear Range (Export All)
                </Button>
            </div>
            
            <Button onClick={handleExport} disabled={isExporting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
              {isExporting ? "Exporting..." : "Export Orders to CSV"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
