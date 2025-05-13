// src/components/billing/BillingPageContent.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BarcodeEntry from '@/components/billing/BarcodeEntry';
import BillItemsList from '@/components/billing/BillItemsList';
import BillSummaryCard from '@/components/billing/BillSummaryCard';
import type { Product, BillItem, OrderItemData, Order, Customer } from '@/types';
import { WALK_IN_CUSTOMER_ID } from '@/types'; // Import WALK_IN_CUSTOMER_ID
import type { CustomerFormData } from '@/components/customers/CustomerForm';
import CustomerDialog from '@/components/customers/CustomerDialog';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserSearch, PlusCircle, Info } from "lucide-react";
// import jsPDF from 'jspdf'; // No longer directly used here
// import { format } from 'date-fns'; // No longer directly used here for PDF
import { getProducts, addOrderAndDecrementStock, getOrder as getOrderById, findCustomerByMobile, getCustomer as getCustomerById, addCustomer } from '@/services/firebaseService';
import { storeDetails } from '@/config/storeDetails';
// import { Timestamp } from 'firebase/firestore'; // No longer directly used here for PDF
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BillingPageLoadingSkeleton from './BillingPageLoadingSkeleton';
import { generateInvoicePdf } from '@/lib/pdfGenerator'; // Import the new PDF utility

