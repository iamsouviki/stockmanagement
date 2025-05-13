"use client";

import Image from 'next/image';
import type { Customer } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, UserCircle2, Search } from "lucide-react";
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
import React from "react";

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onEdit, onDelete, searchTerm, onSearchTermChange }) => {
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl text-primary">Customer List</CardTitle>
        <CardDescription className="text-sm sm:text-base">Manage and view your customer base.</CardDescription>
         <div className="relative mt-2">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by mobile or name..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-8 sm:pl-10 w-full sm:w-72 text-xs sm:text-sm"
              aria-label="Search customers by mobile number or name"
            />
          </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table className="min-w-[700px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] sm:w-[60px] px-2 sm:px-4">Avatar</TableHead>
                <TableHead className="px-2 sm:px-4">Name</TableHead>
                <TableHead className="px-2 sm:px-4">Mobile Number</TableHead>
                <TableHead className="px-2 sm:px-4">Email</TableHead>
                <TableHead className="px-2 sm:px-4 max-w-[150px] sm:max-w-[200px]">Address</TableHead>
                <TableHead className="text-center w-[100px] sm:w-[120px] px-2 sm:px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm sm:text-base">
                    {searchTerm ? "No customers match your search." : "No customers found. Add new customers to see them here."}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="px-2 sm:px-4">
                      {customer.imageUrl ? (
                        <Image
                          src={customer.imageUrl}
                          alt={customer.name}
                          width={32} // Smaller for mobile
                          height={32}
                          className="rounded-full object-cover sm:w-10 sm:h-10"
                          data-ai-hint={customer.imageHint || "person avatar"}
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-full flex items-center justify-center">
                          <UserCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{customer.name}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{customer.mobileNumber}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{customer.email || '-'}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4 max-w-[150px] sm:max-w-[200px] truncate whitespace-normal break-words" title={customer.address || undefined}>
                        {customer.address || '-'}
                    </TableCell>
                    <TableCell className="text-center px-2 sm:px-4">
                      <div className="flex justify-center space-x-1 sm:space-x-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onEdit(customer)} title="Edit Customer">
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" title="Delete Customer">
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the customer "{customer.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(customer.id)}
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

export default CustomerTable;
