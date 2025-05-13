
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
  type FieldPath, 
  type OrderByDirection, 
} from 'firebase/firestore';
import type { Product, Customer, Category, Order, OrderItemData } from '@/types';
import { WALK_IN_CUSTOMER_ID } from '@/types'; 
import { format } from 'date-fns';

// Generic CRUD operations
const getCollection = async <T extends Record<string, any>>(
  collectionName: string,
  orderByField?: Extract<keyof T, string> | FieldPath, 
  orderDirection: OrderByDirection = 'asc',
  pageLimit: number = 0,
  lastVisible?: any
): Promise<T[]> => {
  let q = query(collection(db, collectionName)); 
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }
  if (pageLimit > 0) {
    q = query(q, limit(pageLimit));
  }
  if (lastVisible) {
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
  // For immediate use, we create a client-side timestamp. Firestore will override with serverTimestamp.
  const now = Timestamp.now();
  return { id, ...data, createdAt: now, updatedAt: now }; 
};
export const updateCategory = (id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => updateDocument<Category>('categories', id, data);
export const deleteCategory = (id: string) => deleteDocument('categories', id);

export const findCategoryByNameOrCreate = async (name: string): Promise<Category> => {
  const trimmedName = name.trim();
  const allCategories = await getCategories(); 
  const existingCategory = allCategories.find(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());

  if (existingCategory) {
    return existingCategory;
  } else {
    const newCategoryData = { name: trimmedName };
    return addCategory(newCategoryData); 
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
  
  const completeOrderData = { 
    ...orderData, 
    orderNumber,
    orderDate: Timestamp.fromDate(now),
    createdAt: serverTimestamp(), 
    updatedAt: serverTimestamp(), 
  };

  const newOrderRef = doc(collection(db, 'orders'));
  batch.set(newOrderRef, completeOrderData);

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

  await batch.commit();
  return newOrderRef.id;
};


export const updateOrderAndAdjustStock = async (
  orderId: string,
  updatedOrderPayload: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const batch = writeBatch(db);
  const orderRef = doc(db, 'orders', orderId);

  const originalOrder = await getOrder(orderId);
  if (!originalOrder) {
    throw new Error(`Order with ID ${orderId} not found for update.`);
  }

  const stockAdjustments = new Map<string, number>(); // productId -> netStockChange

  // 1. Calculate stock to be "returned" from original items based on their billQuantity
  originalOrder.items.forEach(originalItem => {
    stockAdjustments.set(
      originalItem.productId,
      (stockAdjustments.get(originalItem.productId) || 0) + originalItem.billQuantity
    );
  });

  // 2. Calculate stock to be "taken" for updated items based on their billQuantity
  updatedOrderPayload.items.forEach(updatedItem => {
    stockAdjustments.set(
      updatedItem.productId,
      (stockAdjustments.get(updatedItem.productId) || 0) - updatedItem.billQuantity
    );
  });
  
  // 3. Prepare product stock updates after fetching current stock for validation
  const productUpdatePromises: Promise<void>[] = [];

  for (const [productId, netChange] of stockAdjustments.entries()) {
    if (netChange === 0) continue; 

    const productRef = doc(db, 'products', productId);
    productUpdatePromises.push(
      getDoc(productRef).then(productSnap => {
        if (productSnap.exists()) {
          const currentStock = productSnap.data().quantity || 0;
          const newStock = currentStock + netChange; 

          if (newStock < 0) {
            throw new Error(`Insufficient stock for product ${productSnap.data().name || productId} after update. Calculated stock would be ${newStock}. Current DB stock: ${currentStock}, Net change attempted: ${netChange}.`);
          }
          batch.update(productRef, { quantity: newStock, updatedAt: serverTimestamp() });
        } else {
          if (netChange < 0) { 
             throw new Error(`Product with ID ${productId} not found, cannot decrement stock for non-existent product.`);
          }
          console.warn(`Product with ID ${productId} not found during stock adjustment for order update (netChange: ${netChange}). Stock not 'returned' as product doc is missing.`);
        }
      }).catch(error => {
        // Catch errors from getDoc or inside .then() for individual product processing
        console.error(`Error processing stock for product ${productId}:`, error);
        throw error; // Re-throw to stop the batch if a critical error occurs (like insufficient stock)
      })
    );
  }

  // Wait for all product stock fetches and validations to complete
  await Promise.all(productUpdatePromises);

  // 4. Update the order document itself
  const finalOrderUpdatePayload = {
    ...updatedOrderPayload, // This includes new items, customer details, totals from client
    updatedAt: serverTimestamp(),
    orderNumber: originalOrder.orderNumber, // Preserve original order number
    orderDate: originalOrder.orderDate,     // Preserve original order date
  };
  batch.update(orderRef, finalOrderUpdatePayload);

  await batch.commit();
  return orderId;
};
