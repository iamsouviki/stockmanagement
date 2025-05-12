import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Boxes, Receipt, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-card rounded-lg shadow">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Welcome to StockPilot</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Your smart solution for electronics stock management.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl font-semibold">Manage Products</CardTitle>
            <Boxes className="h-8 w-8 text-accent" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              View, add, and update your product inventory. Keep track of serial numbers, stock levels, and more.
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
              Quickly generate bills for customers by adding products via barcode or manual entry.
            </CardDescription>
            <Button asChild variant="default" className="bg-primary hover:bg-primary/90">
              <Link href="/billing">
                Go to Billing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section className="mt-12 p-6 bg-card rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3 text-primary">Key Features</h2>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li><span className="font-medium text-foreground">Barcode Scanning Mockup:</span> Simulate quick product identification.</li>
          <li><span className="font-medium text-foreground">Manual Serial Number Entry:</span> Easily add or edit product details.</li>
          <li><span className="font-medium text-foreground">Simple Bill Generation:</span> Create customer bills efficiently.</li>
          <li><span className="font-medium text-foreground">Clean & Professional UI:</span> Modern design for ease of use.</li>
        </ul>
      </section>
    </div>
  );
}
