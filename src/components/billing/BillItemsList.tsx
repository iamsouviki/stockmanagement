
"use client";

import type { BillItem } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, MinusCircle, PlusCircle, Package } from 'lucide-react'; // Added Package
import Image from 'next/image';
// import Logo from '@/components/icons/Logo'; // No longer needed here
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface BillItemsListProps {
  items: BillItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
}

const BillItemsList: React.FC<BillItemsListProps> = ({ items, onRemoveItem, onUpdateQuantity }) => {
  
  const handleQuantityChange = (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(1, currentQuantity + change); // Quantity cannot be less than 1
    onUpdateQuantity(itemId, newQuantity);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl text-primary">Current Bill Items</CardTitle>
        <CardDescription className="text-sm sm:text-base">Review items added to the bill before finalizing.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table className="min-w-[600px] sm:min-w-full"><TableHeader>
              <TableRow>
                <TableHead className="w-[50px] sm:w-[60px] px-2 sm:px-4">Image</TableHead>
                <TableHead className="px-2 sm:px-4">Product</TableHead>
                <TableHead className="text-right px-2 sm:px-4">Price</TableHead>
                <TableHead className="text-center w-[120px] sm:w-[150px] px-1 sm:px-4">Quantity</TableHead>
                <TableHead className="text-right px-2 sm:px-4">Subtotal</TableHead>
                <TableHead className="text-center w-[60px] sm:w-[80px] px-2 sm:px-4">Remove</TableHead>
              </TableRow>
            </TableHeader><TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm sm:text-base">
                    No items added to the bill yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="px-2 sm:px-4">
                       {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={32} // Slightly smaller for mobile
                          height={32}
                          className="rounded-md object-cover sm:w-10 sm:h-10"
                          data-ai-hint={item.imageHint || "product item"}
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
                           <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words max-w-[150px] sm:max-w-xs">{item.name}</TableCell>
                    <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4">₹{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center px-1 sm:px-4">
                      <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleQuantityChange(item.id, item.billQuantity, -1)} disabled={item.billQuantity <= 1}>
                          <MinusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Input 
                          type="number" 
                          value={item.billQuantity} 
                          onChange={(e) => onUpdateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 sm:w-16 text-center h-7 sm:h-9 text-xs sm:text-sm"
                          min="1"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleQuantityChange(item.id, item.billQuantity, 1)}>
                          <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4">₹{(item.price * item.billQuantity).toFixed(2)}</TableCell>
                    <TableCell className="text-center px-2 sm:px-4">
                      <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onRemoveItem(item.id)} title="Remove Item">
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody></Table>
        <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BillItemsList;
