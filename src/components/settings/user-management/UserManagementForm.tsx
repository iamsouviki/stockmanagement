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
import type { UserProfile, UserRole } from "@/types"; 
import { useEffect } from "react";
import { auth } from "@/lib/firebase"; // Import auth to check current user ID

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
  email: z.string().email("Invalid email address.").optional(), 
  password: z.string().optional(), 
});


export type UserManagementFormData = z.infer<typeof newUserSchema>; 

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
          email: userToEdit.email || "", 
          displayName: userToEdit.displayName || "",
          mobileNumber: userToEdit.mobileNumber || "",
          role: userToEdit.role,
          password: "", 
        }
      : {
          email: "",
          displayName: "",
          mobileNumber: "",
          role: currentUserRole === 'owner' ? 'employee' : 'employee', // Owner defaults to employee, admin must default to employee
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
        role: currentUserRole === 'owner' ? 'employee' : 'employee',
        password: "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToEdit, form.reset, currentUserRole]); // form was missing from deps

  let availableRoles: { value: UserRole; label: string }[] = [
    { value: 'employee', label: 'Employee' },
  ];

  if (currentUserRole === 'owner') {
    availableRoles.push({ value: 'admin', label: 'Admin' });
    // Owner can also see 'owner' role if editing an existing owner, but cannot assign it to new users via this form.
    if (userToEdit && userToEdit.role === 'owner') {
        if (!availableRoles.find(r => r.value === 'owner')) {
             availableRoles.push({ value: 'owner', label: 'Owner (Cannot change)' });
        }
    }
  } else if (currentUserRole === 'admin') {
    // Admin can only manage employees, so only 'employee' is available.
    // If editing an admin (which shouldn't happen if UI prevents it), show admin role.
    if (userToEdit && userToEdit.role === 'admin') {
        availableRoles.push({ value: 'admin', label: 'Admin (Cannot change)' });
    }
  }


  const getRoleSelectDisabledState = () => {
    if (userToEdit?.id === auth.currentUser?.uid) return true; // Cannot change own role
    if (currentUserRole === 'admin' && userToEdit?.role === 'owner') return true; // Admin cannot change owner's role
    if (currentUserRole === 'admin' && userToEdit?.role === 'admin') return true; // Admin cannot change other admin's role
    if (userToEdit?.role === 'owner' && currentUserRole === 'owner') return true; // Owner cannot change another owner's role (for safety)
    return false;
  };
  
  const getSubmitButtonDisabledState = () => {
    if (currentUserRole === 'admin' && userToEdit?.role === 'owner') return true; // Admin cannot save changes to owner
    if (currentUserRole === 'admin' && form.getValues('role') === 'owner' && !userToEdit) return true; // Admin cannot create owner
    if (currentUserRole === 'admin' && form.getValues('role') === 'admin' && !userToEdit) return true; // Admin cannot create admin
    if (currentUserRole === 'owner' && form.getValues('role') === 'owner' && !userToEdit) return true; // Owner cannot create owner via this form
    return false;
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
                value={field.value} // Use value prop for controlled component
                disabled={getRoleSelectDisabledState()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableRoles.map((roleOpt) => (
                    <SelectItem 
                      key={roleOpt.value} 
                      value={roleOpt.value}
                      // Additional disable logic for specific items if needed, though main Select disabled handles most
                      disabled={
                        (currentUserRole === 'admin' && roleOpt.value === 'admin' && (!userToEdit || userToEdit.role !== 'admin')) || // Admin cannot assign admin unless editing an existing admin (which is disabled above)
                        (currentUserRole === 'admin' && roleOpt.value === 'owner') // Admin cannot assign owner
                      }
                    >
                      {roleOpt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getRoleSelectDisabledState() && userToEdit && <p className="text-xs text-muted-foreground">This user's role cannot be changed here.</p>}
              {userToEdit?.id === auth.currentUser?.uid && <p className="text-xs text-muted-foreground">You cannot change your own role.</p>}
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
            disabled={getSubmitButtonDisabledState()}
           >
            {userToEdit ? "Update User" : "Add User"}
          </Button>
        </div>
         {getSubmitButtonDisabledState() && (
            <p className="text-xs text-destructive text-right mt-1">
                { (currentUserRole === 'admin' && (form.getValues('role') === 'owner' || form.getValues('role') === 'admin') && !userToEdit) && "Admins can only create Employees."}
                { (currentUserRole === 'owner' && form.getValues('role') === 'owner' && !userToEdit) && "Cannot create new Owner directly. Assign Admin or Employee."}
            </p>
        )}
      </form>
    </Form>
  );
};

export default UserManagementForm;
