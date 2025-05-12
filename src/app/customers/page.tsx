// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import CustomerTable from "@/components/customers/CustomerTable";
import CustomerDialog from "@/components/customers/CustomerDialog";
import type { CustomerFormData } from "@/components/customers/CustomerForm";
import type { Customer } from "@/types";
import { mockCustomers as initialCustomers } from "@/data/mockData";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setCustomers(initialCustomers);
  }, []);
  
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(customers.filter((c) => c.id !== customerId));
    toast({
      title: "Customer Deleted",
      description: "The customer has been successfully removed.",
      variant: "destructive",
    });
  };

  const handleSubmitCustomer = (data: CustomerFormData) => {
    const existingMobileNumbers = customers
      .filter(c => editingCustomer ? c.id !== editingCustomer.id : true)
      .map(c => c.mobileNumber);

    if (existingMobileNumbers.includes(data.mobileNumber)) {
      toast({
        title: "Mobile Number Exists",
        description: "This mobile number is already associated with another customer. Please use a unique mobile number.",
        variant: "destructive",
      });
      return;
    }

    if (editingCustomer) {
      setCustomers(
        customers.map((c) =>
          c.id === editingCustomer.id ? { ...editingCustomer, ...data } : c
        )
      );
      toast({
        title: "Customer Updated",
        description: `Information for "${data.name}" has been successfully updated.`,
      });
    } else {
      const newCustomer: Customer = {
        ...data,
        id: `cust${Date.now()}`, 
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.name.split(" ")[0])}/200/200`,
        imageHint: "person avatar",
      };
      setCustomers([newCustomer, ...customers]);
      toast({
        title: "Customer Added",
        description: `"${data.name}" has been successfully added.`,
      });
    }
    setIsDialogOpen(false);
    setEditingCustomer(null);
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(customer => 
      customer.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const existingMobileNumbers = useMemo(() => customers.map(c => c.mobileNumber), [customers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage your customer database here.
          </p>
        </div>
        <Button onClick={handleAddCustomer} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Customer
        </Button>
      </div>

      <CustomerTable
        customers={filteredCustomers}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      <CustomerDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        customer={editingCustomer}
        onSubmit={handleSubmitCustomer}
        existingMobileNumbers={existingMobileNumbers}
      />
    </div>
  );
}
