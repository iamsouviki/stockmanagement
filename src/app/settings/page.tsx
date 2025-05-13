'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import type { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, ArrowRight, Users as UsersIcon } from 'lucide-react'; // Added UsersIcon
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';


const allowedRoles: UserRole[] = ['owner']; // Page itself is for owner
const userManagementRoles: UserRole[] = ['owner', 'admin']; // User management card for owner/admin

export default function SettingsPage() {
  const { userProfile, logout } = useAuth(); // Get userProfile to check role for user management card

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
          <p className="text-muted-foreground">
            Manage application settings, bulk operations, data exports, and users.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-semibold">Bulk Product Upload</CardTitle>
              <UploadCloud className="h-7 w-7 text-accent" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Upload products in bulk using an Excel or CSV file.
              </CardDescription>
              <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                <Link href="/settings/bulk-upload">
                  Go to Bulk Upload <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl font-semibold">Export Orders</CardTitle>
              <Download className="h-7 w-7 text-accent" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Export order history to a CSV file for analysis.
              </CardDescription>
               <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                 <Link href="/settings/export-orders">
                  Go to Export Orders <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* User Management Card - Visible to Owner and Admin */}
          {userProfile && userManagementRoles.includes(userProfile.role) && (
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-semibold">User Management</CardTitle>
                <UsersIcon className="h-7 w-7 text-accent" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Manage user accounts, roles, and permissions.
                </CardDescription>
                <Button asChild variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Link href="/settings/user-management">
                    Manage Users <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
           <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-semibold">Account</CardTitle>
                {/* You can use a generic icon or UserCircle icon here */}
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Log out from your current session.
                </CardDescription>
                <Button onClick={logout} variant="outline" className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10">
                  Logout
                </Button>
              </CardContent>
            </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
