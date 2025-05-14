"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore'; // Updated import for Timestamp
import type { Order, UserRole, OrderItemData, Product, BillItem } from '@/types';
import { getOrder, updateOrderAndAdjustStock, getProducts } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Printer, Package, Edit, Save, XCircle, Trash2, Loader2, PlusCircle, ScanLine } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { storeDetails } from '@/config/storeDetails';
import { generateInvoicePdf } from '@/lib/pdfGenerator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const allowedPageAccessRoles: UserRole[] = ['owner', 'admin', 'employee'];
const allowedRecreateRoles: UserRole[] = ['owner', 'admin'];
const allowedEditOrderRoles: UserRole[] = ['owner'];

interface OrderDetailPageClientProps {
  orderId: string;
}

export default function OrderDetailPageClient({ orderId }: OrderDetailPageClientProps) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableItems, setEditableItems] = useState<BillItem[]>([]);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [newProductInput, setNewProductInput] = useState('');

  const fetchOrderData = useCallback(async () => {
    if (orderId) {
      setIsLoading(true);
      try {
        const fetchedOrder = await getOrder(orderId);
        if (fetchedOrder) {
          setOrder(fetchedOrder);
          // Ensure editableItems are structured as BillItem[]
          const billItemsFromOrder: BillItem[] = fetchedOrder.items.map(item => {
            const productDetails = availableProducts.find(p => p.id === item.productId);
            return {
              id: item.productId,
              name: productDetails?.name || item.name,
              serialNumber: item.serialNumber || productDetails?.serialNumber || '',
              barcode: item.barcode || productDetails?.barcode || '',
              price: productDetails?.price || item.price,
              quantity: productDetails?.quantity || 0, // DB stock
              categoryId: productDetails?.categoryId || '',
              categoryName: productDetails?.categoryName,
              imageUrl: productDetails?.imageUrl || item.imageUrl || undefined,
              imageHint: productDetails?.imageHint || item.imageHint || undefined,
              createdAt: productDetails?.createdAt,
              updatedAt: productDetails?.updatedAt,
              billQuantity: item.billQuantity, // Quantity in this bill
            };
          });
          setEditableItems(billItemsFromOrder);
        } else {
          toast({ title: "Error", description: "Order not found.", variant: "destructive" });
          router.push('/orders');
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast({ title: "Error", description: "Failed to fetch order details.", variant: "destructive" });
      }
      setIsLoading(false);
    }
  }, [orderId, toast, router, availableProducts]);

  const fetchProductsData = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const products = await getProducts();
      setAvailableProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({ title: "Product Load Error", description: "Failed to load product details for editing.", variant: "destructive" });
    }
    setIsLoadingProducts(false);
  }, [toast]);

  useEffect(() => {
    fetchProductsData();
  }, [fetchProductsData]);

  useEffect(() => {
    // Fetch order data only after products are loaded if we need product details for mapping
    if (availableProducts.length > 0) {
      fetchOrderData();
    } else if (!isLoadingProducts) { // If products finished loading and there are none (edge case)
      fetchOrderData(); // Still try to fetch order, might display basic item info
    }
  }, [fetchOrderData, availableProducts, isLoadingProducts]);

  const formatDate = (dateValue: Timestamp | string | Date | undefined | null) => {
    if (!dateValue) return 'N/A';
    let dateToFormat: Date;

    if (dateValue instanceof Timestamp) {
      dateToFormat = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      dateToFormat = dateValue;
    } else if (typeof dateValue === 'string') {
      dateToFormat = new Date(dateValue);
    } else {
      return 'N/A';
    }

    return isNaN(dateToFormat.getTime()) ? 'Invalid Date' : format(dateToFormat, 'PPpp');
  };

  const handlePrintOrderPDF = (currentOrder: Order) => {
    generateInvoicePdf(currentOrder, storeDetails);
    toast({ title: "PDF Ready", description: "Bill opening for printing." });
  };

  const handleRecreateBillFromOrder = () => {
    if (order) router.push(`/billing?fromOrder=${order.id}`);
  };

  const handleToggleEdit = () => {
    if (isEditing && order) { // Cancel edit
      const billItemsFromOrder: BillItem[] = order.items.map(item => {
        const productDetails = availableProducts.find(p => p.id === item.productId);
        return {
          id: item.productId,
          name: productDetails?.name || item.name,
          serialNumber: item.serialNumber || productDetails?.serialNumber || '',
          barcode: item.barcode || productDetails?.barcode || '',
          price: productDetails?.price || item.price,
          quantity: productDetails?.quantity || 0,
          categoryId: productDetails?.categoryId || '',
          categoryName: productDetails?.categoryName,
          imageUrl: productDetails?.imageUrl || item.imageUrl || undefined,
          imageHint: productDetails?.imageHint || item.imageHint || undefined,
          createdAt: productDetails?.createdAt,
          updatedAt: productDetails?.updatedAt,
          billQuantity: item.billQuantity,
        };
      });
      setEditableItems(billItemsFromOrder);
    }
    setIsEditing(!isEditing);
    setNewProductInput(''); // Clear new product input when toggling edit mode
  };

  const handleItemQuantityChange = (productId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr, 10);
    if (isNaN(newQuantity) || newQuantity < 0) return;

    const itemToUpdate = editableItems.find(item => item.id === productId);
    const originalItemInOrder = order?.items.find(item => item.productId === productId);
    const productInDb = availableProducts.find(p => p.id === productId);

    if (!productInDb || !itemToUpdate) {
      toast({ title: "Error", description: "Product details not found.", variant: "destructive" });
      return;
    }

    const currentDbStock = productInDb.quantity;
    // If item was in original order, its original quantity is "available" from the order itself for this edit.
    const originalBilledQuantity = originalItemInOrder ? originalItemInOrder.billQuantity : 0;
    // Max quantity for an item that *was* in the original order
    const maxAllowedForExistingItem = currentDbStock + originalBilledQuantity;

    if (newQuantity === 0) { 
      setEditableItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, billQuantity: 0 } : item
        )
      ); // Will be filtered on save
      return;
    }

    if (newQuantity > maxAllowedForExistingItem) {
      toast({
        title: "Stock Limit Exceeded",
        description: `Cannot set quantity for "${productInDb.name}" to ${newQuantity}. Max available (DB stock + original order qty): ${maxAllowedForExistingItem}.`,
        variant: "destructive",
      });
      setEditableItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, billQuantity: maxAllowedForExistingItem } : item
        )
      );
      return;
    }

    setEditableItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, billQuantity: newQuantity } : item
      )
    );
  };

  const handleRemoveEditableItem = (productId: string) => {
    // Instead of filtering, set billQuantity to 0 to indicate removal.
    // This helps in correctly calculating stock adjustments later.
    setEditableItems(prevItems =>
      prevItems.map(item => item.id === productId ? { ...item, billQuantity: 0 } : item)
    );
    toast({title: "Item Marked for Removal", description: "Item will be removed when changes are saved."});
  };

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProductInput.trim()) {
      handleAddNewProductToOrder(newProductInput.trim());
    }
  };

  const handleAddNewProductToOrder = (barcodeOrSn: string) => {
    if (!isEditing) return;

    const productToAdd = availableProducts.find(
      (p) => p.barcode === barcodeOrSn || p.serialNumber === barcodeOrSn
    );

    if (!productToAdd) {
      toast({ title: "Product Not Found", description: `No product with barcode/SN: ${barcodeOrSn}`, variant: "destructive" });
      return;
    }

    if (productToAdd.quantity <= 0) {
      toast({ title: "Out of Stock", description: `Product "${productToAdd.name}" is out of stock.`, variant: "destructive" });
      return;
    }

    setEditableItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === productToAdd.id);
      if (existingItem) {
        // If item already in list (e.g. was part of original order, or added in this edit session)
        let stockAvailableForThisItem = productToAdd.quantity; // Base DB stock
        const originalItem = order?.items.find(oi => oi.productId === productToAdd.id);
        if (originalItem) {
          stockAvailableForThisItem += originalItem.billQuantity; // Add stock "reserved" by original order
        }

        if (existingItem.billQuantity < stockAvailableForThisItem) {
          toast({ title: "Product Quantity Increased", description: `Quantity for "${productToAdd.name}" increased.` });
          return prevItems.map(item =>
            item.id === productToAdd.id ? { ...item, billQuantity: item.billQuantity + 1 } : item
          );
        } else {
          toast({ title: "Max Stock Reached", description: `Cannot add more of "${productToAdd.name}". Available (DB + original order): ${stockAvailableForThisItem}.`, variant: "destructive" });
          return prevItems;
        }
      } else {
        // Adding a completely new product to this order
        if (productToAdd.quantity > 0) { // Check current DB stock
          toast({ title: "Product Added", description: `"${productToAdd.name}" added to order.` });
          const newItem: BillItem = {
            ...productToAdd, // Spreads all Product fields
            billQuantity: 1,
          };
          return [...prevItems, newItem];
        } else { // Should have been caught above, but as a safeguard
          toast({ title: "Out of Stock", description: `Product "${productToAdd.name}" is out of stock.`, variant: "destructive" });
          return prevItems;
        }
      }
    });
    setNewProductInput(''); // Clear input after adding
  };

  const { subtotal, taxAmount, totalAmount } = useMemo(() => {
    // Calculate totals based on items that will remain (billQuantity > 0)
    const itemsToCalculate = editableItems.filter(item => item.billQuantity > 0);
    const currentSubtotal = itemsToCalculate.reduce((sum, item) => sum + item.price * item.billQuantity, 0);
    const currentTaxAmount = currentSubtotal * 0.18;
    const currentTotalAmount = currentSubtotal + currentTaxAmount;
    return { subtotal: currentSubtotal, taxAmount: currentTaxAmount, totalAmount: currentTotalAmount };
  }, [editableItems]);

  const handleSaveChanges = async () => {
    if (!order) return;
    setIsUpdatingOrder(true);

    // Filter out items marked for removal (billQuantity set to 0)
    const finalEditableItemsData: OrderItemData[] = editableItems
      .filter(item => item.billQuantity > 0)
      .map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        billQuantity: item.billQuantity,
        imageUrl: item.imageUrl === undefined ? null : item.imageUrl,
        imageHint: item.imageHint === undefined ? null : item.imageHint,
        serialNumber: item.serialNumber || null,
        barcode: item.barcode || null,
      }));

    if (finalEditableItemsData.length === 0 && order.items.length > 0) {
      toast({ title: "Empty Order", description: "Cannot save an order with no items. If you wish to cancel, please use a dedicated cancellation feature (not yet implemented).", variant: "destructive", duration: 7000 });
      setIsUpdatingOrder(false);
      return;
    }
    if (finalEditableItemsData.length === 0 && order.items.length === 0) { 
      toast({ title: "No Changes", description: "Order is already empty.", variant: "default"});
      setIsEditing(false);
      setIsUpdatingOrder(false);
      return;
    }

    const updatedOrderPayload: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt' | 'updatedAt'> = {
      customerId: order.customerId, // Customer details are not editable in this flow
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      customerAddress: order.customerAddress,
      items: finalEditableItemsData,
      subtotal: subtotal,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
    };

    try {
      await updateOrderAndAdjustStock(order.id, updatedOrderPayload, order);
      toast({ title: "Order Updated", description: "Order details saved successfully.", className: "bg-green-500 text-white" });
      setIsEditing(false);
      fetchOrderData(); 
      fetchProductsData(); // Re-fetch products as stock might have changed
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast({ title: "Update Failed", description: error.message || "Could not update order.", variant: "destructive" });
    }
    setIsUpdatingOrder(false);
  };

  if (isLoading || isLoadingProducts) {
    return ( 
      <div className="space-y-4"> 
        <Skeleton className="h-8 w-1/4" /> 
        <Skeleton className="h-10 w-1/2" /> 
        <Card> 
          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader> 
          <CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /></CardContent> 
        </Card> 
        <Card> 
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader> 
          <CardContent><Skeleton className="h-24 w-full" /></CardContent> 
        </Card> 
        <CardFooter><Skeleton className="h-10 w-1/4" /></CardFooter> 
      </div>
    );
  }

  if (!order) return <p className="text-center text-lg">Order not found.</p>;

  const canModifyThisOrder = userProfile && allowedEditOrderRoles.includes(userProfile.role);

  return ( 
    <AuthGuard allowedRoles={allowedPageAccessRoles}> 
      <div className="space-y-6"> 
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <Button variant="outline" onClick={() => router.back()} size="sm"> 
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders 
          </Button>
          {canModifyThisOrder && !isEditing && ( 
            <Button variant="default" onClick={handleToggleEdit} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground"> 
              <Edit className="mr-2 h-4 w-4" /> Edit Order 
            </Button>
          )} 
        </div>

        {isEditing && (
          <Alert variant="default" className="border-accent text-accent bg-accent/10">
            <Edit className="h-5 w-5 !text-accent" />
            <AlertTitle className="font-semibold">Order Edit Mode</AlertTitle>
            <AlertDescription>
              You are currently editing order {order.orderNumber}. Modify item quantities, remove items, or add new products. Click "Save Changes" to update or "Cancel" to discard.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl text-primary">Order Details: {order.orderNumber}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Date: {formatDate(order.orderDate)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 text-sm sm:text-base">
            <div>
              <h3 className="font-semibold text-md sm:text-lg mb-1">Customer Information</h3>
              <p>Name: {order.customerName}</p>
              <p>Mobile: {order.customerMobile}</p>
              <p className="whitespace-normal break-words">Address: {order.customerAddress || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-md sm:text-lg mb-2">Items Ordered</h3>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <Table className="min-w-[600px] sm:min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] sm:w-[60px] px-2 sm:px-4">Image</TableHead>
                      <TableHead className="px-2 sm:px-4">Product</TableHead>
                      <TableHead className="px-2 sm:px-4">SN/Barcode</TableHead>
                      <TableHead className="text-right px-2 sm:px-4">Price</TableHead>
                      <TableHead className="text-center px-2 sm:px-4 w-[130px] sm:w-[150px]">Quantity</TableHead>
                      <TableHead className="text-right px-2 sm:px-4">Subtotal</TableHead>
                      {isEditing && <TableHead className="text-center px-2 sm:px-4 w-[60px]">Remove</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isEditing ? editableItems : order.items.map(item => { // Map original order items to BillItem for display if not editing
                      const productDetails = availableProducts.find(p => p.id === item.productId);
                      return {
                        id: item.productId,
                        name: productDetails?.name || item.name,
                        serialNumber: item.serialNumber || productDetails?.serialNumber || '',
                        barcode: item.barcode || productDetails?.barcode || '',
                        price: productDetails?.price || item.price,
                        quantity: productDetails?.quantity || 0,
                        categoryId: productDetails?.categoryId || '',
                        categoryName: productDetails?.categoryName,
                        imageUrl: productDetails?.imageUrl || item.imageUrl || undefined,
                        imageHint: productDetails?.imageHint || item.imageHint || undefined,
                        createdAt: productDetails?.createdAt,
                        updatedAt: productDetails?.updatedAt,
                        billQuantity: item.billQuantity,
                      };
                    })).filter(item => !isEditing || item.billQuantity > 0).map((item, index) => ( // Filter out "removed" items only in edit mode display before mapping
                      <TableRow key={item.id + '-' + index} className={isEditing && item.billQuantity === 0 ? 'opacity-50' : ''}>
                        <TableCell className="px-2 sm:px-4">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} width={32} height={32} className="rounded-md object-cover sm:w-10 sm:h-10" data-ai-hint={item.imageHint || "product item"}/>
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
                              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words max-w-[120px] sm:max-w-xs">{item.name}</TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{item.serialNumber || item.barcode || 'N/A'}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center text-xs sm:text-sm px-2 sm:px-4">
                          {isEditing ? (
                            <div className="flex items-center justify-center">
                              <Input
                                type="number"
                                value={item.billQuantity}
                                onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                                className="w-16 h-8 text-center text-xs"
                                min="0"
                              />
                            </div>
                          ) : (
                            item.billQuantity
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4">₹{(item.price * item.billQuantity).toFixed(2)}</TableCell>
                        {isEditing && (
                          <TableCell className="text-center px-2 sm:px-4">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveEditableItem(item.id)} title="Mark for Removal" disabled={item.billQuantity === 0}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {(isEditing && editableItems.filter(item => item.billQuantity > 0).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={isEditing ? 7 : 6} className="text-center h-24 text-muted-foreground">
                          No items in the order. Add new products or cancel editing.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {isEditing && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-md mb-2">Add New Product</h4>
                  <form onSubmit={handleAddNewProductSubmit} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      value={newProductInput}
                      onChange={(e) => setNewProductInput(e.target.value)}
                      placeholder="Enter Barcode or Serial Number"
                      className="flex-grow text-sm"
                      aria-label="Add new product by barcode or serial number"
                    />
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                  </form>
                </div>
              )}
            </div>
            <div className="text-right space-y-1 pr-2 sm:pr-4">
              <p>Subtotal: <span className="font-semibold">₹{subtotal.toFixed(2)}</span></p>
              <p>GST (18%): <span className="font-semibold">₹{taxAmount.toFixed(2)}</span></p>
              <p className="text-lg sm:text-xl font-bold">Total: <span className="text-primary">₹{totalAmount.toFixed(2)}</span></p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleToggleEdit} disabled={isUpdatingOrder} className="w-full sm:w-auto">
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={isUpdatingOrder || isLoadingProducts || editableItems.filter(it => it.billQuantity > 0).length === 0} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                  {isUpdatingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => handlePrintOrderPDF(order)} className="w-full sm:w-auto">
                  <Printer className="mr-2 h-4 w-4" /> Print Bill
                </Button>
                {userProfile && allowedRecreateRoles.includes(userProfile.role) && (
                  <Button onClick={handleRecreateBillFromOrder} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Copy className="mr-2 h-4 w-4" /> Re-create Bill
                  </Button>
                )}
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  );
}