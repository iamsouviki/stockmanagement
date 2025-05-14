
import type { Timestamp as FirestoreTimestampType } from 'firebase/firestore'; // Keep original for other types if needed

export interface Category {
  id: string; // Firebase document ID
  name: string;
  createdAt?: FirestoreTimestampType; // Keep as Timestamp for now, address if error occurs for categories
  updatedAt?: FirestoreTimestampType;
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
  createdAt?: FirestoreTimestampType; // Keep as Timestamp for now
  updatedAt?: FirestoreTimestampType;
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
  orderDate: FirestoreTimestampType | Date; // Keep as Timestamp for now
  createdAt?: FirestoreTimestampType;
  updatedAt?: FirestoreTimestampType;
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
  createdAt?: FirestoreTimestampType; // Keep as Timestamp for now
  updatedAt?: FirestoreTimestampType;
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

export type UserRole = 'owner' | 'admin' | 'employee';

export interface UserProfile {
  id: string; // Firebase Auth UID (which is user.uid)
  email: string | null;
  displayName: string | null;
  mobileNumber?: string | null;
  role: UserRole;
  createdAt?: string; // Changed from Timestamp to string
  updatedAt?: string; // Changed from Timestamp to string
}
