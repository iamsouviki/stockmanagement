'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import type { UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const allowedRoles: UserRole[] = ['owner'];

export default function SettingsPage() {
  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Settings</h1>
          <p className="text-muted-foreground">
            Manage application settings, bulk operations, and data exports.
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
        </div>
      </div>
    </AuthGuard>
  );
}
