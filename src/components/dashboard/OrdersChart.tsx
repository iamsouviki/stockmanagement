// src/components/dashboard/OrdersChart.tsx
"use client";

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getOrders } from '@/services/firebaseService';
import type { Order } from '@/types';
import { format, subDays, parseISO } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyOrderData {
  date: string;
  orders: number;
}

const OrdersChart = () => {
  const [chartData, setChartData] = useState<DailyOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessOrders = async () => {
      setIsLoading(true);
      try {
        const orders = await getOrders(); 

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = subDays(new Date(), i);
          return format(d, 'yyyy-MM-dd');
        }).reverse(); 

        const dailyOrdersMap = new Map<string, number>();
        last7Days.forEach(day => dailyOrdersMap.set(day, 0));

        orders.forEach(order => {
          let orderDateStr: string;
          if (order.orderDate instanceof Timestamp) {
            orderDateStr = format(order.orderDate.toDate(), 'yyyy-MM-dd');
          } else if (typeof order.orderDate === 'string') {
            try {
              orderDateStr = format(parseISO(order.orderDate), 'yyyy-MM-dd');
            } catch (e) {
               console.warn("Could not parse orderDate string:", order.orderDate, e);
               return; 
            }
          } else if (order.orderDate instanceof Date) {
            orderDateStr = format(order.orderDate, 'yyyy-MM-dd');
          } else {
            console.warn("Invalid orderDate type:", typeof order.orderDate, order.orderDate);
            return; 
          }
          
          if (dailyOrdersMap.has(orderDateStr)) {
            dailyOrdersMap.set(orderDateStr, (dailyOrdersMap.get(orderDateStr) || 0) + 1);
          }
        });
        
        const processedData: DailyOrderData[] = last7Days.map(date => ({
          date: format(parseISO(date), 'dd MMM'), 
          orders: dailyOrdersMap.get(date) || 0,
        }));

        setChartData(processedData);
      } catch (error) {
        console.error("Error fetching or processing orders for chart:", error);
      }
      setIsLoading(false);
    };

    fetchAndProcessOrders();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[280px] sm:h-[320px] w-full" />;
  }

  if (chartData.length === 0 && !isLoading) {
     return (
        <div className="h-[280px] sm:h-[320px] w-full flex items-center justify-center">
             <p className="text-center text-muted-foreground p-4">No order data available for the last 7 days.</p>
        </div>
     );
  }
  
  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-1))", 
    },
  } satisfies Record<string, any>;


  return (
    <ChartContainer config={chartConfig} className="min-h-[280px] sm:min-h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 5, right: 0, left: -25, bottom: 0 }} // Adjusted margins
          barCategoryGap="25%" 
          barSize={25} // Slightly reduce bar size
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={9} // Reduced font size
            interval="preserveStartEnd" 
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            fontSize={9} // Reduced font size
            allowDecimals={false} 
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default OrdersChart;
