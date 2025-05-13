// src/components/dashboard/StockOverviewChart.tsx
"use client";

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Not used directly here
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
            name: p.name.length > 12 ? `${p.name.substring(0,10)}...` : p.name, // Shorten name for chart labels
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
    return <Skeleton className="h-[250px] sm:h-[300px] w-full" />;
  }

  if (chartData.length === 0 && !isLoading) {
    return <p className="text-center text-muted-foreground p-4 h-[250px] sm:h-[300px] flex items-center justify-center">No product stock data available.</p>;
  }

  const chartConfig = {
    quantity: {
      label: "Stock Quantity",
      color: "hsl(var(--accent))",
    },
  } satisfies Record<string, any>;


  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] sm:min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 25, left: 5, bottom: 5 }}> {/* Adjusted margins */}
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            fontSize={10} // Slightly smaller font size
            allowDecimals={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            fontSize={10} // Slightly smaller font size
            width={70} // Adjust if labels are long, ensure enough space for shortened names
            interval={0} // Ensure all labels are shown
          />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="quantity" fill="var(--color-quantity)" radius={4} barSize={20} /> {/* Adjust barSize if needed */}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default StockOverviewChart;
