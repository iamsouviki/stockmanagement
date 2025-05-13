import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, Receipt, ArrowRight, Users, History, BarChart3, PieChart, Tags, SettingsIcon } from 'lucide-react'; 
import { Suspense } from 'react';
import OrdersChart from '@/components/dashboard/OrdersChart';
import StockOverviewChart from '@/components/dashboard/StockOverviewChart';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/auth/AuthGuard'; // Import AuthGuard
import type { UserRole } from '@/types';

function ChartSkeleton() {
  return <Skeleton className="h-[300px] w-full rounded-lg" />;
}

// Define roles that can access specific cards
const productManagementRoles: UserRole[] = ['owner', 'employee'];
const billingRoles: UserRole[] = ['owner', 'employee'];
const categoryManagementRoles: UserRole[] = ['owner', 'employee'];
const orderHistoryRoles: UserRole[] = ['owner', 'employee'];
const customerManagementRoles: UserRole[] = ['owner', 'employee'];
const settingsRoles: UserRole[] = ['owner'];


export default function DashboardPage() {
  return (
    <AuthGuard> {/* Wrap content with AuthGuard */}
      <div className="space-y-6 md:space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Recent Orders (Last 7 Days)
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">Number of orders processed daily.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] sm:h-[300px]">
              <Suspense fallback={<ChartSkeleton />}>
                <OrdersChart />
              </Suspense>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary flex items-center">
                <PieChart className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Stock Overview (Top Products)
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">Quantity of top 5 most stocked products.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] sm:h-[300px]">
              <Suspense fallback={<ChartSkeleton />}>
                <StockOverviewChart />
              </Suspense>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <AuthGuard allowedRoles={productManagementRoles}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Manage Products</CardTitle>
                <Boxes className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 sm:mb-4 text-sm sm:text-base">
                  View, add, and update your product inventory.
                </CardDescription>
                <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Link href="/products">
                    Go to Products <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AuthGuard>

          <AuthGuard allowedRoles={billingRoles}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Create Bill</CardTitle>
                <Receipt className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Generate bills by adding products via barcode or manual entry.
                </CardDescription>
                <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Link href="/billing">
                    Go to Billing <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AuthGuard>
          
          <AuthGuard allowedRoles={categoryManagementRoles}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Categories</CardTitle>
                <Tags className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Organize products by managing categories.
                </CardDescription>
                <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Link href="/categories">
                    Manage Categories <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AuthGuard>

          <AuthGuard allowedRoles={orderHistoryRoles}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Order History</CardTitle>
                <History className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 sm:mb-4 text-sm sm:text-base">
                  View past orders and generate duplicate bills if needed.
                </CardDescription>
                <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Link href="/orders">
                    View Orders <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AuthGuard>
          
          <AuthGuard allowedRoles={customerManagementRoles}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-2 xl:col-span-2"> {/* Adjusted span for 4-col layout */}
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Manage Customers</CardTitle>
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 sm:mb-4 text-sm sm:text-base">
                  View, add, and update customer information.
                </CardDescription>
                <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Link href="/customers">
                    Go to Customers <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AuthGuard>

          <AuthGuard allowedRoles={settingsRoles}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-2 xl:col-span-2"> {/* Adjusted span */}
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Settings</CardTitle>
                <SettingsIcon className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Manage application settings, bulk uploads, and exports.
                </CardDescription>
                <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Link href="/settings">
                    Go to Settings <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AuthGuard>
        </div>
        
        <footer className="text-center py-4 text-sm text-muted-foreground">
          Created By Souvik Ghosh
        </footer>
      </div>
    </AuthGuard>
  );
}
