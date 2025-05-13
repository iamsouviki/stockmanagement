"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import CategoryTable from "@/components/categories/CategoryTable";
import CategoryDialog from "@/components/categories/CategoryDialog";
import type { CategoryFormData } from "@/components/categories/CategoryForm";
import type { Category, UserRole } from "@/types";
import { PlusCircle, Tags } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCategories, addCategory, updateCategory, deleteCategory } from "@/services/firebaseService";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";

const allowedRoles: UserRole[] = ['owner', 'employee'];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({ title: "Error", description: "Failed to fetch categories.", variant: "destructive" });
      }
      setIsLoading(false);
    };
    fetchCategories();
  }, [toast]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      setCategories(categories.filter((c) => c.id !== categoryId));
      toast({
        title: "Category Deleted",
        description: "The category has been successfully removed.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({ title: "Error", description: "Failed to delete category. It might be in use by products.", variant: "destructive" });
    }
  };

  const handleSubmitCategory = async (data: CategoryFormData) => {
    try {
      const isDuplicate = categories.some(
        cat => cat.name.toLowerCase() === data.name.toLowerCase() && (editingCategory ? cat.id !== editingCategory.id : true)
      );
      if (isDuplicate) {
        toast({
          title: "Duplicate Category",
          description: `A category named "${data.name}" already exists.`,
          variant: "destructive",
        });
        return;
      }

      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
        setCategories(
          categories.map((c) =>
            c.id === editingCategory.id ? { ...c, ...data } : c
          ).sort((a,b) => a.name.localeCompare(b.name))
        );
        toast({
          title: "Category Updated",
          description: `Category "${data.name}" has been successfully updated.`,
        });
      } else {
        const newCategoryId = await addCategory(data);
        const newCategory: Category = {
          id: newCategoryId,
          name: data.name,
        };
        setCategories([...categories, newCategory].sort((a,b) => a.name.localeCompare(b.name)));
        toast({
          title: "Category Added",
          description: `Category "${data.name}" has been successfully added.`,
        });
      }
      setIsDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error("Error saving category:", error);
      toast({ title: "Error", description: "Failed to save category.", variant: "destructive" });
    }
  };
  
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
              <Tags className="mr-3 h-8 w-8" /> Category Management
            </h1>
            <p className="text-muted-foreground">
              Organize your products by adding and managing categories.
            </p>
          </div>
          <Button onClick={handleAddCategory} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Category
          </Button>
        </div>

        <div className="relative mt-2 sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
            aria-label="Search categories by name"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <CategoryTable
            categories={filteredCategories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            searchTerm={searchTerm}
          />
        )}

        <CategoryDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          category={editingCategory}
          onSubmit={handleSubmitCategory}
        />
      </div>
    </AuthGuard>
  );
}
