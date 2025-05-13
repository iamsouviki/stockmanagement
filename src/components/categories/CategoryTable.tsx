"use client";

import type { Category } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Tags } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore'; 
import { Timestamp as FirebaseTimestamp } from 'firebase/firestore'; 

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  searchTerm: string;
}

const CategoryTable: React.FC<CategoryTableProps> = ({ categories, onEdit, onDelete, searchTerm }) => {
  
  const formatDate = (dateValue: Timestamp | undefined) => {
    if (!dateValue) return 'N/A';

    if (dateValue instanceof FirebaseTimestamp) {
      try {
        return format(dateValue.toDate(), 'PPp');
      } catch (e) {
        console.error("Error formatting Firestore Timestamp in CategoryTable:", e, dateValue);
        return 'Invalid Date';
      }
    }
    
    // This part is defensive; typically Firestore Timestamps should be instances of FirebaseTimestamp.
    // It handles cases where dateValue might be a JS Date or a string if the type contracts are loose.
    if (dateValue instanceof Date) { 
      try {
        if (isNaN(dateValue.getTime())) {
             console.warn("Invalid Date object in CategoryTable:", dateValue);
             return 'Invalid Date';
        }
        return format(dateValue, 'PPp');
      } catch (e) {
        console.error("Error formatting Date object in CategoryTable:", e, dateValue);
        return 'Invalid Date';
      }
    }
    if (typeof dateValue === 'string') { 
      try {
        const parsedDate = new Date(dateValue);
        if (isNaN(parsedDate.getTime())) {
          console.warn("Invalid date string in CategoryTable:", dateValue);
          return 'Invalid Date';
        }
        return format(parsedDate, 'PPp');
      } catch (e) {
        console.error("Error formatting date string in CategoryTable:", e, dateValue);
        return 'Invalid Date';
      }
    }

    // Fallback for plain objects that might have a toDate method
    if (typeof (dateValue as any)?.toDate === 'function') {
      try {
        return format((dateValue as any).toDate(), 'PPp');
      } catch (e) {
         console.error("Error formatting object with toDate() in CategoryTable:", e, dateValue);
         return 'Invalid Date';
      }
    }

    console.warn("Unformattable dateValue in CategoryTable:", dateValue);
    return 'Invalid Date';
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Category List</CardTitle>
        <CardDescription>All available product categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-center w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm ? "No categories match your search." : "No categories found. Add new categories to see them here."}
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center">
                        <Tags className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{formatDate(category.createdAt)}</TableCell>
                    <TableCell>{formatDate(category.updatedAt)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(category)} title="Edit Category">
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Delete Category">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the category "{category.name}".
                                Products using this category will need to be reassigned.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(category.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CategoryTable;
