// src/components/dashboard/TopSellingProductsChart.tsx
"use client";

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent, // Added for custom legend if needed
} from "@/components/ui/chart";
import { getOrders, getProducts, getProduct } from '@/services/firebaseService';
import type { Order, Product as ProductType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';

interface ProductSalesData {
  name: string;
  quantitySold: number;
}

const TopSellingProductsChart = () => {
  const [chartData, setChartData] = useState<ProductSalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setIsLoading(true);
      try {
        const orders = await getOrders();
        const productSalesMap = new Map<string, number>();

        orders.forEach(order => {
          order.items.forEach(item => {
            productSalesMap.set(
              item.productId,
              (productSalesMap.get(item.productId) || 0) + item.billQuantity
            );
          });
        });

        const sortedProductSales = Array.from(productSalesMap.entries())
          .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
          .slice(0, 5); // Get top 5

        const productDetailsPromises = sortedProductSales.map(async ([productId, quantitySold]) => {
          const product = await getProduct(productId);
          return {
            name: product?.name || `Product ID: ${productId.substring(0,6)}...`, // Fallback name
            quantitySold,
          };
        });
        
        let resolvedProductDetails = await Promise.all(productDetailsPromises);

        // Shorten names for display
        resolvedProductDetails = resolvedProductDetails.map(p => ({
            ...p,
            name: p.name.length > 15 ? `${p.name.substring(0, 13)}...` : p.name,
        }));
        
        setChartData(resolvedProductDetails);

      } catch (error) {
        console.error("Error fetching or processing data for Top Selling Products chart:", error);
      }
      setIsLoading(false);
    };

    fetchAndProcessData();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[280px] sm:h-[320px] w-full" />;
  }

  if (chartData.length === 0 && !isLoading) {
    return (
        <div className="h-[280px] sm:h-[320px] w-full flex items-center justify-center">
            <p className="text-center text-muted-foreground p-4">No sales data available to display top products.</p>
        </div>
    );
  }
  
  const chartConfig = {
    quantitySold: {
      label: "Units Sold",
      color: "hsl(var(--chart-2))", // Using a different chart color from theme
    },
  } satisfies Record<string, any>;

  return (
    <ChartContainer config={chartConfig} className="min-h-[280px] sm:min-h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }} // Adjusted margins for labels
          barCategoryGap="20%" // Adds space between bars
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            fontSize={10} 
            allowDecimals={false} 
          />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            fontSize={10}
            width={80} // Increased width for potentially longer (shortened) names
            interval={0} // Ensure all labels are shown
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
            content={<ChartTooltipContent />}
          />
          {/* <Legend content={<ChartLegendContent nameKey="name" />} verticalAlign="top" wrapperStyle={{paddingBottom: '10px'}}/> */}
          <Bar 
            dataKey="quantitySold" 
            fill="var(--color-quantitySold)" 
            radius={[0, 4, 4, 0]} // Rounded corners on one side for horizontal bars
            barSize={20} // Fixed bar size for better appearance
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default TopSellingProductsChart;
