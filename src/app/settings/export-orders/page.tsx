'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import type { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";

const allowedRoles: UserRole[] = ['owner'];

export default function ExportOrdersPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29), // Default to last 30 days
    to: new Date(),
  });


  const handleExport = async () => {
    setIsExporting(true);
    // Placeholder for actual export logic
    // This would involve:
    // 1. Calling a Genkit flow or Firebase function with the dateRange
    // 2. The backend would fetch orders, format as CSV
    // 3. The backend returns a CSV file or data URI
    // 4. Client initiates download
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

    toast({
      title: "Export Initiated (Placeholder)",
      description: `Orders from ${dateRange?.from ? format(dateRange.from, "LLL dd, y") : 'start'} to ${dateRange?.to ? format(dateRange.to, "LLL dd, y") : 'today'} would be exported. This is a placeholder action.`,
    });
    console.log("Exporting orders for date range:", dateRange);
    setIsExporting(false);
  };

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild>
            <Link href="/settings">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
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
                <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} className="ml-2 text-xs">
                    Clear Range (Export All)
                </Button>
            </div>
            
            <Button onClick={handleExport} disabled={isExporting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Download className="mr-2 h-5 w-5" /> {isExporting ? "Exporting..." : "Export Orders to CSV"}
            </Button>
             <p className="text-xs text-muted-foreground mt-2">
                Note: This is a placeholder. Actual data export is not yet implemented.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
