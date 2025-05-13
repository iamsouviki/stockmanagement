// src/components/dashboard/OrdersChart.tsx
"use client";

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        const orders = await getOrders(); // Assuming this fetches all orders, sorted by date desc

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = subDays(new Date(), i);
          return format(d, 'yyyy-MM-dd');
        }).reverse(); // dates from oldest to newest

        const dailyOrdersMap = new Map<string, number>();
        last7Days.forEach(day => dailyOrdersMap.set(day, 0));

        orders.forEach(order => {
          let orderDateStr: string;
          if (order.orderDate instanceof Timestamp) {
            orderDateStr = format(order.orderDate.toDate(), 'yyyy-MM-dd');
          } else if (typeof order.orderDate === 'string') {
            orderDateStr = format(parseISO(order.orderDate), 'yyyy-MM-dd');
          } else if (order.orderDate instanceof Date) {
            orderDateStr = format(order.orderDate, 'yyyy-MM-dd');
          } else {
            return; // Skip if date is invalid
          }
          
          if (dailyOrdersMap.has(orderDateStr)) {
            dailyOrdersMap.set(orderDateStr, (dailyOrdersMap.get(orderDateStr) || 0) + 1);
          }
        });
        
        const processedData: DailyOrderData[] = last7Days.map(date => ({
          date: format(parseISO(date), 'MMM dd'), // Format for X-axis label
          orders: dailyOrdersMap.get(date) || 0,
        }));

        setChartData(processedData);
      } catch (error) {
        console.error("Error fetching or processing orders for chart:", error);
        // Handle error display if necessary
      }
      setIsLoading(false);
    };

    fetchAndProcessOrders();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  if (chartData.length === 0 && !isLoading) {
    return <p className="text-center text-muted-foreground p-4">No order data available for the last 7 days.</p>;
  }
  
  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--primary))",
    },
  } satisfies Record<string, any>;


  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            fontSize={12}
            allowDecimals={false} 
          />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default OrdersChart;
