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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-6 shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-primary">
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription>
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
        {/* Footer can be part of CategoryForm or here, let's keep it in form for now */}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
