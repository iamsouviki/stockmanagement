// src/components/shared/PaginationControls.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  onPrevPage: () => void;
  onNextPage: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  itemsPerPage: number;
  onItemsPerPageChange: (value: string) => void;
  currentPage?: number; // Optional for display
  totalItems?: number; // Optional for display
}

const itemsPerPageOptions = [10, 20, 30, 50, 100];

export default function PaginationControls({
  onPrevPage,
  onNextPage,
  canGoPrev,
  canGoNext,
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  totalItems
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 sm:p-4 border-t">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Rows per page:</span>
        <Select
          value={String(itemsPerPage)}
          onValueChange={onItemsPerPageChange}
        >
          <SelectTrigger className="w-[70px] h-8 text-xs sm:text-sm">
            <SelectValue placeholder={itemsPerPage} />
          </SelectTrigger>
          <SelectContent>
            {itemsPerPageOptions.map(option => (
              <SelectItem key={option} value={String(option)} className="text-xs sm:text-sm">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Displaying total items and current page can be complex without a full count */}
        {/* For now, this part is simplified */}
        {/* {currentPage && totalItems && itemsPerPage && (
            <span>
                Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
            </span>
        )} */}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!canGoPrev}
          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!canGoNext}
          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
