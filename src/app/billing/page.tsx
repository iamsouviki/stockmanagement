"use client";

import { useState, useEffect } from 'react';
import BarcodeEntry from '@/components/billing/BarcodeEntry';
import BillItemsList from '@/components/billing/BillItemsList';
import BillSummaryCard from '@/components/billing/BillSummaryCard';
import type { Product, BillItem } from '@/types';
import { mockProducts } from '@/data/mockData';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


export default function BillingPage() {
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setAvailableProducts(mockProducts);
  }, []);

  const handleProductAdd = (barcodeOrSn: string) => {
    const productToAdd = availableProducts.find(
      (p) => p.barcode === barcodeOrSn || p.serialNumber === barcodeOrSn
    );

    if (!productToAdd) {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode/SN: ${barcodeOrSn}`,
        variant: "destructive",
      });
      return;
    }

    if (productToAdd.quantity <= 0) {
       toast({
        title: "Out of Stock",
        description: `Product "${productToAdd.name}" is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    const existingItem = billItems.find((item) => item.id === productToAdd.id);

    if (existingItem) {
      if (existingItem.billQuantity < productToAdd.quantity) {
        setBillItems(
          billItems.map((item) =>
            item.id === productToAdd.id
              ? { ...item, billQuantity: item.billQuantity + 1 }
              : item
          )
        );
         toast({
          title: "Quantity Updated",
          description: `Quantity for "${productToAdd.name}" increased.`,
        });
      } else {
         toast({
          title: "Max Stock Reached",
          description: `Cannot add more of "${productToAdd.name}". Max stock available: ${productToAdd.quantity}.`,
          variant: "destructive",
        });
      }
    } else {
      setBillItems([...billItems, { ...productToAdd, billQuantity: 1 }]);
      toast({
        title: "Product Added",
        description: `"${productToAdd.name}" added to bill.`,
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const itemToRemove = billItems.find(item => item.id === itemId);
    setBillItems(billItems.filter((item) => item.id !== itemId));
    if (itemToRemove) {
      toast({
        title: "Item Removed",
        description: `"${itemToRemove.name}" removed from bill.`,
      });
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    const productInStock = availableProducts.find(p => p.id === itemId);
    if (!productInStock) return;

    if (newQuantity > productInStock.quantity) {
      toast({
        title: "Stock Limit Exceeded",
        description: `Cannot set quantity for "${productInStock.name}" to ${newQuantity}. Max stock available: ${productInStock.quantity}.`,
        variant: "destructive",
      });
      setBillItems(
        billItems.map((item) =>
          item.id === itemId ? { ...item, billQuantity: productInStock.quantity } : item
        )
      );
      return;
    }

    setBillItems(
      billItems.map((item) =>
        item.id === itemId ? { ...item, billQuantity: newQuantity } : item
      )
    );
  };

  const handleFinalizeBill = () => {
    if (billItems.length === 0) {
      toast({
        title: "Empty Bill",
        description: "Cannot generate an empty bill. Please add items first.",
        variant: "destructive",
      });
      return;
    }

    // Update stock quantities (mock)
    const updatedProducts = availableProducts.map(p => {
      const billedItem = billItems.find(bi => bi.id === p.id);
      if (billedItem) {
        return { ...p, quantity: p.quantity - billedItem.billQuantity };
      }
      return p;
    });
    setAvailableProducts(updatedProducts);
    // In a real app, this would persist to backend

    toast({
      title: "Bill Generated!",
      description: "The bill has been successfully finalized. (This is a simulation)",
      className: "bg-green-500 text-white", // Example custom styling for success
    });
    setBillItems([]); // Clear bill
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Create New Bill</h1>
        <p className="text-muted-foreground">
          Add products by barcode/SN and generate a bill for your customer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <BarcodeEntry onProductAdd={handleProductAdd} />
          {billItems.length > 0 ? (
            <BillItemsList
              items={billItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
            />
          ) : (
            <Alert className="border-accent text-accent">
              <Terminal className="h-4 w-4 !text-accent" />
              <AlertTitle>Empty Bill</AlertTitle>
              <AlertDescription>
                Scan or enter a product barcode/SN to start building the bill.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <div className="lg:col-span-1">
          <BillSummaryCard items={billItems} onFinalizeBill={handleFinalizeBill} />
        </div>
      </div>
    </div>
  );
}
