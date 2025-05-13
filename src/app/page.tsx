import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, Receipt, ArrowRight, Users, History, BarChart3, PieChart } from 'lucide-react'; 
import { Suspense } from 'react';
import OrdersChart from '@/components/dashboard/OrdersChart';
import StockOverviewChart from '@/components/dashboard/StockOverviewChart';
import { Skeleton } from '@/components/ui/skeleton';

function ChartSkeleton() {
  return <Skeleton className="h-[300px] w-full rounded-lg" />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-card rounded-lg shadow">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Welcome to StockPilot</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your smart solution for electronics stock management.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl font-semibold">Manage Products</CardTitle>
            <Boxes className="h-8 w-8 text-accent" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              View, add, and update your product inventory.
            </CardDescription>
            <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
              <Link href="/products">
                Go to Products <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl font-semibold">Create Bill</CardTitle>
            <Receipt className="h-8 w-8 text-accent" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Generate bills by adding products via barcode or manual entry.
            </CardDescription>
            <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
              <Link href="/billing">
                Go to Billing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl font-semibold">Order History</CardTitle>
            <History className="h-8 w-8 text-accent" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              View past orders and generate duplicate bills if needed.
            </CardDescription>
            <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
              <Link href="/orders">
                View Orders <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl font-semibold">Manage Customers</CardTitle>
            <Users className="h-8 w-8 text-accent" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              View, add, and update customer information.
            </CardDescription>
            <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
              <Link href="/customers">
                Go to Customers <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <BarChart3 className="mr-2 h-6 w-6" /> Recent Orders (Last 7 Days)
            </CardTitle>
            <CardDescription>Number of orders processed daily.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}>
              <OrdersChart />
            </Suspense>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-primary flex items-center">
              <PieChart className="mr-2 h-6 w-6" /> Stock Overview (Top Products)
            </CardTitle>
            <CardDescription>Quantity of top 5 most stocked products.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartSkeleton />}>
              <StockOverviewChart />
            </Suspense>
          </CardContent>
        </Card>
      </section>


      <section className="mt-12 p-6 bg-card rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3 text-primary">Key Features</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li><span className="font-medium text-foreground">Firebase Integration:</span> All data stored securely in Firestore.</li>
          <li><span className="font-medium text-foreground">Real-time Stock Updates:</span> Inventory levels adjusted after each sale.</li>
          <li><span className="font-medium text-foreground">Order History:</span> Track all past transactions and re-bill.</li>
          <li><span className="font-medium text-foreground">Customer Management:</span> Maintain your customer database.</li>
          <li><span className="font-medium text-foreground">Modern PDF Bills:</span> Professional invoices with store branding.</li>
          <li><span className="font-medium text-foreground">Dashboard Analytics:</span> Visual insights into orders and stock.</li>
        </ul>
      </section>
    </div>
  );
}
