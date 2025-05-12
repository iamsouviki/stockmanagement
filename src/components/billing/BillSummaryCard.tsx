"use client";

import type { BillItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';

interface BillSummaryCardProps {
  items: BillItem[];
  onFinalizeBill: () => void;
}

const BillSummaryCard: React.FC<BillSummaryCardProps> = ({ items, onFinalizeBill }) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.billQuantity, 0);
  const taxRate = 0.08; // Example tax rate: 8%
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  return (
    <Card className="shadow-lg sticky top-20"> {/* Sticky for visibility while scrolling items */}
      <CardHeader>
        <CardTitle className="text-xl text-primary">Bill Summary</CardTitle>
        <CardDescription>Review the total amount before finalizing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax ({ (taxRate * 100).toFixed(0) }%):</span>
          <span className="font-medium">${taxAmount.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-semibold">
          <span className="text-foreground">Total Amount:</span>
          <span className="text-primary">${totalAmount.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onFinalizeBill} 
          className="w-full bg-primary hover:bg-primary/90" 
          disabled={items.length === 0}
        >
          <FileText className="mr-2 h-5 w-5" /> Finalize & Generate Bill
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BillSummaryCard;
