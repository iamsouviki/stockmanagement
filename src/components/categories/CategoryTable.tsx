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
  
  const formatDate = (dateValue: Timestamp | undefined | string | Date) => { // Updated type to include string and Date for broader compatibility
    if (!dateValue) return 'N/A';

    let dateToFormat: Date;

    if (dateValue instanceof FirebaseTimestamp) {
      try {
        dateToFormat = dateValue.toDate();
      } catch (e) {
        console.error("Error converting Firestore Timestamp in CategoryTable:", e, dateValue);
        return 'Invalid Date';
      }
    } else if (dateValue instanceof Date) {
       dateToFormat = dateValue;
    } else if (typeof dateValue === 'string') {
        dateToFormat = new Date(dateValue);
    }
     else if (typeof (dateValue as any)?.toDate === 'function') { // Fallback for plain objects that might have a toDate method
      try {
        dateToFormat = (dateValue as any).toDate();
      } catch (e) {
         console.error("Error formatting object with toDate() in CategoryTable:", e, dateValue);
         return 'Invalid Date';
      }
    }
    else {
      console.warn("Unformattable dateValue type in CategoryTable:", typeof dateValue, dateValue);
      return 'Invalid Date';
    }

    try {
      if (isNaN(dateToFormat.getTime())) {
           console.warn("Invalid Date object after conversion in CategoryTable:", dateToFormat, "Original:", dateValue);
           return 'Invalid Date';
      }
      return format(dateToFormat, 'PPp');
    } catch (e) {
      console.error("Error formatting final Date object in CategoryTable:", e, dateToFormat);
      return 'Invalid Date';
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl text-primary">Category List</CardTitle>
        <CardDescription className="text-sm sm:text-base">All available product categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table className="min-w-[600px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] sm:w-[80px] px-2 sm:px-4">Icon</TableHead>
                <TableHead className="px-2 sm:px-4">Name</TableHead>
                <TableHead className="px-2 sm:px-4">Created At</TableHead>
                <TableHead className="px-2 sm:px-4">Last Updated</TableHead>
                <TableHead className="text-center w-[100px] sm:w-[120px] px-2 sm:px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-sm sm:text-base">
                    {searchTerm ? "No categories match your search." : "No categories found. Add new categories to see them here."}
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="px-2 sm:px-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-md flex items-center justify-center">
                        <Tags className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{category.name}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{formatDate(category.createdAt)}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{formatDate(category.updatedAt)}</TableCell>
                    <TableCell className="text-center px-2 sm:px-4">
                      <div className="flex justify-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onEdit(category)} title="Edit Category">
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" title="Delete Category">
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
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
