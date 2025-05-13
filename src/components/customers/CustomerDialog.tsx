// @ts-nocheck
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CustomerForm, { type CustomerFormData } from "./CustomerForm";
import type { Customer } from "@/types";

interface CustomerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customer?: Customer | null; 
  onSubmit: (data: CustomerFormData) => void;
  existingMobileNumbers?: string[]; // For validation, though async validation in form/parent is better
  initialMobileNumber?: string; // To pre-fill mobile number for new customer
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({
  isOpen,
  onOpenChange,
  customer,
  onSubmit,
  existingMobileNumbers, // This prop is less effective with async validation within the parent or form.
  initialMobileNumber,
}) => {
  // The onSubmit function passed from the parent (e.g., CustomersPage or BillingPage)
  // should handle the actual submission logic, including async validation and toast messages.
  const handleSubmit = (data: CustomerFormData) => {
    onSubmit(data);
    // Parent component is responsible for closing the dialog on successful submission.
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-6 shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-primary">
            {customer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
          <DialogDescription>
            {customer
              ? "Update the details for this customer."
              : "Fill in the details to add a new customer."}
          </DialogDescription>
        </DialogHeader>
        <CustomerForm
          customer={customer}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          initialMobileNumber={initialMobileNumber} // Pass down to form
        />
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
