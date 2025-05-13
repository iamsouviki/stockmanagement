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
import { auth } from "@/lib/firebase"; // Import Firebase auth
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const allowedAccessRoles: UserRole[] = ['owner', 'admin'];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userProfile: currentUserProfile } = useAuth(); // Current logged-in user's profile

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
  }, [toast]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    if (currentUserProfile?.role === 'admin' && user.role === 'owner') {
        toast({ title: "Permission Denied", description: "Admins cannot edit owner accounts.", variant: "destructive" });
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
     if (currentUserProfile?.role === 'admin' && userRoleToDelete === 'owner') {
        toast({ title: "Permission Denied", description: "Admins cannot delete owner accounts.", variant: "destructive" });
        return;
    }
    if (currentUserProfile?.role !== 'owner') {
        toast({ title: "Permission Denied", description: "Only owners can delete user accounts.", variant: "destructive" });
        return;
    }


    try {
      // Note: deleteUserAccountAndProfile currently only deletes Firestore profile.
      // True Auth account deletion needs Admin SDK (e.g., via Cloud Function).
      await deleteUserAccountAndProfile(userIdToDelete);
      setUsers(users.filter((u) => u.id !== userIdToDelete));
      toast({
        title: "User Profile Deleted",
        description: "The user's profile has been removed. Auth account may still exist.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Error", description: "Failed to delete user profile.", variant: "destructive" });
    }
  };

  const handleSubmitUser = async (data: UserManagementFormData) => {
    try {
      if (editingUser) { // Editing existing user
        if (currentUserProfile?.role === 'admin' && editingUser.role === 'owner' && data.role !== 'owner') {
             toast({ title: "Permission Denied", description: "Admins cannot change an owner's role.", variant: "destructive" });
             return;
        }
        if (currentUserProfile?.role === 'admin' && editingUser.role === 'admin' && data.role === 'owner') {
            toast({ title: "Permission Denied", description: "Admins cannot promote users to owner.", variant: "destructive" });
            return;
        }
        if (editingUser.id === currentUserProfile?.id && data.role !== currentUserProfile.role) {
            toast({ title: "Action Not Allowed", description: "You cannot change your own role.", variant: "destructive"});
            return;
        }


        await updateUserProfile(editingUser.id, {
          displayName: data.displayName,
          role: data.role,
          mobileNumber: data.mobileNumber,
        });
        // Refetch users to get the latest data including timestamps
        await fetchUsers();
        toast({
          title: "User Updated",
          description: `User "${data.displayName}" has been successfully updated.`,
        });
      } else { // Adding new user
        if (!data.email || !data.password) {
          toast({ title: "Missing Fields", description: "Email and password are required for new users.", variant: "destructive" });
          return;
        }
        if (currentUserProfile?.role === 'admin' && data.role === 'owner') {
            toast({ title: "Permission Denied", description: "Admins cannot create owner accounts.", variant: "destructive" });
            return;
        }

        // Step 1: Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const newAuthUser = userCredential.user;

        // Step 2: Create Firestore user profile
        await createFirestoreUserProfile(
          newAuthUser.uid,
          data.email,
          data.displayName,
          data.role,
          data.mobileNumber
        );
        // Refetch users to include the new user
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

  if (!currentUserProfile) {
    return <Skeleton className="h-60 w-full" />; // Or some other loading/auth check indicator
  }

  return (
    <AuthGuard allowedRoles={allowedAccessRoles}>
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings
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
          {currentUserProfile.role === 'owner' && ( // Only owner can add new users initially from this UI
            <Button onClick={handleAddUser} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New User
            </Button>
          )}
           {(currentUserProfile.role === 'admin') && ( // Admin can add 'employee'
            <Button onClick={handleAddUser} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Employee
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <UserManagementTable
            users={users}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            currentUserProfile={currentUserProfile}
          />
        )}

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
