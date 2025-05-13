// src/app/products/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import ProductTable from "@/components/products/ProductTable";
import ProductDialog from "@/components/products/ProductDialog";
import type { ProductFormData } from "@/components/products/ProductForm";
import type { Product, Category, UserRole } from "@/types";
import { PlusCircle, UploadCloud, Filter, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories } from "@/services/firebaseService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pageAccessRoles: UserRole[] = ['owner', 'admin', 'employee'];
const bulkUploadRoles: UserRole[] = ['owner', 'admin', 'employee'];

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
  const [filterCategory, setFilterCategory] = useState(""); // Stores category ID
  const [filterSerialNumber, setFilterSerialNumber] = useState("");
  const [filterBarcode, setFilterBarcode] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        
        const productsWithCategoryNames = fetchedProducts.map(p => ({
          ...p,
          categoryName: fetchedCategories.find(c => c.id === p.categoryId)?.name || 'Unknown'
        }));
        setProducts(productsWithCategoryNames);
        setCategories(fetchedCategories.sort((a,b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: "Error", description: "Failed to fetch products or categories.", variant: "destructive" });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [toast]);
  
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
      setProducts(products.filter((p) => p.id !== productId));
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
        // Refetch all products to ensure data consistency and sorting after update
        const fetchedProducts = await getProducts();
        const productsWithCategoryNames = fetchedProducts.map(p => ({
          ...p,
          categoryName: categories.find(c => c.id === p.categoryId)?.name || 'Unknown'
        }));
        setProducts(productsWithCategoryNames);
        toast({
          title: "Product Updated",
          description: `"${data.name}" has been successfully updated.`,
        });
      } else {
        const newProductId = await addProduct(productData);
        const newProductEntry: Product = {
          ...productData,
          id: newProductId,
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.name)}/200/200`,
          imageHint: `${data.name.split(' ')[0].toLowerCase()} device`,
        };
        setProducts([newProductEntry, ...products].sort((a, b) => a.name.localeCompare(b.name)));
        toast({
          title: "Product Added",
          description: `"${data.name}" has been successfully added.`,
        });
      }
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      toast({ title: "Error", description: "Failed to save product.", variant: "destructive" });
    }
  };
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const nameMatch = filterName ? product.name.toLowerCase().includes(filterName.toLowerCase()) : true;
      const categoryMatch = filterCategory ? product.categoryId === filterCategory : true;
      const serialMatch = filterSerialNumber ? product.serialNumber?.toLowerCase().includes(filterSerialNumber.toLowerCase()) : true;
      const barcodeMatch = filterBarcode ? product.barcode?.toLowerCase().includes(filterBarcode.toLowerCase()) : true;
      return nameMatch && categoryMatch && serialMatch && barcodeMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, filterName, filterCategory, filterSerialNumber, filterBarcode]);

  const resetFilters = () => {
    setFilterName("");
    setFilterCategory("");
    setFilterSerialNumber("");
    setFilterBarcode("");
    setShowFilters(false);
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
                Filter Products
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
            {categories.length === 0 && (
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
            <ProductTable
              products={filteredProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
            />
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