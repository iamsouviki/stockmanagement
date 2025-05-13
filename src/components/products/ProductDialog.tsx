"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ProductForm, { type ProductFormData } from "./ProductForm";
import type { Product, Category } from "@/types"; // Import Category

interface ProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product?: Product | null;
  onSubmit: (data: ProductFormData) => void;
  categories: Category[]; // Add categories prop
}

const ProductDialog: React.FC<ProductDialogProps> = ({
  isOpen,
  onOpenChange,
  product,
  onSubmit,
  categories, // Destructure categories
}) => {
  const handleSubmit = (data: ProductFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-6 shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-primary">
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Update the details of this product."
              : "Fill in the details to add a new product to your inventory."}
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          categories={categories} // Pass categories to ProductForm
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
