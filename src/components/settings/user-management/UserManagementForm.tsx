
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
import { auth } from "@/lib/firebase"; 

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
  // For editing, email and password are not directly changed in this form,
  // but Zod needs them defined if they are part of the UserManagementFormData type.
  // They are disabled in the form. Password changes would require a separate mechanism.
  email: z.string().email("Invalid email address.").optional(), 
  password: z.string().optional(), 
});


export type UserManagementFormData = z.infer<typeof userManagementSchemaBase> & {
  email?: string; // Made email optional at the base type for broader compatibility
  password?: string; // Password is only for new users
};

interface UserManagementFormProps {
  userToEdit?: UserProfile | null;
  onSubmit: (data: UserManagementFormData) => void;
  onCancel: () => void;
  currentUserRole: UserRole;
}

const UserManagementForm: React.FC<UserManagementFormProps> = ({ userToEdit, onSubmit, onCancel, currentUserRole }) => {
  const formSchema = userToEdit ? editUserSchema : newUserSchema;
  const isEditingSelf = userToEdit?.id === auth.currentUser?.uid;
  
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
          role: 'employee', 
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
        password: "", // Don't prefill password for edit
      });
    } else {
       form.reset({ // Default for new user
        email: "",
        displayName: "",
        mobileNumber: "",
        role: 'employee', 
        password: "",
      });
    }
  // The form.reset dependency array should ideally include all dependencies that affect the reset logic.
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [userToEdit, form.reset]);


  // Determine available role options based on current user's role and if editing/adding
  let roleOptions: { value: UserRole; label: string }[] = [];

  if (userToEdit) { 
    // When editing an existing user
    roleOptions.push({ value: userToEdit.role, label: userToEdit.role.charAt(0).toUpperCase() + userToEdit.role.slice(1) });

    if (!isEditingSelf && userToEdit.role !== 'owner') { 
      if (currentUserRole === 'owner') {
        // Owner can change Admin to Employee, or Employee to Admin
        if (userToEdit.role === 'admin' && !roleOptions.find(r => r.value === 'employee')) {
          roleOptions.push({ value: 'employee', label: 'Employee' });
        } else if (userToEdit.role === 'employee' && !roleOptions.find(r => r.value === 'admin')) {
          roleOptions.push({ value: 'admin', label: 'Admin' });
        }
      } else if (currentUserRole === 'admin') {
        // Admin can only demote another Admin to Employee
        if (userToEdit.role === 'admin' && !roleOptions.find(r => r.value === 'employee')) {
          roleOptions.push({ value: 'employee', label: 'Employee' });
        }
        // Admin cannot promote an Employee to Admin, so only 'Employee' option remains if editing an employee.
      }
    }
  } else { 
    // When adding a new user
    if (currentUserRole === 'owner') {
      roleOptions = [
        { value: 'employee', label: 'Employee' },
        { value: 'admin', label: 'Admin' },
      ];
      // Ensure default role is one of the available options if it's not already.
      if (form.getValues('role') !== 'admin' && form.getValues('role') !== 'employee') {
         form.setValue('role', 'employee'); 
      }
    } else if (currentUserRole === 'admin') {
      roleOptions = [{ value: 'employee', label: 'Employee' }];
      form.setValue('role', 'employee'); // Admins can only add Employees
    }
  }
  
  // Ensure unique roles and sort them for display
  roleOptions = Array.from(new Set(roleOptions.map(r => r.value)))
    .map(value => {
        const foundOption = roleOptions.find(r => r.value === value);
        return foundOption || { value, label: value.charAt(0).toUpperCase() + value.slice(1) }; // Fallback label
    })
    .sort((a, b) => {
      const order: Record<UserRole, number> = { owner: 0, admin: 1, employee: 2 };
      return order[a.value] - order[b.value];
    });


  const getRoleSelectDisabledState = () => {
    if (isEditingSelf) return true; // User cannot change their own role.
    
    if (userToEdit) {
      if (userToEdit.role === 'owner') return true; // Owner roles are not changed here.
      if (currentUserRole === 'owner') {
        // Owner can change Admin to Employee or Employee to Admin.
        // 'roleOptions' will have ['Admin', 'Employee'], so select should be enabled.
        return roleOptions.length <= 1; // Should be false if both Admin/Employee are options
      }
      if (currentUserRole === 'admin') {
        // Admin can demote another Admin to Employee.
        // Admin cannot promote an Employee to Admin.
        // 'roleOptions' for Admin editing Admin: ['Admin', 'Employee'] -> enabled
        // 'roleOptions' for Admin editing Employee: ['Employee'] -> disabled
        return roleOptions.length <= 1;
      }
    } else { // Adding new user
      if (currentUserRole === 'owner') return false; // Owner can select Admin or Employee.
      if (currentUserRole === 'admin') return true;  // Admin can only add Employee (role is pre-set).
    }
    
    return true; // Default to disabled if no other condition applies.
  };
  
  const getSubmitButtonText = () => {
    if (userToEdit) return "Update User";
    return currentUserRole === 'owner' ? "Add User (Admin/Employee)" : "Add Employee";
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
                value={field.value} // Ensure field.value is always one of the UserRole types
                disabled={getRoleSelectDisabledState()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roleOptions.map((roleOpt) => (
                    <SelectItem 
                      key={roleOpt.value} 
                      value={roleOpt.value}
                    >
                      {roleOpt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getRoleSelectDisabledState() && userToEdit && <p className="text-xs text-muted-foreground">This user's role cannot be changed here.</p>}
              {isEditingSelf && <p className="text-xs text-muted-foreground">You cannot change your own role.</p>}
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
           >
            {getSubmitButtonText()}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UserManagementForm;

