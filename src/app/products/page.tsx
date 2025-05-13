"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProductTable from "@/components/products/ProductTable";
import ProductDialog from "@/components/products/ProductDialog";
import type { ProductFormData } from "@/components/products/ProductForm";
import type { Product, Category } from "@/types";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories } from "@/services/firebaseService";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
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
            p.id === editingProduct.id ? { ...editingProduct, ...productData } : p
          )
        );
        toast({
          title: "Product Updated",
          description: `"${data.name}" has been successfully updated.`,
        });
      } else {
        const newProductId = await addProduct(productData);
        // Fetch the newly added product to get its server-generated fields (like createdAt)
        // For simplicity, we'll just add it with client data + ID
        const newProductEntry: Product = {
          ...productData,
          id: newProductId,
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.name)}/200/200`,
          imageHint: `${data.name.split(' ')[0].toLowerCase()} device`,
        };
        setProducts([newProductEntry, ...products]);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your electronic store's inventory here.
          </p>
        </div>
        <Button onClick={handleAddProduct} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Product
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <ProductTable
          products={products}
          categories={categories}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      <ProductDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        onSubmit={handleSubmitProduct}
        categories={categories}
      />
    </div>
  );
}
