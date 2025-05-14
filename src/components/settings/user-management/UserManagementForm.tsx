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
  email: z.string().email("Invalid email address.").optional(), 
  password: z.string().optional(), 
});


// Updated UserManagementFormData to be more general
export type UserManagementFormData = z.infer<typeof userManagementSchemaBase> & {
  email?: string | undefined;
  password?: string | undefined;
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
        password: "",
      });
    } else {
       form.reset({
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


  let roleOptions: { value: UserRole; label: string }[] = [];

  if (userToEdit) { 
    roleOptions.push({ value: userToEdit.role, label: userToEdit.role.charAt(0).toUpperCase() + userToEdit.role.slice(1) });

    if (!isEditingSelf && userToEdit.role !== 'owner') { 
      if (currentUserRole === 'owner') {
        if (userToEdit.role === 'admin' && !roleOptions.find(r => r.value === 'employee')) {
          roleOptions.push({ value: 'employee', label: 'Employee' });
        } else if (userToEdit.role === 'employee' && !roleOptions.find(r => r.value === 'admin')) {
          roleOptions.push({ value: 'admin', label: 'Admin' });
        }
      } else if (currentUserRole === 'admin') {
        if (userToEdit.role === 'admin' && !roleOptions.find(r => r.value === 'employee')) {
          roleOptions.push({ value: 'employee', label: 'Employee' });
        }
      }
    }
  } else { 
    if (currentUserRole === 'owner') {
      roleOptions = [
        { value: 'employee', label: 'Employee' },
        { value: 'admin', label: 'Admin' },
      ];
      if (form.getValues('role') !== 'admin' && form.getValues('role') !== 'employee') {
         form.setValue('role', 'employee'); 
      }
    } else if (currentUserRole === 'admin') {
      roleOptions = [{ value: 'employee', label: 'Employee' }];
      form.setValue('role', 'employee'); 
    }
  }
  
  roleOptions = Array.from(new Set(roleOptions.map(r => r.value)))
    .map(value => roleOptions.find(r => r.value === value)!)
    .sort((a, b) => {
      const order: Record<UserRole, number> = { owner: 0, admin: 1, employee: 2 };
      return order[a.value] - order[b.value];
    });


  const getRoleSelectDisabledState = () => {
    if (isEditingSelf) return true;
    if (userToEdit?.role === 'owner') return true; 

    if (currentUserRole === 'owner') {
      return !(userToEdit?.role === 'admin' || userToEdit?.role === 'employee');
    }
    if (currentUserRole === 'admin') {
      if (userToEdit?.role === 'owner') return true;
      return userToEdit?.role === 'employee'; 
    }
    if (!userToEdit && (currentUserRole === 'owner' || currentUserRole === 'admin')) return false; 
    
    return true; 
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
                value={field.value}
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
