"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import CustomerTable from "@/components/customers/CustomerTable";
import CustomerDialog from "@/components/customers/CustomerDialog";
import type { CustomerFormData } from "@/components/customers/CustomerForm";
import type { Customer, UserRole } from "@/types";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, findCustomerByMobile } from "@/services/firebaseService";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/auth/AuthGuard";

const allowedRoles: UserRole[] = ['owner', 'admin', 'employee']; // Added 'admin'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const fetchedCustomers = await getCustomers();
        setCustomers(fetchedCustomers);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast({ title: "Error", description: "Failed to fetch customers.", variant: "destructive" });
      }
      setIsLoading(false);
    };
    fetchCustomers();
  }, [toast]);
  
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      setCustomers(customers.filter((c) => c.id !== customerId));
      toast({
        title: "Customer Deleted",
        description: "The customer has been successfully removed.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({ title: "Error", description: "Failed to delete customer.", variant: "destructive" });
    }
  };

  const handleSubmitCustomer = async (data: CustomerFormData) => {
    try {
      const existingCustomersWithMobile = await findCustomerByMobile(data.mobileNumber);
      const isMobileTaken = existingCustomersWithMobile.some(
        c => editingCustomer ? c.id !== editingCustomer.id : true
      );

      if (isMobileTaken) {
        toast({
          title: "Mobile Number Exists",
          description: "This mobile number is already associated with another customer.",
          variant: "destructive",
        });
        return;
      }

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
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
        const customerData = {
          ...data,
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.name.split(" ")[0])}/200/200`,
          imageHint: "person avatar",
        };
        const newCustomerId = await addCustomer(customerData);
        const newCustomerEntry: Customer = {
          ...customerData,
          id: newCustomerId,
        };
        setCustomers([newCustomerEntry, ...customers]);
        toast({
          title: "Customer Added",
          description: `"${data.name}" has been successfully added.`,
        });
      }
      setIsDialogOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({ title: "Error", description: "Failed to save customer.", variant: "destructive" });
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(customer => 
      customer.mobileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const existingMobileNumbers = useMemo(() => customers.map(c => c.mobileNumber), [customers]);


  return (
    <AuthGuard allowedRoles={allowedRoles}>
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
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full sm:w-72 mb-4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <CustomerTable
            customers={filteredCustomers}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
          />
        )}

        <CustomerDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          customer={editingCustomer}
          onSubmit={handleSubmitCustomer}
          existingMobileNumbers={existingMobileNumbers}
        />
      </div>
    </AuthGuard>
  );
}
