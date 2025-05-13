// src/components/settings/user-management/UserManagementTable.tsx
"use client";

import type { UserProfile, UserRole } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ShieldCheck, UserCog, Briefcase } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { Timestamp as FirebaseTimestamp } from 'firebase/firestore';

interface UserManagementTableProps {
  users: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string, userRole: UserRole) => void;
  currentUserProfile: UserProfile;
}

const RoleIcon = ({ role }: { role: UserRole }) => {
  switch (role) {
    case 'owner':
      return <ShieldCheck className="h-4 w-4 text-amber-500" />;
    case 'admin':
      return <UserCog className="h-4 w-4 text-blue-500" />;
    case 'employee':
      return <Briefcase className="h-4 w-4 text-green-500" />;
    default:
      return null;
  }
};

const UserManagementTable: React.FC<UserManagementTableProps> = ({ users, onEdit, onDelete, currentUserProfile }) => {
  
  const formatDate = (dateValue: Timestamp | undefined | string | Date) => {
    if (!dateValue) return 'N/A';
    let dateToFormat: Date;

    if (dateValue instanceof FirebaseTimestamp) {
      dateToFormat = dateValue.toDate();
    } else if (dateValue instanceof Date) {
       dateToFormat = dateValue;
    } else if (typeof dateValue === 'string') {
        dateToFormat = new Date(dateValue);
    } else if (typeof (dateValue as any)?.toDate === 'function') {
      dateToFormat = (dateValue as any).toDate();
    } else {
      return 'Invalid Date';
    }

    try {
      if (isNaN(dateToFormat.getTime())) return 'Invalid Date';
      return format(dateToFormat, 'PPp');
    } catch (e) {
      return 'Error Date';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl text-primary">User Accounts</CardTitle>
        <CardDescription className="text-sm sm:text-base">List of all registered users and their roles.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table className="min-w-[700px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 sm:px-4">Name</TableHead>
                <TableHead className="px-2 sm:px-4">Email</TableHead>
                <TableHead className="px-2 sm:px-4">Mobile</TableHead>
                <TableHead className="px-2 sm:px-4">Role</TableHead>
                <TableHead className="px-2 sm:px-4">Created At</TableHead>
                <TableHead className="text-center w-[100px] sm:w-[120px] px-2 sm:px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm sm:text-base">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{user.displayName || 'N/A'}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4 whitespace-normal break-words">{user.email || 'N/A'}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{user.mobileNumber || '-'}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">
                      <Badge variant={user.role === 'owner' ? 'default' : user.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize flex items-center gap-1 w-fit text-xs">
                        <RoleIcon role={user.role} />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 sm:px-4">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-center px-2 sm:px-4">
                      <div className="flex justify-center space-x-1 sm:space-x-2">
                        {(currentUserProfile.role === 'owner' || (currentUserProfile.role === 'admin' && user.role !== 'owner')) && user.id !== currentUserProfile.id && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onEdit(user)} title="Edit User">
                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          </Button>
                        )}
                        {currentUserProfile.role === 'owner' && user.id !== currentUserProfile.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" title="Delete User">
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will delete the user profile for "{user.displayName || user.email}".
                                  The Firebase Authentication account might need to be removed separately by an administrator.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(user.id, user.role)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete Profile
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UserManagementTable;
