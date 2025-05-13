// src/app/products/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProductTable from "@/components/products/ProductTable";
import ProductDialog from "@/components/products/ProductDialog";
import type { ProductFormData } from "@/components/products/ProductForm";
import type { Product, Category, UserRole } from "@/types";
import { PlusCircle, UploadCloud } from "lucide-react"; // Added UploadCloud
import { useToast } from "@/hooks/use-toast";
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories } from "@/services/firebaseService";
import { Skeleton } from "@/components/ui/skeleton"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

const pageAccessRoles: UserRole[] = ['owner', 'admin', 'employee'];
const bulkUploadRoles: UserRole[] = ['owner'];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userProfile } = useAuth(); // Get userProfile for role check

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
        setCategories(fetchedCategories);
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
        setProducts(
          products.map((p) =>
            p.id === editingProduct.id ? { ...editingProduct, ...productData, categoryName: categoryName } : p
          )
        );
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
                {/* Using a generic icon or removing Info if not critical */}
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
              products={products}
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
