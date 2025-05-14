// src/components/billing/BillSummaryCard.tsx
"use client";

import type { BillItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Edit3, Loader2 } from 'lucide-react'; // Added Edit3 and Loader2

interface BillSummaryCardProps {
  items: BillItem[];
  onFinalizeBill: () => void;
  finalizeButtonText?: string;
  isProcessing?: boolean; 
  disabled?: boolean; 
}

const BillSummaryCard: React.FC<BillSummaryCardProps> = ({ items, onFinalizeBill, finalizeButtonText = "Finalize & Generate Bill", isProcessing, disabled }) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.billQuantity, 0);
  const taxRate = 0.18; 
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const ButtonIcon = finalizeButtonText.toLowerCase().includes("update") ? Edit3 : FileText;


  return (
    <Card className="shadow-lg lg:sticky lg:top-20"> 
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl text-primary">Bill Summary</CardTitle>
        <CardDescription className="text-sm sm:text-base">Review the total amount before finalizing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 text-sm sm:text-base">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">GST ({ (taxRate * 100).toFixed(0) }%):</span>
          <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-md sm:text-lg font-semibold">
          <span className="text-foreground">Total Amount:</span>
          <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onFinalizeBill} 
          className="w-full bg-primary hover:bg-primary/90" 
          disabled={disabled || items.length === 0 || isProcessing}
          size="lg" 
        >
          {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ButtonIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />}
          {isProcessing ? (finalizeButtonText.toLowerCase().includes("update") ? "Updating..." : "Finalizing...") : finalizeButtonText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BillSummaryCard;
