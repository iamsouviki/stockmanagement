"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // Added for consistency if form has separate buttons
} from "@/components/ui/dialog";
import CategoryForm, { type CategoryFormData } from "./CategoryForm";
import type { Category } from "@/types";

interface CategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  category?: Category | null; 
  onSubmit: (data: CategoryFormData) => void;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  isOpen,
  onOpenChange,
  category,
  onSubmit,
}) => {
  const handleSubmit = (data: CategoryFormData) => {
    onSubmit(data);
    // onOpenChange(false); // Form submission handler in parent page will close it
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-primary">
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {category
              ? "Update the name for this category."
              : "Enter the name for the new category."}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          category={category}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
