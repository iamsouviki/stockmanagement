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
  imageUrl?: string;
  imageHint?: string;
  serialNumber?: string; // Capture SN for items in order
  barcode?: string; // Capture barcode for items in order
}

export interface Order {
  id: string; // Firebase document ID
  orderNumber: string; // Human-readable, e.g., YYYYMMDD-HHMMSS
  customerId?: string;
  customerName?: string; // Denormalized from Customer record
  customerMobile?: string; // Denormalized
  items: OrderItemData[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  orderDate: Timestamp; // Firestore Timestamp
  createdAt?: Timestamp; // Firestore server timestamp
  updatedAt?: Timestamp; // Firestore server timestamp
}

export interface BillItem extends Product { // Used for temporary bill construction on client
  billQuantity: number;
}

export interface Customer {
  id: string; // Firebase document ID
  name: string; // Full name
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

