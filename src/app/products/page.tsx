"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProductTable from "@/components/products/ProductTable";
import ProductDialog from "@/components/products/ProductDialog";
import type { ProductFormData } from "@/components/products/ProductForm";
import type { Product } from "@/types";
import { mockProducts as initialProducts } from "@/data/mockData";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  // Load initial products on mount
  useEffect(() => {
    setProducts(initialProducts);
  }, []);
  
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
    toast({
      title: "Product Deleted",
      description: "The product has been successfully removed from the inventory.",
      variant: "destructive",
    });
  };

  const handleSubmitProduct = (data: ProductFormData) => {
    if (editingProduct) {
      // Update existing product
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...editingProduct, ...data } : p
        )
      );
      toast({
        title: "Product Updated",
        description: `"${data.name}" has been successfully updated.`,
      });
    } else {
      // Add new product
      const newProduct: Product = {
        ...data,
        id: `prod${Date.now()}`, // Simple ID generation
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.name)}/200/200`, // Placeholder image
        imageHint: `${data.name.split(' ')[0].toLowerCase()} device`,
      };
      setProducts([newProduct, ...products]);
      toast({
        title: "Product Added",
        description: `"${data.name}" has been successfully added to your inventory.`,
      });
    }
    setIsDialogOpen(false);
    setEditingProduct(null);
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

      <ProductTable
        products={products}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />

      <ProductDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        onSubmit={handleSubmitProduct}
      />
    </div>
  );
}
