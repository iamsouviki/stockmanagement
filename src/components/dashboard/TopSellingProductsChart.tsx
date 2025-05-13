// src/components/dashboard/TopSellingProductsChart.tsx
"use client";

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getOrders, getProduct } from '@/services/firebaseService';
import type { Order } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

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
        const productSalesMap = new Map<string, { quantity: number; name?: string }>();

        orders.forEach(order => {
          order.items.forEach(item => {
            const existing = productSalesMap.get(item.productId);
            productSalesMap.set(
              item.productId,
              { 
                quantity: (existing?.quantity || 0) + item.billQuantity,
                name: item.name // Store name from order item first
              }
            );
          });
        });
        
        const sortedProductSales = Array.from(productSalesMap.entries())
          .sort(([, dataA], [, dataB]) => dataB.quantity - dataA.quantity)
          .slice(0, 5); 

        const productDetailsPromises = sortedProductSales.map(async ([productId, data]) => {
          // Use name from order item if available, otherwise fetch
          let productName = data.name;
          if (!productName) {
            const product = await getProduct(productId);
            productName = product?.name || `Product ID: ${productId.substring(0,6)}...`;
          }
          
          return {
            name: productName.length > 12 ? `${productName.substring(0, 10)}...` : productName, // Shorten for Y-axis
            originalName: productName, // Keep original for tooltip
            quantitySold: data.quantity,
          };
        });
        
        const resolvedProductDetails = await Promise.all(productDetailsPromises);
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
      color: "hsl(var(--chart-2))", 
    },
     // Add this to ensure originalName is available in tooltip config
    originalName: {
      label: "Product Name",
    }
  } satisfies Record<string, any>;

  return (
    <ChartContainer config={chartConfig} className="min-h-[280px] sm:min-h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout="vertical" 
          margin={{ top: 5, right: 10, left: 0, bottom: 0 }} // Adjusted margins
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            fontSize={9} // Reduced font size
            allowDecimals={false} 
          />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            fontSize={9} // Reduced font size
            width={70} // Adjusted width for Y-axis labels
            interval={0} 
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
            content={<ChartTooltipContent 
                        formatter={(value, name, props) => {
                           if (name === 'quantitySold' && props.payload.originalName) {
                             return [value, chartConfig.quantitySold.label];
                           }
                           return [value, name];
                        }}
                        labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0 && payload[0].payload.originalName) {
                                return payload[0].payload.originalName;
                            }
                            return label;
                        }}
                    />}
          />
          <Bar 
            dataKey="quantitySold" 
            fill="var(--color-quantitySold)" 
            radius={[0, 4, 4, 0]} 
            barSize={18} // Adjusted bar size
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default TopSellingProductsChart;
