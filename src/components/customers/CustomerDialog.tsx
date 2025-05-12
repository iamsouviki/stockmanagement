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
  existingMobileNumbers: string[]; // For validation
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({
  isOpen,
  onOpenChange,
  customer,
  onSubmit,
  existingMobileNumbers,
}) => {
  const handleSubmit = (data: CustomerFormData) => {
    // Basic check for mobile number uniqueness if adding new or changing existing
    const currentMobile = customer?.mobileNumber;
    if (data.mobileNumber !== currentMobile && existingMobileNumbers.includes(data.mobileNumber)) {
       // This alert should ideally be a form error in CustomerForm, or handled by parent toast
      alert("This mobile number is already in use. Please use a different one.");
      return;
    }
    onSubmit(data);
    onOpenChange(false); 
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
        />
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
