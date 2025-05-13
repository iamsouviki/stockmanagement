
"use client";

import Image from 'next/image';
import type { Product } from "@/types"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Tag, Package } from "lucide-react";
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
// Removed Card imports as ProductTable is now typically inside a Card in the parent page


interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete }) => {
  return (
    // Card wrapper removed, will be handled by parent page (e.g., ProductsPage)
    // This makes ProductTable more reusable if placed in different contexts.
    <ScrollArea className="w-full whitespace-nowrap rounded-md border-b"> {/* Add border-b if it's the last element before pagination */}
      <Table className="min-w-[800px] sm:min-w-full"><TableHeader>
          <TableRow>
            <TableHead className="w-[50px] sm:w-[80px] px-2 sm:px-4">Image</TableHead>
            <TableHead className="px-2 sm:px-4">Name</TableHead>
            <TableHead className="px-2 sm:px-4">Category</TableHead>
            <TableHead className="px-2 sm:px-4">Serial No.</TableHead>
            <TableHead className="px-2 sm:px-4">Barcode</TableHead>
            <TableHead className="text-right px-2 sm:px-4">Price</TableHead>
            <TableHead className="text-right px-2 sm:px-4">Quantity</TableHead>
            <TableHead className="text-center w-[100px] sm:w-[120px] px-2 sm:px-4">Actions</TableHead>
          </TableRow>
        </TableHeader><TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-sm sm:text-base">
                No products found for the current page or filters.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="px-2 sm:px-4">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={32}
                      height={32}
                      className="rounded-md object-cover sm:w-10 sm:h-10"
                      data-ai-hint={product.imageHint || "product item"}
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-md flex items-center justify-center text-muted-foreground">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words max-w-[120px] sm:max-w-xs">{product.name}</TableCell>
                <TableCell className="text-xs sm:text-sm px-2 sm:px-4">
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit text-xs">
                    <Tag className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /> 
                    <span className="whitespace-normal break-words max-w-[100px] sm:max-w-[150px] truncate">{product.categoryName || "Unknown"}</span>
                  </Badge>
                </TableCell>
                <TableCell className="text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{product.serialNumber}</TableCell>
                <TableCell className="text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{product.barcode}</TableCell>
                <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4">₹{product.price.toFixed(2)}</TableCell>
                <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4">{product.quantity}</TableCell>
                <TableCell className="text-center px-2 sm:px-4">
                  <div className="flex justify-center space-x-1 sm:space-x-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onEdit(product)} title="Edit Product">
                      <Pencil className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" title="Delete Product">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product "{product.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(product.id)}
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
        </TableBody></Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default ProductTable;
