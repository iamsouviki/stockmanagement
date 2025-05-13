
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
const getCollection = async <T extends {id: string}>(
  collectionName: string,
  orderByField?: Extract<keyof T, string> | FieldPath, 
  orderDirection: OrderByDirection = 'asc',
  pageLimit: number = 0,
  lastVisibleDoc?: any // Firestore DocumentSnapshot for pagination
): Promise<T[]> => {
  let q = query(collection(db, collectionName)); 
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }
  if (pageLimit > 0) {
    q = query(q, limit(pageLimit));
  }
  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc));
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
  const now = Timestamp.now();
  return { id, ...data, createdAt: now, updatedAt: now }; 
};
export const updateCategory = (id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => updateDocument<Category>('categories', id, data);
export const deleteCategory = (id: string) => deleteDocument('categories', id);

export const findCategoryByNameOrCreate = async (name: string): Promise<Category> => {
  const trimmedName = name.trim();
  const q = query(collection(db, 'categories'), where('name', '==', trimmedName), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Category;
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
    orderDate: Timestamp.fromDate(now), // Server timestamp for orderDate
    createdAt: serverTimestamp(), 
    updatedAt: serverTimestamp(), 
  };

  const newOrderRef = doc(collection(db, 'orders')); // Generate new doc ref for the order
  batch.set(newOrderRef, completeOrderData);

  for (const item of itemsToDecrement) {
    const productRef = doc(db, 'products', item.productId);
    // It's better to use a transaction or a server-side function for decrementing stock
    // to avoid race conditions, but for client-side batch:
    const productSnap = await getDoc(productRef); // Fetch current stock *before* batch commit
    if (productSnap.exists()) {
      const currentStock = productSnap.data().quantity || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      if (currentStock < item.quantity) {
        console.warn(`Stock for product ${item.productId} (${productSnap.data().name}) is ${currentStock}, but trying to decrement by ${item.quantity}. Setting to 0.`);
      }
      batch.update(productRef, { quantity: newStock, updatedAt: serverTimestamp() });
    } else {
      console.warn(`Product with ID ${item.productId} not found for stock decrement.`);
      // Potentially throw error here if strict stock control is needed
      // throw new Error(`Product with ID ${item.productId} not found, cannot create order.`);
    }
  }

  await batch.commit();
  return newOrderRef.id;
};


export const updateOrderAndAdjustStock = async (
  orderId: string,
  updatedOrderPayload: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt' | 'updatedAt'>,
  originalOrder: Order // Crucial for calculating stock differences
): Promise<string> => {
  console.log("updateOrderAndAdjustStock called for orderId:", orderId);
  console.log("Original Order:", JSON.stringify(originalOrder, null, 2));
  console.log("Updated Payload:", JSON.stringify(updatedOrderPayload, null, 2));

  const batch = writeBatch(db);
  const orderRef = doc(db, 'orders', orderId);

  // 1. Calculate net stock changes for each product
  const stockAdjustments = new Map<string, number>(); // productId -> quantity adjustment (positive adds to stock, negative subtracts)

  // Add back quantities from original order items
  originalOrder.items.forEach(item => {
    stockAdjustments.set(item.productId, (stockAdjustments.get(item.productId) || 0) + item.billQuantity);
  });
  console.log("Stock adjustments after returning original items:", JSON.stringify(Object.fromEntries(stockAdjustments)));


  // Subtract quantities for updated order items
  updatedOrderPayload.items.forEach(item => {
    stockAdjustments.set(item.productId, (stockAdjustments.get(item.productId) || 0) - item.billQuantity);
  });
  console.log("Net stock adjustments (negative means stock decrease, positive means stock increase):", JSON.stringify(Object.fromEntries(stockAdjustments)));


  // 2. Prepare product stock updates within the batch
  const productUpdatePromises = Array.from(stockAdjustments.entries()).map(async ([productId, netQuantityChange]) => {
    if (netQuantityChange === 0) return; // No change for this product

    const productRef = doc(db, 'products', productId);
    try {
      const productSnap = await getDoc(productRef); // Get current DB stock
      if (productSnap.exists()) {
        const currentDBStock = productSnap.data().quantity || 0;
        const newDBStock = currentDBStock - netQuantityChange; // If netQuantityChange is negative (stock taken), this subtracts. If positive (stock returned), this adds.
        
        console.log(`Product ID: ${productId}, Name: ${productSnap.data().name}, Current DB Stock: ${currentDBStock}, Net Change from Order: ${netQuantityChange}, New DB Stock: ${newDBStock}`);

        if (newDBStock < 0) {
          throw new Error(
            `Insufficient stock for product '${productSnap.data().name || productId}'. ` +
            `Required change: ${-netQuantityChange}, but would result in stock of ${newDBStock}. ` +
            `Current DB stock is ${currentDBStock}.`
          );
        }
        batch.update(productRef, { quantity: newDBStock, updatedAt: serverTimestamp() });
      } else {
        // If product was deleted, and we are trying to decrement stock (netQuantityChange > 0 effectively)
        if (netQuantityChange > 0) { // This means updated order has FEWER items than original, or item removed
            // This is effectively trying to return stock to a non-existent product. Log, but don't fail.
             console.warn(`Product ID ${productId} not found, but order update implies returning ${netQuantityChange} units. Stock cannot be returned to non-existent product.`);
        } else { // netQuantityChange < 0, trying to take stock for a non-existent product
             throw new Error(`Product ID ${productId} not found. Cannot take stock for non-existent product during order update.`);
        }
      }
    } catch (error) {
      console.error(`Error preparing stock update for product ${productId}:`, error);
      throw error; // Re-throw to fail the batch
    }
  });

  // Wait for all product document reads and batch update preparations
  try {
    await Promise.all(productUpdatePromises);
  } catch (error) {
    console.error("Failed during product stock validation for update:", error);
    throw error; // Propagate error to prevent batch commit
  }


  // 3. Update the order document itself
  // Preserve original orderNumber and orderDate. createdAt is never changed.
  const finalOrderUpdateData = {
    ...updatedOrderPayload, // This includes new items, customer details, totals
    // orderNumber: originalOrder.orderNumber, // Retain original order number
    // orderDate: originalOrder.orderDate,     // Retain original order date
    updatedAt: serverTimestamp(),
  };
  // Ensure read-only fields are not accidentally included if they came from payload
  delete (finalOrderUpdateData as any).id;
  delete (finalOrderUpdateData as any).orderNumber; // Should be immutable after creation
  delete (finalOrderUpdateData as any).orderDate;   // Should be immutable after creation
  delete (finalOrderUpdateData as any).createdAt; // Should be immutable

  batch.update(orderRef, finalOrderUpdateData);
  console.log("Order document update prepared for batch:", JSON.stringify(finalOrderUpdateData, null, 2));

  await batch.commit();
  console.log("Order update batch committed successfully.");
  return orderId;
};