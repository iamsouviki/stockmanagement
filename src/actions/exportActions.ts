// src/actions/exportActions.ts
'use server';

import { getOrders } from '@/services/firebaseService';
import type { Order } from '@/types';
import Papa from 'papaparse';
import { format as formatDateFn } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import type { DateRange } from 'react-day-picker';

interface CsvExportRow {
  'Order Number': string;
  'Order Date': string;
  'Customer Name': string;
  'Customer Mobile': string;
  'Customer Address': string;
  'Item Name': string;
  'Item SN/Barcode': string;
  'Item Price (INR)': string;
  'Item Quantity': number;
  'Item Subtotal (INR)': string;
  'Order Subtotal (INR)': string;
  'Order Tax (INR)': string;
  'Order Total (INR)': string;
}

const formatDateForExport = (dateValue: Timestamp | Date | string | undefined | null): string => {
  if (!dateValue) return 'N/A';
  let dateToFormat: Date;
  if (dateValue instanceof Date) {
    dateToFormat = dateValue;
  } else if (typeof (dateValue as any)?.toDate === 'function') { // Firestore Timestamp
    dateToFormat = (dateValue as any).toDate();
  } else if (typeof dateValue === 'string') {
    dateToFormat = new Date(dateValue);
  } else {
    return 'Invalid Date';
  }
  if (isNaN(dateToFormat.getTime())) return 'Invalid Date';
  return formatDateFn(dateToFormat, 'yyyy-MM-dd HH:mm:ss');
};

export async function exportOrdersToCsv(dateRange?: DateRange): Promise<string> {
  try {
    const allOrders = await getOrders(); // This fetches all orders sorted by date desc

    const filteredOrders = allOrders.filter(order => {
      if (!dateRange?.from) return true; // No date filter if 'from' is not set

      const orderDateObj = order.orderDate instanceof Date 
        ? order.orderDate 
        : (order.orderDate as Timestamp)?.toDate 
          ? (order.orderDate as Timestamp).toDate() 
          : new Date(order.orderDate as any);

      if (isNaN(orderDateObj.getTime())) return false;

      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return orderDateObj >= fromDate && orderDateObj <= toDate;
      }
      return orderDateObj >= fromDate;
    });

    const csvData: CsvExportRow[] = [];

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        csvData.push({
          'Order Number': order.orderNumber,
          'Order Date': formatDateForExport(order.orderDate),
          'Customer Name': order.customerName,
          'Customer Mobile': order.customerMobile,
          'Customer Address': order.customerAddress || 'N/A',
          'Item Name': item.name,
          'Item SN/Barcode': item.serialNumber || item.barcode || 'N/A',
          'Item Price (INR)': item.price.toFixed(2),
          'Item Quantity': item.billQuantity,
          'Item Subtotal (INR)': (item.price * item.billQuantity).toFixed(2),
          'Order Subtotal (INR)': order.subtotal.toFixed(2),
          'Order Tax (INR)': order.taxAmount.toFixed(2),
          'Order Total (INR)': order.totalAmount.toFixed(2),
        });
      });
    });

    if (csvData.length === 0) {
      return ''; // Return empty string if no data to export
    }

    return Papa.unparse(csvData);
  } catch (error) {
    console.error("Error exporting orders to CSV:", error);
    throw new Error("Failed to export orders.");
  }
}
