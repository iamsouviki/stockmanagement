"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BarcodeEntry from '@/components/billing/BarcodeEntry';
import BillItemsList from '@/components/billing/BillItemsList';
import BillSummaryCard from '@/components/billing/BillSummaryCard';
import type { Product, BillItem, OrderItemData, Order, Customer } from '@/types';
import type { CustomerFormData } from '@/components/customers/CustomerForm';
import CustomerDialog from '@/components/customers/CustomerDialog';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, UserSearch, PlusCircle } from "lucide-react";
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { getProducts, addOrderAndDecrementStock, getOrder as getOrderById, findCustomerByMobile, getCustomer as getCustomerById, addCustomer } from '@/services/firebaseService';
import { storeDetails } from '@/config/storeDetails';
import { Timestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Define a skeleton component for the Suspense fallback
function BillingPageLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
          </div>
          <div className="lg:col-span-1">
              <Skeleton className="h-48 w-full" />
          </div>
      </div>
    </div>
  );
}

function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromOrderId = searchParams.get('fromOrder');

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [searchedMobileForNotFound, setSearchedMobileForNotFound] = useState<string | null>(null);
  const [foundCustomers, setFoundCustomers] = useState<Customer[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);


  const { toast } = useToast();

  const fetchProductData = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const products = await getProducts();
      setAvailableProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
    }
    setIsLoadingProducts(false);
  }, [toast]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  useEffect(() => {
    if (fromOrderId && availableProducts.length > 0) { 
      const loadOrderForRebill = async () => {
        try {
          const order = await getOrderById(fromOrderId);
          if (order) {
            const itemsForBill: BillItem[] = order.items.map(item => {
              const productDetails = availableProducts.find(p => p.id === item.productId);
              return {
                ...item, 
                id: item.productId, 
                quantity: productDetails?.quantity ?? 0, 
                categoryId: productDetails?.categoryId ?? '',
                serialNumber: item.serialNumber || productDetails?.serialNumber || '',
                barcode: item.barcode || productDetails?.barcode || '',
              };
            });
            setBillItems(itemsForBill);
            if(order.customerId) {
              const customer = await getCustomerById(order.customerId);
              setSelectedCustomer(customer);
              if (customer) setCustomerSearchTerm(customer.mobileNumber);
            } else if (order.customerMobile) {
              setCustomerSearchTerm(order.customerMobile);
              // Trigger search if mobile is present but no customer ID
              await handleSearchCustomer(order.customerMobile);
            }
            toast({ title: "Order Loaded", description: `Items from order ${order.orderNumber} loaded for re-billing.` });
          } else {
            toast({ title: "Error", description: "Order not found for re-billing.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Error loading order for re-bill:", error);
          toast({ title: "Error", description: "Failed to load order for re-billing.", variant: "destructive" });
        }
      };
      loadOrderForRebill();
    }
  }, [fromOrderId, toast, availableProducts, router]);


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
      } else {
         toast({
          title: "Max Stock Reached",
          description: `Cannot add more of "${productToAdd.name}". Max stock available: ${productToAdd.quantity}.`,
          variant: "destructive",
        });
      }
    } else {
      setBillItems([...billItems, { ...productToAdd, billQuantity: 1 }]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setBillItems(billItems.filter((item) => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    const productInStock = availableProducts.find(p => p.id === itemId);
    if (!productInStock) return;

    if (newQuantity <= 0) { 
        handleRemoveItem(itemId);
        return;
    }

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

  const handleSearchCustomer = async (mobile?: string) => {
    const term = mobile || customerSearchTerm.trim();
    if (!term) {
      setFoundCustomers([]);
      setSearchedMobileForNotFound(null);
      return;
    }
    setIsSearchingCustomer(true);
    setSearchedMobileForNotFound(null);
    try {
      const customers = await findCustomerByMobile(term);
      setFoundCustomers(customers);
      if (customers.length === 0) {
        toast({ title: "No Customer Found", description: "No customer with this mobile. You can add them."});
        setSearchedMobileForNotFound(term); // Store the searched mobile if not found
      } else {
        // If multiple customers are found (should ideally not happen with unique mobile), list them.
        // If one is found, could auto-select or let user click. For now, list all.
      }
    } catch (error) {
      toast({ title: "Search Error", description: "Failed to search for customer.", variant: "destructive"});
    }
    setIsSearchingCustomer(false);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFoundCustomers([]);
    setCustomerSearchTerm(customer.mobileNumber); 
    setSearchedMobileForNotFound(null);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearchTerm('');
    setFoundCustomers([]);
    setSearchedMobileForNotFound(null);
  };

  const handleOpenCustomerDialog = () => {
    setIsCustomerDialogOpen(true);
  };

  const handleSubmitNewCustomerInBilling = async (data: CustomerFormData) => {
    try {
      const existingCustomersWithMobile = await findCustomerByMobile(data.mobileNumber);
      if (existingCustomersWithMobile.length > 0) {
        toast({
          title: "Mobile Number Exists",
          description: "This mobile number is already associated with another customer.",
          variant: "destructive",
        });
        return;
      }

      const customerData = {
        ...data,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.name.split(" ")[0])}/200/200`,
        imageHint: "person avatar",
      };
      const newCustomerId = await addCustomer(customerData);
      const newCustomerEntry: Customer = {
        ...customerData,
        id: newCustomerId,
      };
      
      handleSelectCustomer(newCustomerEntry); // Select the newly added customer
      setIsCustomerDialogOpen(false);
      setSearchedMobileForNotFound(null);
      toast({
        title: "Customer Added",
        description: `"${data.name}" has been successfully added and selected for this bill.`,
      });

    } catch (error) {
      console.error("Error adding customer from billing:", error);
      toast({ title: "Error", description: "Failed to add new customer.", variant: "destructive" });
    }
  };


  const generateBillPDF = (order: Order, items: BillItem[]) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let yPos = margin;
    
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
    doc.text(`Order No: ${order.orderNumber}`, margin, yPos);
    const orderDateStr = order.orderDate instanceof Timestamp ? format(order.orderDate.toDate(), 'MMMM dd, yyyy HH:mm:ss') : String(order.orderDate);
    doc.text(`Date: ${orderDateStr}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    if (selectedCustomer) {
      doc.text(`Customer: ${selectedCustomer.name} (${selectedCustomer.mobileNumber})`, margin, yPos);
       if(selectedCustomer.address) {
        yPos +=5;
        doc.text(`Address: ${selectedCustomer.address}`, margin, yPos);
      }
    } else if (order.customerName && order.customerMobile) { // Fallback for re-billed orders if customer not re-selected
       doc.text(`Customer: ${order.customerName} (${order.customerMobile})`, margin, yPos);
    }
     else {
      doc.text(`Customer: Walk-in`, margin, yPos);
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
    doc.line(margin, yPos -2 , pageWidth - margin, yPos -2);
    yPos += 3;
    
    doc.setFont('helvetica', 'normal');
    items.forEach(item => {
      if (yPos > pageHeight - 40) { 
        doc.addPage();
        yPos = margin; 
      }
      const itemSubtotal = item.price * item.billQuantity;
      doc.text(item.name, headX[0], yPos, { maxWidth: headX[1] - headX[0] - 5 });
      doc.text(item.serialNumber || item.barcode, headX[1], yPos, { maxWidth: headX[2] - headX[1] - 5});
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
    doc.text(`$${order.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    doc.text(`Tax (${(storeDetails.gstNo ? (0.08 * 100) : 0).toFixed(0)}%):`, summaryX, yPos, { align: 'right' });
    doc.text(`$${order.taxAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.line(summaryX - 20, yPos, pageWidth - margin, yPos);
    yPos += 6;
    doc.text('Total Amount:', summaryX, yPos, { align: 'right' });
    doc.text(`$${order.totalAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business! - Generated by StockPilot', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`StockPilot-Bill-${order.orderNumber}.pdf`);
  };


  const handleFinalizeBill = async () => {
    if (billItems.length === 0) {
      toast({
        title: "Empty Bill",
        description: "Cannot generate an empty bill. Add items first.",
        variant: "destructive",
      });
      return;
    }

    const subtotal = billItems.reduce((sum, item) => sum + item.price * item.billQuantity, 0);
    const taxRate = 0.08; 
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    const orderItems: OrderItemData[] = billItems.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      billQuantity: item.billQuantity,
      imageUrl: item.imageUrl,
      imageHint: item.imageHint,
      serialNumber: item.serialNumber,
      barcode: item.barcode,
    }));

    const orderData: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt'> = {
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerMobile: selectedCustomer?.mobileNumber,
      items: orderItems,
      subtotal,
      taxAmount,
      totalAmount,
    };
    
    const itemsToDecrementStock = billItems.map(item => ({
      productId: item.id,
      quantity: item.billQuantity,
    }));

    try {
      const newOrderId = await addOrderAndDecrementStock(orderData, itemsToDecrementStock);
      
      // Fetch the actual order data to get server-generated fields like orderNumber and precise orderDate
      const newOrder = await getOrderById(newOrderId);
      if (!newOrder) {
          throw new Error("Failed to retrieve the newly created order for PDF generation.");
      }
      
      generateBillPDF(newOrder, billItems);

      toast({
        title: "Bill Generated!",
        description: "Order saved and PDF has been downloaded.",
        className: "bg-green-500 text-white",
      });
      setBillItems([]); // Clear bill items
      handleClearCustomer(); // Clear customer details
      fetchProductData(); 
      if (fromOrderId) router.push('/billing'); 
    } catch (error) {
      console.error("Error finalizing bill:", error);
      toast({
        title: "Bill Finalization Failed",
        description: "Could not save order or generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Initial loading state for the content, before fromOrderId is processed
  if (isLoadingProducts && !fromOrderId) { 
    return <BillingPageLoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {fromOrderId ? "Re-create Bill" : "Create New Bill"}
        </h1>
        <p className="text-muted-foreground">
          Add products by barcode/SN and generate a bill for your customer.
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Customer Details (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 border rounded-md bg-secondary">
              <div>
                <p className="font-semibold">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.mobileNumber}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearCustomer}>Change</Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search customer by mobile..."
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    if(searchedMobileForNotFound) setSearchedMobileForNotFound(null); // Clear if user types again
                    if(foundCustomers.length > 0) setFoundCustomers([]); // Clear previous search results
                  }}
                  className="flex-grow"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
                />
                <Button onClick={() => handleSearchCustomer()} disabled={isSearchingCustomer} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <UserSearch className="mr-2 h-5 w-5" /> {isSearchingCustomer ? "Searching..." : "Search"}
                </Button>
              </div>
              {foundCustomers.length > 0 && (
                <ul className="border rounded-md max-h-40 overflow-y-auto">
                  {foundCustomers.map(cust => (
                    <li key={cust.id} className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0" onClick={() => handleSelectCustomer(cust)}>
                      {cust.name} - {cust.mobileNumber}
                    </li>
                  ))}
                </ul>
              )}
              {searchedMobileForNotFound && foundCustomers.length === 0 && !isSearchingCustomer && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Customer with mobile <span className="font-semibold">{searchedMobileForNotFound}</span> not found.</p>
                  <Button variant="outline" onClick={handleOpenCustomerDialog}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>


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
             isLoadingProducts ? <Skeleton className="h-40 w-full" /> :
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
           { isLoadingProducts && billItems.length === 0 ? <Skeleton className="h-48 w-full" /> :
            <BillSummaryCard items={billItems} onFinalizeBill={handleFinalizeBill} />
           }
        </div>
      </div>
      <CustomerDialog
        isOpen={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        onSubmit={handleSubmitNewCustomerInBilling}
        initialMobileNumber={searchedMobileForNotFound || undefined} 
      />
    </div>
  );
}


export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageLoadingSkeleton />}>
      <BillingPageContent />
    </Suspense>
  );
}
