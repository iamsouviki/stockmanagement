"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Order } from '@/types';
import { getOrder } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Logo from '@/components/icons/Logo'; // Import Logo
import jsPDF from 'jspdf';
import { storeDetails } from '@/config/storeDetails';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        setIsLoading(true);
        try {
          const fetchedOrder = await getOrder(orderId);
          if (fetchedOrder) {
            setOrder(fetchedOrder);
          } else {
            toast({ title: "Error", description: "Order not found.", variant: "destructive" });
            router.push('/orders');
          }
        } catch (error) {
          console.error("Error fetching order:", error);
          toast({ title: "Error", description: "Failed to fetch order details.", variant: "destructive" });
        }
        setIsLoading(false);
      };
      fetchOrder();
    }
  }, [orderId, toast, router]);

  const formatDate = (dateValue: Timestamp | string | Date | undefined) => {
    if (!dateValue) return 'N/A';
    if (dateValue instanceof Timestamp) {
      return format(dateValue.toDate(), 'PPpp');
    }
    if (typeof dateValue === 'string') {
      return format(new Date(dateValue), 'PPpp');
    }
    if (dateValue instanceof Date) {
      return format(dateValue, 'PPpp');
    }
    return 'N/A';
  };

  const generateOrderPDF = (currentOrder: Order) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let yPos = margin;

    // Add logo if available - using a simple text placeholder for actual image loading
    // For actual image, you would need to load it (e.g. fetch as base64 or have it preloaded)
    // then use doc.addImage(imageData, 'PNG', margin, yPos, logoWidth, logoHeight);
    // For simplicity, let's assume storeDetails.logoUrl could be a base64 string or URL
    // if (storeDetails.logoUrl && storeDetails.logoUrl.startsWith('data:image')) {
    //   try {
    //      // Example: const img = new Image(); img.src = storeDetails.logoUrl; doc.addImage(img, 'PNG', ...);
    //   } catch (e) { console.error("Error adding logo to PDF", e); }
    // } else {
      // Fallback or skip if logo is a URL that needs fetching, or not a data URI
    // }
    // yPos += (logoHeight || 0) + 5; // Adjust yPos based on logo height

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(storeDetails.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(storeDetails.storeType, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(9);
    doc.text(storeDetails.address, margin, yPos);
    doc.text(storeDetails.contact, pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`GSTIN: ${storeDetails.gstNo}`, margin, yPos);
    yPos += 8;

    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order No: ${currentOrder.orderNumber}`, margin, yPos);
    doc.text(`Date: ${formatDate(currentOrder.orderDate)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    const customerIdentifier = currentOrder.customerName
      ? `${currentOrder.customerName} (${currentOrder.customerMobile || 'N/A'})`
      : (currentOrder.customerMobile || 'Walk-in Customer');
    doc.text(`Customer: ${customerIdentifier}`, margin, yPos);
    if (currentOrder.customerName && currentOrder.items.find(it => it.productId === currentOrder.customerId)) { // A bit of a hack to check if customer has address from selectedCustomer
        const customerForAddress = currentOrder; // Assuming order detail might have customer address
        // if (customerForAddress.address) { // This field doesn't exist on order, would need to fetch customer or pass through
        //    yPos +=5;
        //    doc.text(`Address: ${customerForAddress.address}`, margin, yPos);
        // }
    }

    yPos += 10;

    doc.setLineWidth(0.2);
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const headX = [margin, margin + 70, margin + 95, margin + 115, margin + 140];
    doc.text('Product Name', headX[0], yPos);
    doc.text('SN/Barcode', headX[1], yPos);
    doc.text('Qty', headX[2], yPos, { align: 'right' });
    doc.text('Price', headX[3], yPos, { align: 'right' });
    doc.text('Subtotal', headX[4] + 30, yPos, { align: 'right' });
    yPos += 5;
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    yPos += 3;

    doc.setFont('helvetica', 'normal');
    currentOrder.items.forEach((item) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
      const itemSubtotal = item.price * item.billQuantity;
      doc.text(item.name, headX[0], yPos, { maxWidth: headX[1] - headX[0] - 5 });
      doc.text(item.serialNumber || item.barcode || 'N/A', headX[1], yPos, { maxWidth: headX[2] - headX[1] - 5 });
      doc.text(item.billQuantity.toString(), headX[2], yPos, { align: 'right' });
      doc.text(`$${item.price.toFixed(2)}`, headX[3], yPos, { align: 'right' });
      doc.text(`$${itemSubtotal.toFixed(2)}`, headX[4] + 30, yPos, { align: 'right' });
      yPos += 6;
    });

    yPos += 5;
    const summaryX = pageWidth - margin - 50;
    doc.line(summaryX - 20, yPos, pageWidth - margin, yPos);
    yPos += 5;

    doc.setFontSize(10);
    doc.text('Subtotal:', summaryX, yPos, { align: 'right' });
    doc.text(`$${currentOrder.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
    doc.text(`Tax (${(storeDetails.gstNo ? (0.08 * 100) : 0).toFixed(0)}%):`, summaryX, yPos, { align: 'right' });
    doc.text(`$${currentOrder.taxAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.line(summaryX - 20, yPos, pageWidth - margin, yPos);
    yPos += 6;
    doc.text('Total Amount:', summaryX, yPos, { align: 'right' });
    doc.text(`$${currentOrder.totalAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business! - Generated by StockPilot', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`StockPilot-Bill-${currentOrder.orderNumber}.pdf`);
    toast({ title: "PDF Generated", description: "The order PDF has been downloaded." });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-1/2" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <CardFooter>
          <Skeleton className="h-10 w-1/4" />
        </CardFooter>
      </div>
    );
  }

  if (!order) {
    return <p>Order not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Order Details: {order.orderNumber}</CardTitle>
          <CardDescription>Date: {formatDate(order.orderDate)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Customer Information</h3>
            <p>Name: {order.customerName || 'N/A'}</p>
            <p>Mobile: {order.customerMobile || 'N/A'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Items Ordered</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SN/Barcode</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={item.productId + index}>
                    <TableCell>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                          data-ai-hint={item.imageHint || "product item"}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center overflow-hidden">
                           <Logo className="h-full w-auto p-1" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.serialNumber || item.barcode || 'N/A'}</TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{item.billQuantity}</TableCell>
                    <TableCell className="text-right">${(item.price * item.billQuantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-right space-y-1 pr-4">
            <p>
              Subtotal: <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
            </p>
            <p>
              Tax: <span className="font-semibold">${order.taxAmount.toFixed(2)}</span>
            </p>
            <p className="text-xl font-bold">
              Total: <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => generateOrderPDF(order)}>
            <Printer className="mr-2 h-4 w-4" /> Print Bill
          </Button>
          <Button onClick={() => router.push(`/billing?fromOrder=${order.id}`)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Copy className="mr-2 h-4 w-4" /> Re-create Bill
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
