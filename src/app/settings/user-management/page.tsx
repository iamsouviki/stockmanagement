// src/app/settings/user-management/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import UserManagementTable from "@/components/settings/user-management/UserManagementTable";
import UserManagementDialog from "@/components/settings/user-management/UserManagementDialog";
import type { UserManagementFormData } from "@/components/settings/user-management/UserManagementForm";
import type { UserProfile, UserRole } from "@/types";
import { PlusCircle, ArrowLeft, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAllUserProfiles,
  createFirestoreUserProfile,
  updateUserProfile,
  deleteUserAccountAndProfile,
} from "@/services/userService";
import { auth } from "@/lib/firebase"; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const allowedAccessRoles: UserRole[] = ['owner', 'admin'];

export default function UserManagementPage() {
  console.log("UserManagementPage rendering or attempting to render."); // Added for debugging

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userProfile: currentUserProfile } = useAuth(); 

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getAllUserProfiles();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Failed to fetch users.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    if (user.id === currentUserProfile?.id) {
        toast({ title: "Action Not Allowed", description: "You cannot edit your own account details here.", variant: "default" });
        return;
    }
    if (user.role === 'owner') {
        toast({ title: "Action Not Allowed", description: "Owner accounts cannot be modified from this panel.", variant: "default" });
        return;
    }
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (userIdToDelete: string, userRoleToDelete: UserRole) => {
    if (currentUserProfile?.id === userIdToDelete) {
      toast({ title: "Action Not Allowed", description: "You cannot delete your own account.", variant: "destructive" });
      return;
    }
     if (userRoleToDelete === 'owner') {
        toast({ title: "Action Not Allowed", description: "Deleting owner accounts is a restricted operation.", variant: "destructive" });
        return;
    }
    if (currentUserProfile?.role === 'admin' && userRoleToDelete === 'admin') {
        toast({ title: "Permission Denied", description: "Admins cannot delete other admin accounts.", variant: "destructive" });
        return;
    }

    if (currentUserProfile?.role === 'owner' || (currentUserProfile?.role === 'admin' && userRoleToDelete === 'employee')) {
        try {
          await deleteUserAccountAndProfile(userIdToDelete);
          setUsers(users.filter((u) => u.id !== userIdToDelete));
          toast({
            title: "User Profile Deleted",
            description: "The user's profile has been removed.",
            variant: "destructive",
          });
        } catch (error) {
          console.error("Error deleting user:", error);
          toast({ title: "Error", description: "Failed to delete user profile. The Auth account might still exist.", variant: "destructive" });
        }
    } else {
         toast({ title: "Permission Denied", description: "You do not have permission to delete this user.", variant: "destructive" });
    }
  };

  const handleSubmitUser = async (data: UserManagementFormData) => {
    try {
      if (editingUser) { 
        if (currentUserProfile?.role === 'admin') {
            if (editingUser.role === 'admin' && data.role === 'admin') {
            } else if (editingUser.role === 'admin' && data.role === 'employee') {
            } else if (editingUser.role === 'employee' && data.role === 'employee') {
            } else if (editingUser.role === 'employee' && data.role === 'admin') {
                toast({ title: "Permission Denied", description: "Admins cannot promote Employees to Admin.", variant: "destructive" });
                return;
            } else { 
                toast({ title: "Permission Denied", description: "Admins can only demote other Admins to Employee, or manage Employee accounts. Cannot assign 'owner' role.", variant: "destructive" });
                return;
            }
        }
        
        if (currentUserProfile?.role === 'owner') {
            if ((editingUser.role === 'admin' || editingUser.role === 'employee') && (data.role === 'admin' || data.role === 'employee') ) {
            } else if (data.role === 'owner') { 
                 toast({ title: "Action Not Allowed", description: "Cannot assign Owner role via edit. This is a restricted operation.", variant: "destructive"});
                 return;
            }
        }

        await updateUserProfile(editingUser.id, {
          displayName: data.displayName,
          role: data.role,
          mobileNumber: data.mobileNumber,
        });
        await fetchUsers();
        toast({
          title: "User Updated",
          description: `User "${data.displayName}" has been successfully updated.`,
        });
      } else { 
        if (!data.email || !data.password) {
          toast({ title: "Missing Fields", description: "Email and password are required for new users.", variant: "destructive" });
          return;
        }
        
        if (currentUserProfile?.role === 'owner') {
            if (data.role === 'owner') {
                 toast({ title: "Action Not Allowed", description: "Cannot create new Owner directly. Assign Admin or Employee role.", variant: "destructive" });
                 return;
            }
        } else if (currentUserProfile?.role === 'admin') {
            if (data.role === 'owner' || data.role === 'admin') {
                toast({ title: "Permission Denied", description: "Admins can only create Employee accounts.", variant: "destructive" });
                return;
            }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const newAuthUser = userCredential.user;

        await createFirestoreUserProfile(
          newAuthUser.uid,
          data.email, 
          data.displayName,
          data.role,
          data.mobileNumber
        );
        await fetchUsers();
        toast({
          title: "User Added",
          description: `User "${data.displayName}" has been successfully added.`,
        });
      }
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error("Error saving user:", error);
      let errorMessage = "Failed to save user.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use by another account.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. It must be at least 6 characters long.";
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  if (!currentUserProfile || isLoading) { 
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="flex justify-between items-center">
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
    <AuthGuard allowedRoles={allowedAccessRoles}>
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center">
              <Users className="mr-3 h-8 w-8" /> User Management
            </h1>
            <p className="text-muted-foreground">
              Manage application users, their roles, and permissions.
            </p>
          </div>
          {(currentUserProfile.role === 'owner' || currentUserProfile.role === 'admin') && (
            <Button onClick={handleAddUser} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> 
              {currentUserProfile.role === 'owner' ? "Add User (Admin/Employee)" : "Add New Employee"}
            </Button>
          )}
        </div>

        <UserManagementTable
            users={users}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            currentUserProfile={currentUserProfile}
        />

        <UserManagementDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          user={editingUser}
          onSubmit={handleSubmitUser}
          currentUserRole={currentUserProfile.role}
        />
      </div>
    </AuthGuard>
  );
}
