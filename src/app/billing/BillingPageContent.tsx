// src/app/billing/BillingPageContent.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BarcodeEntry from '@/components/billing/BarcodeEntry';
import BillItemsList from '@/components/billing/BillItemsList';
import BillSummaryCard from '@/components/billing/BillSummaryCard';
import type { Product, BillItem, OrderItemData, Order, Customer } from '@/types';
import { WALK_IN_CUSTOMER_ID } from '@/types'; 
import type { CustomerFormData } from '@/components/customers/CustomerForm';
import CustomerDialog from '@/components/customers/CustomerDialog';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserSearch, PlusCircle, Info } from "lucide-react";
import { getProducts, addOrderAndDecrementStock, getOrder as getOrderById, findCustomerByMobile, getCustomer as getCustomerById, addCustomer, updateOrderAndAdjustStock } from '@/services/firebaseService';
import { storeDetails } from '@/config/storeDetails';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BillingPageLoadingSkeleton from './BillingPageLoadingSkeleton';
import { generateInvoicePdf } from '@/lib/pdfGenerator'; 

export default function BillingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromOrderId = searchParams.get('fromOrder');
  const intent = searchParams.get('intent'); 

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrderData, setIsLoadingOrderData] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [searchedMobileForNotFound, setSearchedMobileForNotFound] = useState<string | null>(null);
  const [foundCustomers, setFoundCustomers] = useState<Customer[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [originalOrderForEdit, setOriginalOrderForEdit] = useState<Order | null>(null);


  const { toast } = useToast();

  const pageTitle = intent === 'edit' ? "Edit Order" : fromOrderId ? "Re-create Bill" : "Create New Bill";
  const pageDescription = intent === 'edit'
    ? "Modify the items and customer details for this order and generate an updated bill."
    : "Add products by barcode/SN and generate a bill for your customer.";
  const finalizeButtonText = intent === 'edit' ? "Update Order & Print" : "Finalize & Generate Bill";


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
      const loadOrderData = async () => {
        setIsLoadingOrderData(true);
        try {
          const order = await getOrderById(fromOrderId);
          if (order) {
            // Only set originalOrderForEdit if the intent is 'edit'
            if (intent === 'edit') {
              setOriginalOrderForEdit(order);
            }
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
              setCustomerSearchTerm(order.customerMobile);
            }
            const toastMessage = intent === 'edit' ? `Order ${order.orderNumber} loaded for editing.` : `Items from order ${order.orderNumber} loaded for re-billing.`;
            toast({ title: "Order Loaded", description: toastMessage });
          } else {
            toast({ title: "Error", description: "Order not found for re-billing/editing.", variant: "destructive" });
            router.replace('/billing');
          }
        } catch (error) {
          console.error("Error loading order for re-bill/edit:", error);
          toast({ title: "Error", description: "Failed to load order for re-billing/editing.", variant: "destructive" });
          router.replace('/billing');
        }
        setIsLoadingOrderData(false);
      };
      loadOrderData();
    } else if (!fromOrderId) {
      // Clear originalOrderForEdit if navigating to /billing without fromOrder (i.e., for a new bill)
      setOriginalOrderForEdit(null); 
    }
  // Ensure intent is part of dependency array to correctly manage originalOrderForEdit
  }, [fromOrderId, availableProducts, router, intent, toast]); 


  const handleProductAdd = (barcodeOrSn: string) => {
    const productToAdd = availableProducts.find(
      (p) => p.barcode === barcodeOrSn || p.serialNumber === barcodeOrSn
    );

    if (!productToAdd) {
      toast({
        title: "Product Not Found",
        description: `No product with barcode/SN: ${barcodeOrSn}`,
        variant: "destructive",
      });
      return;
    }
    
    const existingItem = billItems.find((item) => item.id === productToAdd.id);
    const currentBillQuantity = existingItem ? existingItem.billQuantity : 0;
    
    let stockAvailableForThisItem = productToAdd.quantity;

    // If editing, the "available stock" includes what was originally in the order being edited
    if (intent === 'edit' && originalOrderForEdit) {
      const originalItemInOrder = originalOrderForEdit.items.find(item => item.productId === productToAdd.id);
      if (originalItemInOrder) {
        stockAvailableForThisItem += originalItemInOrder.billQuantity; 
      }
    }


    if (productToAdd.quantity <= 0 && !existingItem && !(intent === 'edit' && stockAvailableForThisItem > 0)) { 
         toast({
           title: "Out of Stock",
           description: `Product "${productToAdd.name}" is out of stock.`,
           variant: "destructive",
         });
         return;
    }
    if (existingItem) {
      if (currentBillQuantity < stockAvailableForThisItem) { 
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
          description: `Cannot add more of "${productToAdd.name}". Available (including original order if editing): ${stockAvailableForThisItem}. Current DB stock: ${productToAdd.quantity}.`,
          variant: "destructive",
        });
      }
    } else { 
      // Add new if stock is available (either from DB or from original order items if editing)
      if (stockAvailableForThisItem > 0) {
        setBillItems([...billItems, { ...productToAdd, billQuantity: 1 }]);
      } else { 
         toast({ 
           title: "Out of Stock",
           description: `Product "${productToAdd.name}" is out of stock.`,
           variant: "destructive",
         });
      }
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
    
    let stockAvailableForThisItem = productInStock.quantity;

    if (intent === 'edit' && originalOrderForEdit) {
      const originalItemInOrder = originalOrderForEdit.items.find(item => item.productId === itemId);
      if (originalItemInOrder) {
        stockAvailableForThisItem += originalItemInOrder.billQuantity;
      }
    }


    if (newQuantity > stockAvailableForThisItem) {
      toast({
        title: "Stock Limit Exceeded",
        description: `Cannot set quantity for "${productInStock.name}" to ${newQuantity}. Max stock available (incl. original order if editing): ${stockAvailableForThisItem}. Current DB stock: ${productInStock.quantity}.`,
        variant: "destructive",
      });
      setBillItems(
        billItems.map((item) =>
          item.id === itemId ? { ...item, billQuantity: stockAvailableForThisItem } : item
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
      setSelectedCustomer(null); 
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
        setSelectedCustomer(null); 
      } else if (customers.length === 1) {
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
          description: "This mobile number is already associated with another customer customer.",
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

    let customerForOrder: Customer | null = selectedCustomer;

    // For new bills (not edit) or re-bills (intent != edit), if no customer selected, prompt.
    // For edit intent, customer can be optional if it was walk-in or if user cleared it.
    if (intent !== 'edit' && !customerForOrder && !searchedMobileForNotFound) { 
        toast({
            title: "Customer Not Selected",
            description: "Please search for a customer, add a new one, or finalize as walk-in if no mobile is entered.",
            variant: "destructive",
        });
        return; 
    } else if (intent === 'edit' && !customerForOrder && originalOrderForEdit) {
        // If editing, and the currently selected customer is null (e.g., was cleared),
        // use the customer details from the original order being edited.
        customerForOrder = {
            id: originalOrderForEdit.customerId,
            name: originalOrderForEdit.customerName,
            mobileNumber: originalOrderForEdit.customerMobile,
            address: originalOrderForEdit.customerAddress || undefined,
        };
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


    const orderPayload: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt' | 'updatedAt'> = {
      customerId: customerId,
      customerName: customerName,
      customerMobile: customerMobile,
      customerAddress: customerAddress,
      items: orderItems,
      subtotal,
      taxAmount,
      totalAmount,
    };

    try {
      let orderIdForResult: string;
      let orderNumberForResult: string | undefined = originalOrderForEdit?.orderNumber;


      if (intent === 'edit' && fromOrderId && originalOrderForEdit) {
        orderIdForResult = await updateOrderAndAdjustStock(fromOrderId, orderPayload, originalOrderForEdit);
         toast({
          title: "Order Updated!",
          description: `Order ${orderNumberForResult || orderIdForResult} has been successfully updated. PDF is opening for print.`,
          className: "bg-green-500 text-white",
          duration: 7000,
        });
      } else { // Handles both new bills and re-bills (which are treated as new orders with pre-filled items)
        const itemsToDecrementStock = billItems.map(item => ({
          productId: item.id,
          quantity: item.billQuantity,
        }));
        orderIdForResult = await addOrderAndDecrementStock(orderPayload, itemsToDecrementStock);
        const tempNewOrder = await getOrderById(orderIdForResult); 
        orderNumberForResult = tempNewOrder?.orderNumber;
        toast({
          title: "Bill Finalized!",
          description: `Order ${orderNumberForResult || orderIdForResult} saved. PDF is opening for print.`,
          className: "bg-green-500 text-white",
          duration: 7000,
        });
      }
      
      const finalOrderForPdf = await getOrderById(orderIdForResult);
      if (!finalOrderForPdf) {
        throw new Error("Failed to retrieve the order details for PDF generation.");
      }

      generateInvoicePdf(finalOrderForPdf, storeDetails);
      
      setBillItems([]);
      handleClearCustomer();
      setOriginalOrderForEdit(null); 
      fetchProductData(); 

      router.push(`/orders/${orderIdForResult}`);

    } catch (error: any) {
      console.error("Error finalizing bill:", error);
      toast({
        title: "Bill Finalization Failed",
        description: error.message || "Could not save order or generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if ((isLoadingProducts && !fromOrderId) || (fromOrderId && isLoadingOrderData)) {
    return <BillingPageLoadingSkeleton />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          {pageTitle}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
         {pageDescription}
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
              <Alert className="border-accent text-accent bg-accent/10">
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
            <BillSummaryCard items={billItems} onFinalizeBill={handleFinalizeBill} finalizeButtonText={finalizeButtonText}/>
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

