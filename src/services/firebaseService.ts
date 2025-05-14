
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
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  endBefore,
  limitToLast,
  type FieldValue, // Added FieldValue
} from 'firebase/firestore';
import type { Product, Customer, Category, Order, OrderItemData } from '@/types';
import { WALK_IN_CUSTOMER_ID } from '@/types'; 
import { format } from 'date-fns';

// Generic CRUD operations
const getCollection = async <T extends {id: string}>(
  collectionName: string,
  orderByField?: Extract<keyof T, string> | FieldPath, 
  orderDirection: OrderByDirection = 'asc',
  pageLimit?: number, // Optional: if not provided, fetches all
  startAfterDoc?: QueryDocumentSnapshot | null, // For 'next' page
  endBeforeDoc?: QueryDocumentSnapshot | null // For 'prev' page
): Promise<{ data: T[], firstDoc: QueryDocumentSnapshot | null, lastDoc: QueryDocumentSnapshot | null }> => {
  let q = query(collection(db, collectionName)); 
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }

  if (pageLimit && pageLimit > 0) {
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc), limit(pageLimit));
    } else if (endBeforeDoc) {
      // Firestore's endBefore needs limitToLast to work as expected for previous page
      q = query(q, endBefore(endBeforeDoc), limitToLast(pageLimit));
    } else {
      q = query(q, limit(pageLimit));
    }
  }
  // If no pageLimit, all docs are fetched (existing behavior for non-paginated lists)

  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  
  return {
    data,
    firstDoc: snapshot.docs.length > 0 ? snapshot.docs[0] : null,
    lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
  };
};


const getDocument = async <T extends Record<string, any>>(collectionName: string, id: string): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as unknown as T) : null;
};

const addDocument = async <T extends object>(collectionName: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

const updateDocument = async <T extends object>(collectionName: string, id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>> & { updatedAt?: FieldValue }): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(), // This is fine here as updateDoc expects UpdateData<T>
  });
};

const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, collectionName, id));
};

// Categories Service
// For now, categories are not paginated. If needed, create getCategoriesPaginated
export const getCategories = async (): Promise<Category[]> => {
  const { data } = await getCollection<Category>('categories', 'name');
  return data;
}
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
export const getProducts = async (): Promise<Product[]> => { // Non-paginated version
  const { data } = await getCollection<Product>('products', 'name');
  return data;
}

export const getProductsPaginated = async (
  itemsPerPage: number,
  orderByField: Extract<keyof Product, string> | FieldPath = 'name',
  orderDirection: OrderByDirection = 'asc',
  startAfterDoc?: QueryDocumentSnapshot | null,
  endBeforeDoc?: QueryDocumentSnapshot | null
): Promise<{ products: Product[], firstDoc: QueryDocumentSnapshot | null, lastDoc: QueryDocumentSnapshot | null }> => {
  const { data, firstDoc, lastDoc } = await getCollection<Product>(
    'products', 
    orderByField, 
    orderDirection, 
    itemsPerPage, 
    startAfterDoc,
    endBeforeDoc
  );
  return { products: data, firstDoc, lastDoc };
};


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
// For now, customers are not paginated. If needed, create getCustomersPaginated
export const getCustomers = async (): Promise<Customer[]> => {
  const { data } = await getCollection<Customer>('customers', 'name');
  return data;
}
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
// For now, orders are not paginated. If needed, create getOrdersPaginated
export const getOrders = async (): Promise<Order[]> => {
    const { data } = await getCollection<Order>('orders', 'orderDate', 'desc');
    return data;
}
export const getOrder = (id: string) => getDocument<Order>('orders', id);

export const addOrderAndDecrementStock = async (
  orderData: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt' | 'updatedAt'>,
  itemsToDecrement: { productId: string, quantity: number }[]
): Promise<string> => {
  const batch = writeBatch(db);
  const now = new Date();
  const orderNumber = `ORD-${format(now, 'yyyyMMdd-HHmmssSSS')}`;
  
  const completeOrderData: Omit<Order, 'id'> & { createdAt: FieldValue, updatedAt: FieldValue } = { 
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
      if (currentStock < item.quantity) {
        console.warn(`Stock for product ${item.productId} (${productSnap.data().name}) is ${currentStock}, but trying to decrement by ${item.quantity}. Setting to 0.`);
      }
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
  updatedOrderPayload: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt' | 'updatedAt'>,
  originalOrder: Order 
): Promise<string> => {
  console.log("--- updateOrderAndAdjustStock START ---");
  console.log("Order ID to Update:", orderId);

  const batch = writeBatch(db);
  const orderRef = doc(db, 'orders', orderId);

  const stockAdjustments = new Map<string, number>(); 

  originalOrder.items.forEach(item => {
    stockAdjustments.set(item.productId, (stockAdjustments.get(item.productId) || 0) + item.billQuantity);
  });

  updatedOrderPayload.items.forEach(item => {
    stockAdjustments.set(item.productId, (stockAdjustments.get(item.productId) || 0) - item.billQuantity);
  });

  const productUpdatePromises = Array.from(stockAdjustments.entries()).map(async ([productId, netStockChangeToApply]) => {
    if (netStockChangeToApply === 0) return; 

    const productRef = doc(db, 'products', productId);
    try {
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const currentDBStock = productSnap.data().quantity || 0;
        const newDBStock = currentDBStock + netStockChangeToApply;
        
        if (newDBStock < 0) {
          throw new Error(
            `Insufficient stock for product '${productSnap.data().name || productId}'. ` +
            `Attempting to set stock to ${newDBStock}. ` +
            `Current DB stock is ${currentDBStock}. Order edit requires change of ${-netStockChangeToApply} to billed quantity.`
          );
        }
        batch.update(productRef, { quantity: newDBStock, updatedAt: serverTimestamp() });
      } else {
        if (netStockChangeToApply > 0) { 
             console.warn(`Product ID ${productId} not found. Order update implies returning ${netStockChangeToApply} units. Stock cannot be returned.`);
        } else { 
             throw new Error(`Product ID ${productId} not found. Cannot take stock for non-existent product during order update.`);
        }
      }
    } catch (error) {
      console.error(`Error preparing stock update for product ${productId}:`, error);
      throw error;
    }
  });

  try {
    await Promise.all(productUpdatePromises);
  } catch (error) {
    console.error("Failed during product stock validation for update:", error);
    throw error; 
  }

  const finalOrderUpdateData: Partial<Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'createdAt' | 'updatedAt'>> & { updatedAt: FieldValue } = {
    ...updatedOrderPayload,
    updatedAt: serverTimestamp(),
  };
  
  // id, orderNumber, orderDate, createdAt should not be part of the update payload for an existing document in this manner
  // They are either fixed or handled differently (like updatedAt which is now explicitly a FieldValue)
  // The existing properties from updatedOrderPayload are already spread.

  batch.update(orderRef, finalOrderUpdateData as any); // Cast to any to satisfy batch.update with FieldValue

  await batch.commit();
  console.log("--- updateOrderAndAdjustStock END --- Order update batch committed successfully.");
  return orderId;
};


