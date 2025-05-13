// src/components/dashboard/StockOverviewChart.tsx
"use client";

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProducts } from '@/services/firebaseService';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductStockData {
  name: string;
  quantity: number;
}

const StockOverviewChart = () => {
  const [chartData, setChartData] = useState<ProductStockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessProducts = async () => {
      setIsLoading(true);
      try {
        const products = await getProducts();
        
        // Sort products by quantity in descending order and take top 5
        const topProducts = products
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
          .map(p => ({
            name: p.name.length > 15 ? `${p.name.substring(0,12)}...` : p.name, // Shorten name for chart
            quantity: p.quantity,
          }));

        setChartData(topProducts);
      } catch (error) {
        console.error("Error fetching or processing products for chart:", error);
      }
      setIsLoading(false);
    };

    fetchAndProcessProducts();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  if (chartData.length === 0 && !isLoading) {
    return <p className="text-center text-muted-foreground p-4">No product stock data available.</p>;
  }

  const chartConfig = {
    quantity: {
      label: "Stock Quantity",
      color: "hsl(var(--accent))",
    },
  } satisfies Record<string, any>;


  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            fontSize={12} 
            allowDecimals={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
            width={80} // Adjust if labels are long
          />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="quantity" fill="var(--color-quantity)" radius={4} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default StockOverviewChart;
