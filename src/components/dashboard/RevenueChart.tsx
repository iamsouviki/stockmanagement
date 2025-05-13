// src/components/dashboard/RevenueChart.tsx
"use client";

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getOrders } from '@/services/firebaseService';
import type { Order } from '@/types';
import { format, subDays, parseISO } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface DailyRevenueData {
  date: string;
  revenue: number;
}

const RevenueChart = () => {
  const [chartData, setChartData] = useState<DailyRevenueData[]>([]);
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

        const dailyRevenueMap = new Map<string, number>();
        last7Days.forEach(day => dailyRevenueMap.set(day, 0));

        orders.forEach(order => {
          let orderDateStr: string;
          if (order.orderDate instanceof Timestamp) {
            orderDateStr = format(order.orderDate.toDate(), 'yyyy-MM-dd');
          } else if (typeof order.orderDate === 'string') {
            try {
              orderDateStr = format(parseISO(order.orderDate), 'yyyy-MM-dd');
            } catch (e) {
               console.warn("Could not parse orderDate string for revenue chart:", order.orderDate, e);
               return; 
            }
          } else if (order.orderDate instanceof Date) {
            orderDateStr = format(order.orderDate, 'yyyy-MM-dd');
          } else {
            console.warn("Invalid orderDate type for revenue chart:", typeof order.orderDate, order.orderDate);
            return; 
          }
          
          if (dailyRevenueMap.has(orderDateStr)) {
            dailyRevenueMap.set(orderDateStr, (dailyRevenueMap.get(orderDateStr) || 0) + order.totalAmount);
          }
        });
        
        const processedData: DailyRevenueData[] = last7Days.map(date => ({
          date: format(parseISO(date), 'dd MMM'), 
          revenue: parseFloat((dailyRevenueMap.get(date) || 0).toFixed(2)), // Ensure revenue is a number
        }));

        setChartData(processedData);
      } catch (error) {
        console.error("Error fetching or processing orders for revenue chart:", error);
      }
      setIsLoading(false);
    };

    fetchAndProcessOrders();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[300px] sm:h-[350px] w-full" />;
  }

  if (chartData.length === 0 && !isLoading) {
     return (
        <div className="h-[300px] sm:h-[350px] w-full flex items-center justify-center">
             <p className="text-center text-muted-foreground p-4">No revenue data available for the last 7 days.</p>
        </div>
     );
  }
  
  const chartConfig = {
    revenue: {
      label: "Revenue (₹)",
      color: "hsl(var(--chart-3))", // Using a different chart color
    },
  } satisfies Record<string, any>;


  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] sm:min-h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          margin={{ top: 20, right: 5, left: -20, bottom: 5 }} // Adjusted margins for labels
          barCategoryGap="20%" 
          barSize={30} 
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={10} 
            interval="preserveStartEnd" 
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            fontSize={10} 
            allowDecimals={true}
            tickFormatter={(value) => `₹${value}`} 
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
            content={<ChartTooltipContent formatter={(value) => `₹${value.toLocaleString()}`} />}
            
          />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]}>
            <LabelList 
              dataKey="revenue" 
              position="top" 
              offset={5} 
              fontSize={9} 
              formatter={(value: number) => `₹${value.toLocaleString()}`} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default RevenueChart;
