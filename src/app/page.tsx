// src/app/page.tsx
'use client'; 

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Removed CardFooter as it's not directly used at the top level of this page for all cards
import { Button } from '@/components/ui/button';
import { Boxes, Receipt, ArrowRight, Users, History, BarChart3, LineChart, Tags, UserCog } from 'lucide-react'; 
import { Suspense } from 'react';
import OrdersChart from '@/components/dashboard/OrdersChart';
import TopSellingProductsChart from '@/components/dashboard/TopSellingProductsChart';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/auth/AuthGuard'; 
import type { UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth'; 
import { CardFooter } from "@/components/ui/card"; // Explicitly import CardFooter where needed

function ChartSkeleton() {
  return <Skeleton className="h-[280px] sm:h-[320px] w-full rounded-lg" />;
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
  const isCustomerManagementCardVisible = !isLoading && userProfile && customerManagementRoles.includes(userProfile.role);


  return (
    <AuthGuard> 
      <div className="space-y-6 md:space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          {welcomeMessage}
        </h1>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <Card className="shadow-lg col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-md sm:text-lg text-primary flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" /> Recent Orders (Last 7 Days)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Daily order volume.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[280px] sm:min-h-[320px] px-1 sm:px-2 md:px-4"> {/* Adjusted padding */}
              <Suspense fallback={<ChartSkeleton />}>
                <OrdersChart />
              </Suspense>
            </CardContent>
          </Card>
          <Card className="shadow-lg col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-md sm:text-lg text-primary flex items-center">
                <LineChart className="mr-2 h-5 w-5" /> Top 5 Selling Products
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Units sold for top products.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[280px] sm:min-h-[320px] px-1 sm:px-2 md:px-4"> {/* Adjusted padding */}
              <Suspense fallback={<ChartSkeleton />}>
                <TopSellingProductsChart />
              </Suspense>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AuthGuard allowedRoles={productManagementRoles} redirectPath='/login'>
            <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg sm:text-xl font-semibold">Manage Products</CardTitle>
                <Boxes className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="mb-3 text-sm sm:text-base">
                  View, add, update inventory, and perform bulk uploads.
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/products">
                    Go to Products <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </AuthGuard>

          <AuthGuard allowedRoles={billingRoles} redirectPath='/login'>
            <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg sm:text-xl font-semibold">Create Bill</CardTitle>
                <Receipt className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="mb-3 text-sm sm:text-base">
                  Generate bills by adding products via barcode or manual entry.
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/billing">
                    Go to Billing <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </AuthGuard>
          
          <AuthGuard allowedRoles={categoryManagementRoles} redirectPath='/login'>
            <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg sm:text-xl font-semibold">Categories</CardTitle>
                <Tags className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="mb-3 text-sm sm:text-base">
                  Organize products by managing categories.
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/categories">
                    Manage Categories <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </AuthGuard>

          <AuthGuard allowedRoles={orderHistoryRoles} redirectPath='/login'>
            <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg sm:text-xl font-semibold">Order History</CardTitle>
                <History className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="mb-3 text-sm sm:text-base">
                  View past orders, export data, and re-create bills.
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                  <Link href="/orders">
                    View Orders <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </AuthGuard>
          
          {isCustomerManagementCardVisible && (
            <AuthGuard allowedRoles={customerManagementRoles} redirectPath='/login'>
                <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg sm:text-xl font-semibold">Manage Customers</CardTitle>
                    <Users className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
                </CardHeader>
                <CardContent className="flex-grow">
                    <CardDescription className="mb-3 text-sm sm:text-base">
                    View, add, and update customer information.
                    </CardDescription>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                    <Link href="/customers">
                        Go to Customers <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    </Button>
                </CardFooter>
                </Card>
            </AuthGuard>
          )}


          {isUserManagementCardVisible && (
            <AuthGuard allowedRoles={userManagementRoles} redirectPath='/login'>
              <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col"> 
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg sm:text-xl font-semibold">User Management</CardTitle>
                  <UserCog className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className="mb-3 text-sm sm:text-base">
                    Manage user accounts, roles, and logout from your session.
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90">
                    <Link href="/settings/user-management">
                      Manage Users <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
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
