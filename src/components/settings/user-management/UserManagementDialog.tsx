// src/components/settings/user-management/UserManagementDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import UserManagementForm, { type UserManagementFormData } from "./UserManagementForm";
import type { UserProfile, UserRole } from "@/types";

interface UserManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user?: UserProfile | null; 
  onSubmit: (data: UserManagementFormData) => void;
  currentUserRole: UserRole;
}

const UserManagementDialog: React.FC<UserManagementDialogProps> = ({
  isOpen,
  onOpenChange,
  user,
  onSubmit,
  currentUserRole,
}) => {
  const handleSubmit = (data: UserManagementFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-primary">
            {user ? "Edit User" : "Add New User"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {user
              ? "Update the details for this user account."
              : "Fill in the details to create a new user account."}
          </DialogDescription>
        </DialogHeader>
        <UserManagementForm
          userToEdit={user}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          currentUserRole={currentUserRole}
        />
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementDialog;
