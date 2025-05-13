// src/app/page.tsx
'use client'; 

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, Receipt, ArrowRight, Users, History, BarChart3, PieChart, Tags, UserCog } from 'lucide-react'; 
import { Suspense } from 'react';
import OrdersChart from '@/components/dashboard/OrdersChart';
import StockOverviewChart from '@/components/dashboard/StockOverviewChart';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/auth/AuthGuard'; 
import type { UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth'; 

function ChartSkeleton() {
  return <Skeleton className="h-[300px] w-full rounded-lg" />;
}

const productManagementRoles: UserRole[] = ['owner', 'admin', 'employee'];
const billingRoles: UserRole[] = ['owner', 'admin', 'employee'];
const categoryManagementRoles: UserRole[] = ['owner', 'admin', 'employee'];
const orderHistoryRoles: UserRole[] = ['owner', 'admin', 'employee'];
const customerManagementRoles: UserRole[] = ['owner', 'admin', 'employee'];
const userManagementRoles: UserRole[] = ['owner', 'admin'];


export default function DashboardPage() {
  const { userProfile, isLoading } = useAuth(); 

  const welcomeMessage = isLoading 
    ? "Loading..." 
    : userProfile?.displayName 
      ? `Welcome, ${userProfile.displayName}!` 
      : "Welcome!";

  const isUserManagementCardVisible = !isLoading && userProfile && userManagementRoles.includes(userProfile.role);

  return (
    <AuthGuard> 
      <div className="space-y-6 md:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          {welcomeMessage}
        </h1>

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
          <AuthGuard allowedRoles={productManagementRoles} redirectPath='/login'>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Manage Products</CardTitle>
                <Boxes className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 sm:mb-4 text-sm sm:text-base">
                  View, add, update inventory, and perform bulk uploads.
                </CardDescription>
                <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Link href="/products">
                    Go to Products <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AuthGuard>

          <AuthGuard allowedRoles={billingRoles} redirectPath='/login'>
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
          
          <AuthGuard allowedRoles={categoryManagementRoles} redirectPath='/login'>
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

          <AuthGuard allowedRoles={orderHistoryRoles} redirectPath='/login'>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Order History</CardTitle>
                <History className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3 sm:mb-4 text-sm sm:text-base">
                  View past orders, export data, and re-create bills.
                </CardDescription>
                <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Link href="/orders">
                    View Orders <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AuthGuard>
          
          <AuthGuard allowedRoles={customerManagementRoles} redirectPath='/login'>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
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

          {isUserManagementCardVisible && (
            <AuthGuard allowedRoles={userManagementRoles} redirectPath='/login'>
              <Card className="shadow-lg hover:shadow-xl transition-shadow"> 
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl sm:text-2xl font-semibold">User Management</CardTitle>
                  <UserCog className="h-7 w-7 sm:h-8 sm:w-8 text-accent" />
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3 sm:mb-4 text-sm sm:text-base">
                    Manage user accounts, roles, and logout from your session.
                  </CardDescription>
                  <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                    <Link href="/settings/user-management">
                      Manage Users <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </AuthGuard>
          )}
        </div>
        
        <footer className="text-center py-4 text-sm text-muted-foreground">
          Created By Souvik Ghosh
        </footer>
      </div>
    </AuthGuard>
  );
}