export default function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromOrderId = searchParams.get('fromOrder');

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrderForRebill, setIsLoadingOrderForRebill] = useState(false);
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
        setIsLoadingOrderForRebill(true);
        try {
          const order = await getOrderById(fromOrderId);
          if (order) {
            const itemsForBill: BillItem[] = order.items.map(item => {
              const productDetails = availableProducts.find(p => p.id === item.productId);
              return {
                ...item,
                id: item.productId,
                name: productDetails?.name || item.name,
                price: productDetails?.price || item.price,
                quantity: productDetails?.quantity ?? 0, 
                billQuantity: item.billQuantity,
                categoryId: productDetails?.categoryId ?? '',
                serialNumber: item.serialNumber || productDetails?.serialNumber || '',
                barcode: item.barcode || productDetails?.barcode || '',
                imageUrl: productDetails?.imageUrl || item.imageUrl,
                imageHint: productDetails?.imageHint || item.imageHint,
              };
            });
            setBillItems(itemsForBill);
            if (order.customerId && order.customerId !== WALK_IN_CUSTOMER_ID) {
              const customer = await getCustomerById(order.customerId);
              setSelectedCustomer(customer);
              if (customer) setCustomerSearchTerm(customer.mobileNumber);
            } else if (order.customerMobile && order.customerId === WALK_IN_CUSTOMER_ID) {
               // For walk-in, but if mobile was captured, prefill search
              setCustomerSearchTerm(order.customerMobile);
              // No need to auto-search if it was a walk-in, just prefill
            }
            toast({ title: "Order Loaded", description: `Items from order ${order.orderNumber} loaded for re-billing.` });
          } else {
            toast({ title: "Error", description: "Order not found for re-billing.", variant: "destructive" });
            router.replace('/billing');
          }
        } catch (error) {
          console.error("Error loading order for re-bill:", error);
          toast({ title: "Error", description: "Failed to load order for re-billing.", variant: "destructive" });
          router.replace('/billing');
        }
        setIsLoadingOrderForRebill(false);
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
      setSelectedCustomer(null); // Clear selected customer if search term is empty
      return;
    }
    setIsSearchingCustomer(true);
    setSearchedMobileForNotFound(null);
    try {
      const customers = await findCustomerByMobile(term);
      setFoundCustomers(customers);
      if (customers.length === 0) {
        toast({ title: "No Customer Found", description: "No customer with this mobile. You can add them." });
        setSearchedMobileForNotFound(term);
        setSelectedCustomer(null); // Clear selected customer if not found
      } else if (customers.length === 1) {
        // If only one customer is found, auto-select them.
        handleSelectCustomer(customers[0]);
      }
    } catch (error) {
      toast({ title: "Search Error", description: "Failed to search for customer.", variant: "destructive" });
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

      handleSelectCustomer(newCustomerEntry);
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


  const handleFinalizeBill = async () => {
    if (billItems.length === 0) {
      toast({
        title: "Empty Bill",
        description: "Cannot generate an empty bill. Add items first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedCustomer && !searchedMobileForNotFound) {
        toast({
            title: "Customer Not Selected",
            description: "Please search for a customer or add a new one before finalizing the bill.",
            variant: "destructive",
        });
        return;
    }
    
    let customerForOrder: Customer | null = selectedCustomer;

    // If a customer was searched but not found, and user proceeds, means it's a new walk-in for this bill
    // Or if no customer selected and no mobile searched (should be caught above, but defensive)
    if (!customerForOrder && searchedMobileForNotFound) {
      // This case might be simplified if we always force selection or new customer addition
      // For now, let's assume if selectedCustomer is null, it's a generic walk-in unless a dialog was used to add one.
      // The current logic forces selectedCustomer to be non-null or opens a dialog.
      // So, this branch might be less relevant if user flow enforces customer selection/addition.
    }


    const subtotal = billItems.reduce((sum, item) => sum + item.price * item.billQuantity, 0);
    const taxRate = 0.18;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    const orderItems: OrderItemData[] = billItems.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      billQuantity: item.billQuantity,
      imageUrl: item.imageUrl || null,
      imageHint: item.imageHint || null,
      serialNumber: item.serialNumber || null,
      barcode: item.barcode || null,
    }));

    const customerId = customerForOrder?.id || WALK_IN_CUSTOMER_ID;
    const customerName = customerForOrder?.name || "Walk-in Customer";
    const customerMobile = customerForOrder?.mobileNumber || searchedMobileForNotFound || "N/A";
    const customerAddress = customerForOrder?.address || null;


    const orderData: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt' | 'updatedAt'> = {
      customerId: customerId,
      customerName: customerName,
      customerMobile: customerMobile,
      customerAddress: customerAddress, 
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
      const newOrder = await getOrderById(newOrderId); 
      if (!newOrder) {
        throw new Error("Failed to retrieve the newly created order for PDF generation.");
      }

      generateInvoicePdf(newOrder, storeDetails); 

      toast({
        title: "Bill Sent for Printing!",
        description: `Order ${newOrder.orderNumber} saved. PDF is opening for print.`,
        className: "bg-green-500 text-white",
        duration: 5000,
      });
      setBillItems([]);
      handleClearCustomer();
      fetchProductData(); 
      if (fromOrderId) router.replace('/billing'); 
    } catch (error) {
      console.error("Error finalizing bill:", error);
      toast({
        title: "Bill Finalization Failed",
        description: "Could not save order or generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if ((isLoadingProducts && !fromOrderId) || (fromOrderId && isLoadingOrderForRebill)) {
    return <BillingPageLoadingSkeleton />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          {fromOrderId ? "Re-create Bill" : "Create New Bill"}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Add products by barcode/SN and generate a bill for your customer.
        </p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-primary">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedCustomer ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-secondary/50">
              <div className="mb-2 sm:mb-0">
                <p className="font-semibold text-base sm:text-lg">{selectedCustomer.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{selectedCustomer.mobileNumber}</p>
                 {selectedCustomer.address && <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate" title={selectedCustomer.address}>{selectedCustomer.address}</p>}
              </div>
              <Button variant="outline" size="sm" onClick={handleClearCustomer}>Change</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  placeholder="Search customer by mobile..."
                  value={customerSearchTerm}
                  onChange={(e) => {
                    setCustomerSearchTerm(e.target.value);
                    if (searchedMobileForNotFound) setSearchedMobileForNotFound(null);
                    if (foundCustomers.length > 0) setFoundCustomers([]);
                  }}
                  className="flex-grow text-sm sm:text-base"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()}
                  aria-label="Search customer mobile number"
                />
                <Button onClick={() => handleSearchCustomer()} disabled={isSearchingCustomer} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                  <UserSearch className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {isSearchingCustomer ? "Searching..." : "Search"}
                </Button>
              </div>
              {foundCustomers.length > 0 && (
                <ul className="border rounded-md max-h-32 sm:max-h-40 overflow-y-auto text-sm sm:text-base">
                  {foundCustomers.map(cust => (
                    <li key={cust.id} className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0" onClick={() => handleSelectCustomer(cust)}>
                      {cust.name} - {cust.mobileNumber}
                      {cust.address && <span className="text-xs block text-muted-foreground max-w-xs truncate" title={cust.address}>{cust.address}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {searchedMobileForNotFound && foundCustomers.length === 0 && !isSearchingCustomer && (
                <div className="mt-2 text-center p-2 border border-dashed rounded-md">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Customer with mobile <span className="font-semibold">{searchedMobileForNotFound}</span> not found.</p>
                  <Button variant="outline" size="sm" onClick={handleOpenCustomerDialog}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
                  </Button>
                </div>
              )}
               {!selectedCustomer && !customerSearchTerm && !searchedMobileForNotFound && (
                 <Alert variant="default" className="border-primary/50 text-primary bg-primary/5">
                    <Info className="h-5 w-5 !text-primary" />
                    <AlertTitle className="font-semibold">Tip</AlertTitle>
                    <AlertDescription>
                    Search for an existing customer by mobile number, or proceed to add a new customer if not found. For a quick walk-in sale, you can skip this step and finalize the bill directly.
                    </AlertDescription>
                </Alert>
               )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <BarcodeEntry onProductAdd={handleProductAdd} />
          {billItems.length === 0 ? (
            isLoadingProducts ? <Skeleton className="h-40 w-full" /> :
              <Alert className="border-accent text-accent">
                
                <AlertTitle>Empty Bill</AlertTitle>
                <AlertDescription>
                  Scan or enter a product barcode/SN to start building the bill.
                </AlertDescription>
              </Alert>
          ) : (
            <BillItemsList
              items={billItems}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
            />
          )}
        </div>
        <div className="lg:col-span-1 lg:sticky lg:top-20">
          {isLoadingProducts && billItems.length === 0 ? <Skeleton className="h-48 w-full" /> :
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
