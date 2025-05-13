// src/components/settings/user-management/UserManagementForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserProfile, UserRole } from "@/types"; // Import Category
import { useEffect } from "react";

const userManagementSchemaBase = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").max(50, "Name must be 50 characters or less."),
  mobileNumber: z.string().optional().or(z.literal("")).refine(val => !val || /^[+]?[0-9\s-()]{10,}$/.test(val), {
    message: "Invalid mobile number format (min 10 digits)."
  }),
  role: z.custom<UserRole>((val) => ['owner', 'admin', 'employee'].includes(val as string), {
    message: "Invalid role selected.",
  }),
});

const newUserSchema = userManagementSchemaBase.extend({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const editUserSchema = userManagementSchemaBase.extend({
  email: z.string().email("Invalid email address.").optional(), // Email not editable directly here for existing users
  password: z.string().optional(), // Password not editable here for existing users
});


export type UserManagementFormData = z.infer<typeof newUserSchema>; // Use newUserSchema as it's a superset for form values

interface UserManagementFormProps {
  userToEdit?: UserProfile | null;
  onSubmit: (data: UserManagementFormData) => void;
  onCancel: () => void;
  currentUserRole: UserRole;
}

const UserManagementForm: React.FC<UserManagementFormProps> = ({ userToEdit, onSubmit, onCancel, currentUserRole }) => {
  const formSchema = userToEdit ? editUserSchema : newUserSchema;
  
  const form = useForm<UserManagementFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: userToEdit
      ? {
          email: userToEdit.email || "", // Email is for display, not edit
          displayName: userToEdit.displayName || "",
          mobileNumber: userToEdit.mobileNumber || "",
          role: userToEdit.role,
          password: "", // Password not pre-filled for editing
        }
      : {
          email: "",
          displayName: "",
          mobileNumber: "",
          role: "employee", // Default role for new users
          password: "",
        },
  });

  useEffect(() => {
    if (userToEdit) {
      form.reset({
        email: userToEdit.email || "",
        displayName: userToEdit.displayName || "",
        mobileNumber: userToEdit.mobileNumber || "",
        role: userToEdit.role,
        password: "",
      });
    } else {
       form.reset({
        email: "",
        displayName: "",
        mobileNumber: "",
        role: "employee",
        password: "",
      });
    }
  }, [userToEdit, form.reset, form]);

  const availableRoles: { value: UserRole; label: string }[] = [
    { value: 'employee', label: 'Employee' },
    { value: 'admin', label: 'Admin' },
  ];
  if (currentUserRole === 'owner') {
    // Owner can assign owner role, but typically not to themselves via this form if editing,
    // and creating another owner is a significant action.
    // For simplicity, owner can create admin/employee. Promoting to owner can be a separate feature or manual.
    // Let's assume owner can create Admin or Employee.
    // If editing, owner can change any role.
  }
   if (currentUserRole === 'owner' && userToEdit?.role === 'owner') {
    availableRoles.push({ value: 'owner', label: 'Owner' });
   } else if (currentUserRole === 'owner' && !userToEdit) {
     // Owner creating new user, can make them admin or employee
   }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 py-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} disabled={!!userToEdit} />
              </FormControl>
              {!!userToEdit && <p className="text-xs text-muted-foreground">Email cannot be changed for existing users.</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        {!userToEdit && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Min. 6 characters" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 9876543210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={
                    (currentUserRole === 'admin' && userToEdit?.role === 'owner') || 
                    (userToEdit?.id === auth.currentUser?.uid) // Cannot change own role
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableRoles.map((roleOpt) => {
                    // Admin cannot assign 'owner' role
                    if (currentUserRole === 'admin' && roleOpt.value === 'owner') {
                      return null;
                    }
                    // Admin cannot change an existing Owner's role
                    if (currentUserRole === 'admin' && userToEdit?.role === 'owner' && field.value === 'owner') {
                         return <SelectItem key={roleOpt.value} value={roleOpt.value} disabled={true}>{roleOpt.label}</SelectItem>;
                    }
                    return (
                      <SelectItem key={roleOpt.value} value={roleOpt.value}>
                        {roleOpt.label}
                      </SelectItem>
                    );
                  })}
                   {/* If current user is owner and editing another owner, show Owner role */}
                   {currentUserRole === 'owner' && userToEdit?.role === 'owner' && !availableRoles.find(r => r.value === 'owner') && (
                     <SelectItem value="owner">Owner</SelectItem>
                   )}
                </SelectContent>
              </Select>
              {(userToEdit?.id === auth.currentUser?.uid) && <p className="text-xs text-muted-foreground">You cannot change your own role.</p>}
              {(currentUserRole === 'admin' && userToEdit?.role === 'owner') && <p className="text-xs text-muted-foreground">Admins cannot change an owner's role.</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-3 pt-2 sm:pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            disabled={
                (currentUserRole === 'admin' && userToEdit?.role === 'owner') || // Admin cannot save changes to owner
                (currentUserRole === 'admin' && form.getValues('role') === 'owner' && !userToEdit) // Admin cannot create owner
            }
           >
            {userToEdit ? "Update User" : "Add User"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UserManagementForm;
