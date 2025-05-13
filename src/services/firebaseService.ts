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
} from 'firebase/firestore';
import type { Product, Customer, Category, Order, OrderItemData } from '@/types';
import { WALK_IN_CUSTOMER_ID } from '@/types'; // Import WALK_IN_CUSTOMER_ID
import { format } from 'date-fns';

// Generic CRUD operations
const getCollection = async <T>(collectionName: string, orderByField?: keyof T, orderDirection: 'asc' | 'desc' = 'asc', pageLimit: number = 0, lastVisible?: any): Promise<T[]> => {
  let q = collection(db, collectionName);
  if (orderByField) {
    // @ts-ignore
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

const getDocument = async <T>(collectionName: string, id: string): Promise<T | null> => {
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
export const addCategory = (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => addDocument<Category>('categories', data);
export const updateCategory = (id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => updateDocument<Category>('categories', id, data);
export const deleteCategory = (id: string) => deleteDocument('categories', id);


// Products Service
export const getProducts = () => getCollection<Product>('products', 'name');
export const getProduct = (id: string) => getDocument<Product>('products', id);
export const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => addDocument<Product>('products', data);
export const updateProduct = (id: string, data: Partial<Omit<Product, 'id'| 'createdAt' | 'updatedAt'>>) => updateDocument<Product>('products', id, data);
export const deleteProduct = (id: string) => deleteDocument('products', id);

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

  // 1. Generate Order Number and set Order Date
  const now = new Date();
  const orderNumber = `ORD-${format(now, 'yyyyMMdd-HHmmssSSS')}`;
  
  // Ensure customerId is always set, using WALK_IN_CUSTOMER_ID if necessary
  const finalCustomerId = orderData.customerId || WALK_IN_CUSTOMER_ID;
  const finalCustomerName = orderData.customerName || (finalCustomerId === WALK_IN_CUSTOMER_ID ? "Walk-in Customer" : null);
  const finalCustomerMobile = orderData.customerMobile || (finalCustomerId === WALK_IN_CUSTOMER_ID ? "N/A" : null);

  const newOrderDataWithTimestamp = {
    ...orderData,
    customerId: finalCustomerId,
    customerName: finalCustomerName,
    customerMobile: finalCustomerMobile,
    orderNumber,
    orderDate: Timestamp.fromDate(now),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 2. Create a new order document reference
  const newOrderRef = doc(collection(db, 'orders'));
  batch.set(newOrderRef, newOrderDataWithTimestamp);

  // 3. Decrement stock for each product
  for (const item of itemsToDecrement) {
    const productRef = doc(db, 'products', item.productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const currentStock = productSnap.data().quantity || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      batch.update(productRef, { quantity: newStock, updatedAt: serverTimestamp() });
    } else {
      console.warn(`Product with ID ${item.productId} not found for stock decrement.`);
    }
  }

  // 4. Commit the batch
  await batch.commit();
  return newOrderRef.id;
};
