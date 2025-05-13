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
    // onOpenChange(false); // Parent component handles dialog closing
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-primary">
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
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
