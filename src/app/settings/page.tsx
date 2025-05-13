// src/app/settings/page.tsx
'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import type { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users as UsersIcon, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Page itself is for owner and admin (for user management)
const allowedAccessRoles: UserRole[] = ['owner', 'admin']; 
const userManagementRoles: UserRole[] = ['owner', 'admin']; // User management card for owner/admin

export default function SettingsPage() {
  const { userProfile, logout } = useAuth(); 

  return (
    <AuthGuard allowedRoles={allowedAccessRoles}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
          <p className="text-muted-foreground">
            Manage application users and your account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                 <LogOut className="h-7 w-7 text-destructive" />
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Log out from your current session.
                </CardDescription>
                <Button onClick={logout} variant="outline" className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                  Logout
                </Button>
              </CardContent>
            </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
