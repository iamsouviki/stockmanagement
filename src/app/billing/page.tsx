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
import jsPDF from 'jspdf';
import { format } from 'date-fns';

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

  const generateBillPDF = (items: BillItem[]) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20; // Start position for content

    // Bill Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('StockPilot Invoice', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const billDate = format(new Date(), 'MMMM dd, yyyy HH:mm:ss');
    doc.text(`Date: ${billDate}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 10;

    // Line Separator
    doc.setLineWidth(0.2);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Bill Items Table Header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Product Name', 20, yPos);
    doc.text('Qty', 120, yPos, { align: 'right' });
    doc.text('Price', 150, yPos, { align: 'right' });
    doc.text('Subtotal', 190, yPos, { align: 'right' });
    yPos += 6;
    doc.line(20, yPos, pageWidth - 20, yPos); // Line below header
    yPos += 6;

    // Bill Items Table Body
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    items.forEach(item => {
      if (yPos > pageHeight - 40) { // Check for page break
        doc.addPage();
        yPos = 20; // Reset Y position for new page
        // Repeat headers if needed, or just start content
      }
      const subtotal = item.price * item.billQuantity;
      doc.text(item.name, 20, yPos, { maxWidth: 95 }); // Add maxWidth to prevent overflow
      doc.text(item.billQuantity.toString(), 120, yPos, { align: 'right' });
      doc.text(`$${item.price.toFixed(2)}`, 150, yPos, { align: 'right' });
      doc.text(`$${subtotal.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 7;
    });

    yPos += 5; // Space before summary
    doc.line(100, yPos, pageWidth - 20, yPos); // Line above summary
    yPos += 6;

    // Bill Summary
    const subtotal = items.reduce((sum, item) => sum + item.price * item.billQuantity, 0);
    const taxRate = 0.08; // Example tax rate: 8%
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    doc.setFontSize(10);
    doc.text('Subtotal:', 150, yPos, { align: 'right' });
    doc.text(`$${subtotal.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 6;

    doc.text(`Tax (${(taxRate * 100).toFixed(0)}%):`, 150, yPos, { align: 'right' });
    doc.text(`$${taxAmount.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 6;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.line(100, yPos, pageWidth - 20, yPos); // Line above total
    yPos += 6;
    doc.text('Total Amount:', 150, yPos, { align: 'right' });
    doc.text(`$${totalAmount.toFixed(2)}`, 190, yPos, { align: 'right' });

    // Footer (Optional)
    yPos = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    doc.save(`StockPilot-Bill-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`);
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

    // Generate PDF
    try {
      generateBillPDF(billItems);

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
        description: "The bill PDF has been generated and downloaded.",
        className: "bg-green-500 text-white", // Example custom styling for success
      });
      setBillItems([]); // Clear bill
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the bill PDF. Please try again.",
        variant: "destructive",
      });
    }
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
