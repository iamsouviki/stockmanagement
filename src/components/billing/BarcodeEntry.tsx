"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface BarcodeEntryProps {
  onProductAdd: (barcodeOrSn: string) => void;
}

const BarcodeEntry: React.FC<BarcodeEntryProps> = ({ onProductAdd }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onProductAdd(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Add Product to Bill</CardTitle>
        <CardDescription>Enter barcode or serial number to add a product.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter Barcode or Serial Number"
            aria-label="Barcode or Serial Number"
            className="flex-grow"
          />
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
            <ScanLine className="mr-2 h-5 w-5" /> Add Item
          </Button>
        </form>
         <p className="mt-3 text-sm text-muted-foreground">
            Note: This is a mockup. Actual camera scanning is not implemented.
          </p>
      </CardContent>
    </Card>
  );
};

export default BarcodeEntry;
