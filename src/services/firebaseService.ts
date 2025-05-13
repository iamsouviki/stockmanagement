
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  type FieldPath, // Import FieldPath
  type OrderByDirection, // Import OrderByDirection
} from 'firebase/firestore';
import type { Product, Customer, Category, Order, OrderItemData } from '@/types';
import { WALK_IN_CUSTOMER_ID } from '@/types'; 
import { format } from 'date-fns';

// Generic CRUD operations
const getCollection = async <T extends Record<string, any>>(
  collectionName: string,
  orderByField?: Extract<keyof T, string>, // Ensures orderByField is a string key of T
  orderDirection: OrderByDirection = 'asc',
  pageLimit: number = 0,
  lastVisible?: any
): Promise<T[]> => {
  let q = query(collection(db, collectionName)); // Initialize q with collection first
  if (orderByField) {
    // orderByField is now guaranteed to be a string key of T, or undefined.
    // The if check handles undefined.
    q = query(q, orderBy(orderByField, orderDirection));
  }
  if (pageLimit > 0) {
     // @ts-ignore
    q = query(q, limit(pageLimit));
  }
  if (lastVisible) {
    // @ts-ignore
    q = query(q, startAfter(lastVisible));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

const getDocument = async <T extends Record<string, any>>(collectionName: string, id: string): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as T) : null;
};

const addDocument = async <T extends object>(collectionName: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

const updateDocument = async <T extends object>(collectionName: string, id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, collectionName, id));
};

// Categories Service
export const getCategories = () => getCollection<Category>('categories', 'name');
export const addCategory = async (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
  const id = await addDocument<Category>('categories', data);
  // Firestore Timestamps are server-generated, so we can't immediately return them as Date/string.
  // For immediate use, return the input data with the ID. The actual timestamps will be in DB.
  return { id, ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }; // Approximate for return
};
export const updateCategory = (id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => updateDocument<Category>('categories', id, data);
export const deleteCategory = (id: string) => deleteDocument('categories', id);

export const findCategoryByNameOrCreate = async (name: string): Promise<Category> => {
  const trimmedName = name.trim();
  const categoriesRef = collection(db, 'categories');
  // Firestore queries are case-sensitive. Fetch all and filter, or enforce consistent casing.
  // For simplicity here, fetching all and filtering. This might not be scalable for huge category lists.
  // A better approach for large scale would be to store a lower-case version of the name for querying.
  const allCategories = await getCategories(); 
  const existingCategory = allCategories.find(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());

  if (existingCategory) {
    return existingCategory;
  } else {
    const newCategoryData = { name: trimmedName };
    const newCategoryId = await addDocument<Category>('categories', newCategoryData);
    // Fetch the newly created category to get timestamps if needed, or construct manually for return
    // const createdCategory = await getDocument<Category>('categories', newCategoryId);
    // return createdCategory!; 
    return { id: newCategoryId, name: trimmedName, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }; // Approximate for return
  }
};


// Products Service
export const getProducts = () => getCollection<Product>('products', 'name');
export const getProduct = (id: string) => getDocument<Product>('products', id);
export const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => addDocument<Product>('products', data);
export const updateProduct = (id: string, data: Partial<Omit<Product, 'id'| 'createdAt' | 'updatedAt'>>) => updateDocument<Product>('products', id, data);
export const deleteProduct = (id: string) => deleteDocument('products', id);

export const findProductBySerialNumberOrBarcode = async (serialNumber?: string, barcode?: string): Promise<Product | null> => {
  const productsRef = collection(db, 'products');
  let q;

  if (serialNumber) {
    q = query(productsRef, where('serialNumber', '==', serialNumber), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0];
      return { id: docData.id, ...docData.data() } as Product;
    }
  }

  if (barcode) {
    q = query(productsRef, where('barcode', '==', barcode), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docData = snapshot.docs[0];
      return { id: docData.id, ...docData.data() } as Product;
    }
  }
  return null;
};


// Customers Service
export const getCustomers = () => getCollection<Customer>('customers', 'name');
export const getCustomer = (id: string) => getDocument<Customer>('customers', id);
export const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => addDocument<Customer>('customers', data);
export const updateCustomer = (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) => updateDocument<Customer>('customers', id, data);
export const deleteCustomer = (id: string) => deleteDocument('customers', id);
export const findCustomerByMobile = async (mobileNumber: string): Promise<Customer[]> => {
  const q = query(collection(db, 'customers'), where('mobileNumber', '==', mobileNumber));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};


// Orders Service
export const getOrders = () => getCollection<Order>('orders', 'orderDate', 'desc');
export const getOrder = (id: string) => getDocument<Order>('orders', id);

export const addOrderAndDecrementStock = async (
  orderData: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt' | 'updatedAt'>,
  itemsToDecrement: { productId: string, quantity: number }[]
): Promise<string> => {
  const batch = writeBatch(db);
  const now = new Date();
  const orderNumber = `ORD-${format(now, 'yyyyMMdd-HHmmssSSS')}`;
  
  const completeOrderData: Omit<Order, 'id'> = {
    ...orderData, 
    orderNumber,
    orderDate: Timestamp.fromDate(now),
    createdAt: serverTimestamp() as Timestamp, 
    updatedAt: serverTimestamp() as Timestamp,
  };

  const newOrderRef = doc(collection(db, 'orders'));
  batch.set(newOrderRef, completeOrderData);

  for (const item of itemsToDecrement) {
    const productRef = doc(db, 'products', item.productId);
    const productSnap = await getDoc(productRef); // Important: getDoc is async
    if (productSnap.exists()) {
      const currentStock = productSnap.data().quantity || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      batch.update(productRef, { quantity: newStock, updatedAt: serverTimestamp() });
    } else {
      console.warn(`Product with ID ${item.productId} not found for stock decrement.`);
    }
  }

  await batch.commit();
  return newOrderRef.id;
};
