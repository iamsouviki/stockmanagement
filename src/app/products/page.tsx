// src/app/products/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import ProductTable from "@/components/products/ProductTable";
import ProductDialog from "@/components/products/ProductDialog";
import type { ProductFormData } from "@/components/products/ProductForm";
import type { Product, Category, UserRole } from "@/types";
import { PlusCircle, UploadCloud, Filter, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getProductsPaginated, // Use paginated fetch
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getCategories,
  // getProducts // Keep for initial data or scenarios without pagination if any
} from "@/services/firebaseService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import PaginationControls from "@/components/shared/PaginationControls";
import type { QueryDocumentSnapshot } from "firebase/firestore";

const pageAccessRoles: UserRole[] = ['owner', 'admin', 'employee'];
const bulkUploadRoles: UserRole[] = ['owner', 'admin', 'employee']; // All roles can bulk upload

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterCategory, setFilterCategory] = useState(""); 
  const [filterSerialNumber, setFilterSerialNumber] = useState("");
  const [filterBarcode, setFilterBarcode] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPageFirstDoc, setCurrentPageFirstDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [currentPageLastDoc, setCurrentPageLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [pageHistory, setPageHistory] = useState<(QueryDocumentSnapshot | null)[]>([null]); // Stack of first docs for prev page
  const [isFetchingPage, setIsFetchingPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchCategoriesData = useCallback(async () => {
    try {
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({ title: "Error", description: "Failed to fetch categories.", variant: "destructive" });
    }
  }, [toast]);

  const fetchProductsData = useCallback(async (
    direction: 'initial' | 'next' | 'prev' | 'reset' = 'initial'
  ) => {
    setIsFetchingPage(true);
    setIsLoading(direction === 'initial' || direction === 'reset'); // Full load only on initial/reset

    let startAfterDoc: QueryDocumentSnapshot | null = null;
    let endBeforeDoc: QueryDocumentSnapshot | null = null;
    
    if (direction === 'next') {
      startAfterDoc = currentPageLastDoc;
    } else if (direction === 'prev') {
      // For 'prev', we need the first doc of the *previous* page to use as `endBefore`
      // The `pageHistory` stores the first doc of the *current* page.
      // So `pageHistory[pageHistory.length - 2]` is the first doc of the page we want to go to.
      if (pageHistory.length > 1) { // Check if there's a previous page in history
          // To go to page N-1, we need to endBefore the first doc of current page N
          // And limitToLast
          endBeforeDoc = currentPageFirstDoc;
      }
    } else if (direction === 'reset') {
      setPageHistory([null]); // Reset history for new filter/itemsPerPage
      setCurrentPageFirstDoc(null);
      setCurrentPageLastDoc(null);
    }


    try {
      // Fetch one more item than itemsPerPage to check if there's a next page
      const { products: fetchedProducts, firstDoc, lastDoc } = await getProductsPaginated(
        itemsPerPage + (direction !== 'prev' ? 1 : 0), // Fetch +1 for next, exact for prev
        'name', 
        'asc', 
        startAfterDoc,
        endBeforeDoc // Pass endBeforeDoc for 'prev'
      );

      const productsWithCategoryNames = fetchedProducts.map(p => ({
        ...p,
        categoryName: categories.find(c => c.id === p.categoryId)?.name || 'Unknown'
      }));

      let displayProducts = productsWithCategoryNames;
      let newHasNextPage = false;

      if (direction !== 'prev' && productsWithCategoryNames.length > itemsPerPage) {
        displayProducts = productsWithCategoryNames.slice(0, itemsPerPage);
        newHasNextPage = true;
      } else {
        newHasNextPage = false;
      }
      
      setProducts(displayProducts);
      setCurrentPageFirstDoc(firstDoc); // This is the first doc of the *current* new page
      setCurrentPageLastDoc(lastDoc); // This is the last doc of the *current* new page
      setHasNextPage(newHasNextPage);

      if (direction === 'next' && firstDoc) {
         setPageHistory(prev => [...prev, firstDoc]);
      } else if (direction === 'prev') {
         setPageHistory(prev => prev.slice(0, -1));
      }
      // if direction is 'initial' or 'reset', pageHistory is already [null] or set by 'reset'
      
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({ title: "Error", description: "Failed to fetch products.", variant: "destructive" });
    }
    setIsLoading(false);
    setIsFetchingPage(false);
  }, [itemsPerPage, categories, toast, currentPageLastDoc, currentPageFirstDoc, pageHistory]);

  useEffect(() => {
    fetchCategoriesData();
  }, [fetchCategoriesData]);

  useEffect(() => {
    if (categories.length > 0) { // Fetch products only after categories are loaded
      fetchProductsData('initial');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, itemsPerPage]); // Rerun if itemsPerPage changes, or categories load initially

  // Debounced filter application or manual trigger? For now, manual re-fetch on filter change.
  // This simple filtering is client-side for now. Server-side filtering would be more complex with pagination.
  const filteredProducts = useMemo(() => {
    // If server-side filtering for pagination is implemented, this client-side filtering would be removed/changed.
    // For now, this filters the currently fetched page of products.
    return products.filter(product => {
      const nameMatch = filterName ? product.name.toLowerCase().includes(filterName.toLowerCase()) : true;
      const categoryMatch = filterCategory ? product.categoryId === filterCategory : true;
      const serialMatch = filterSerialNumber ? product.serialNumber?.toLowerCase().includes(filterSerialNumber.toLowerCase()) : true;
      const barcodeMatch = filterBarcode ? product.barcode?.toLowerCase().includes(filterBarcode.toLowerCase()) : true;
      return nameMatch && categoryMatch && serialMatch && barcodeMatch;
    }).sort((a, b) => a.name.localeCompare(b.name)); // Ensure client-side sort after filter
  }, [products, filterName, filterCategory, filterSerialNumber, filterBarcode]);


  const handleAddProduct = () => {
    if (categories.length === 0) {
      toast({
        title: "No Categories Found",
        description: (
          <div className="space-y-2">
            <p>Please add categories first before adding products.</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/categories">Go to Categories</Link>
            </Button>
          </div>
        ),
        variant: "destructive",
        duration: 7000,
      });
      return;
    }
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
     if (categories.length === 0 && !product.categoryId) {
       toast({
        title: "No Categories Available",
        description: (
          <div className="space-y-2">
            <p>Please add categories first. You cannot edit this product's category until some are available.</p>
             <Button variant="outline" size="sm" asChild>
              <Link href="/categories">Go to Categories</Link>
            </Button>
          </div>
        ),
        variant: "destructive",
        duration: 7000,
      });
    }
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      // Refetch current page to reflect deletion
      fetchProductsData(pageHistory.length > 1 ? 'reset' : 'initial'); // Reset if not on first page, else initial
      toast({
        title: "Product Deleted",
        description: "The product has been successfully removed.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    }
  };

  const handleSubmitProduct = async (data: ProductFormData) => {
    const categoryName = categories.find(c => c.id === data.categoryId)?.name || 'Unknown';
    const productData = { ...data, categoryName };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct({
          ...productData,
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.name.split(" ")[0])}/200/200`,
          imageHint: `${data.name.split(' ')[0].toLowerCase()} item`,
        });
      }
      // Refetch current page to reflect changes
      fetchProductsData(pageHistory.length > 1 ? 'reset' : 'initial'); // Smart refetch
      toast({
        title: editingProduct ? "Product Updated" : "Product Added",
        description: `"${data.name}" has been successfully ${editingProduct ? 'updated' : 'added'}.`,
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      toast({ title: "Error", description: "Failed to save product.", variant: "destructive" });
    }
  };
  
  const resetFilters = () => {
    setFilterName("");
    setFilterCategory("");
    setFilterSerialNumber("");
    setFilterBarcode("");
    setShowFilters(false);
    // TODO: Refetch products with reset filters if server-side filtering is added
  };

  const handleNextPage = () => {
    if (hasNextPage && !isFetchingPage) {
      fetchProductsData('next');
    }
  };

  const handlePrevPage = () => {
    if (pageHistory.length > 1 && !isFetchingPage) { // Can go prev if not on the first page representation
      fetchProductsData('prev');
    }
  };
  
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    fetchProductsData('reset'); // Reset pagination and fetch with new limit
  };


  return (
    <AuthGuard allowedRoles={pageAccessRoles}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Product Management</h1>
            <p className="text-muted-foreground">
              Manage your electronic store's inventory here.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full sm:w-auto">
              <Filter className="mr-2 h-5 w-5" /> {showFilters ? "Hide" : "Show"} Filters
            </Button>
            {userProfile && bulkUploadRoles.includes(userProfile.role) && (
              <Button asChild variant="outline" className="w-full sm:w-auto border-accent text-accent hover:bg-accent/10 hover:text-accent">
                <Link href="/settings/bulk-upload">
                  <UploadCloud className="mr-2 h-5 w-5" /> Bulk Upload
                </Link>
              </Button>
            )}
            <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                Filter Products (Client-Side)
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                  <XCircle className="mr-1 h-4 w-4" /> Reset Filters
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                placeholder="Filter by Name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="text-sm"
              />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Filter by Category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id} className="text-sm">
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Filter by Serial Number..."
                value={filterSerialNumber}
                onChange={(e) => setFilterSerialNumber(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Filter by Barcode..."
                value={filterBarcode}
                onChange={(e) => setFilterBarcode(e.target.value)}
                className="text-sm"
              />
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {categories.length === 0 && products.length === 0 && (
              <Alert variant="default" className="border-accent text-accent bg-accent/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 !text-accent"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <AlertTitle className="font-semibold">No Categories Available</AlertTitle>
                <AlertDescription>
                  You currently have no product categories defined. Please 
                  <Link href="/categories" className="underline font-medium hover:text-accent/80 mx-1">add categories</Link> 
                  before adding products to better organize your inventory.
                </AlertDescription>
              </Alert>
            )}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl text-primary">Product List</CardTitle>
                    <CardDescription className="text-sm sm:text-base">Overview of all products in your inventory.</CardDescription>
                </CardHeader>
                <CardContent className="p-0"> {/* Remove padding from CardContent if table has its own */}
                    <ProductTable
                    products={filteredProducts} // Use client-side filtered products for display
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    />
                </CardContent>
                 <PaginationControls
                    canGoPrev={pageHistory.length > 1 && !isFetchingPage}
                    canGoNext={hasNextPage && !isFetchingPage}
                    onPrevPage={handlePrevPage}
                    onNextPage={handleNextPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />
            </Card>
          </>
        )}

        <ProductDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          product={editingProduct}
          onSubmit={handleSubmitProduct}
          categories={categories}
        />
      </div>
    </AuthGuard>
  );
}

