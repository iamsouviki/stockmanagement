import type { Timestamp } from 'firebase/firestore';

export interface Category {
  id: string; // Firebase document ID
  name: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Product {
  id: string; // Firebase document ID
  name: string;
  serialNumber: string;
  barcode: string;
  price: number;
  quantity: number; // Current stock quantity
  categoryId: string;
  categoryName?: string; // Denormalized for easier display
  imageUrl?: string;
  imageHint?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface OrderItemData {
  productId: string;
  name: string;
  price: number; // Price at the time of sale
  billQuantity: number;
  imageUrl?: string | null; 
  imageHint?: string | null; 
  serialNumber?: string | null; 
  barcode?: string | null; 
}

export interface Order {
  id: string; // Firebase document ID
  orderNumber: string; 
  customerId: string; // Non-optional: Use WALK_IN_CUSTOMER_ID for walk-ins
  customerName: string; 
  customerMobile: string; 
  customerAddress?: string | null; 
  items: OrderItemData[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  orderDate: Timestamp; 
  createdAt?: Timestamp; 
  updatedAt?: Timestamp; 
}

export interface BillItem extends Product { 
  billQuantity: number;
}

export interface Customer {
  id: string; // Firebase document ID
  name: string; 
  mobileNumber: string;
  email?: string;
  address?: string;
  imageUrl?: string;
  imageHint?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StoreDetails {
  name: string;
  address: string;
  logoUrl: string;
  logoHint: string;
  contact: string;
  storeType: string;
  gstNo: string;
}

export const WALK_IN_CUSTOMER_ID = "WALK_IN_CUSTOMER";

// Updated User types for Authentication and Roles
export type UserRole = 'owner' | 'admin' | 'employee';

export interface UserProfile {
  id: string; // Firebase Auth UID (which is user.uid)
  email: string | null;
  displayName: string | null;
  mobileNumber?: string | null; // Added mobile number
  role: UserRole;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
