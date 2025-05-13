// src/lib/pdfGenerator.ts
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Order, StoreDetails } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { WALK_IN_CUSTOMER_ID } from '@/types';

function formatDateForPdf(dateValue: Timestamp | string | Date | undefined) {
  if (!dateValue) return 'N/A';
  let dateToFormat: Date;
  if (dateValue instanceof Timestamp) {
    dateToFormat = dateValue.toDate();
  } else if (typeof dateValue === 'string') {
    dateToFormat = new Date(dateValue);
  } else if (dateValue instanceof Date) {
    dateToFormat = dateValue;
  } else {
    return 'N/A';
  }
  return format(dateToFormat, 'MMM dd, yyyy HH:mm:ss');
}


export function generateInvoicePdf(
  order: Order,
  storeDetails: StoreDetails,
) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  let yPos = margin;
  const taxRate = 0.18; // 18% GST

  // Store Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(storeDetails.name, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(storeDetails.storeType, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Store Address and Contact
  doc.setFontSize(9);
  doc.text(storeDetails.address, margin, yPos);
  doc.text(storeDetails.contact, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  doc.text(`GSTIN: ${storeDetails.gstNo}`, margin, yPos);
  yPos += 5; 

  // Line below store details
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 7; 

  // Invoice Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8; 

  // Order and Customer Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order No: ${order.orderNumber}`, margin, yPos);
  doc.text(`Date: ${formatDateForPdf(order.orderDate)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  const customerIdentifier = order.customerId === WALK_IN_CUSTOMER_ID || !order.customerName
    ? 'Walk-in Customer'
    : `${order.customerName} (${order.customerMobile || 'N/A'})`;
  doc.text(`Customer: ${customerIdentifier}`, margin, yPos);
  yPos += 8; 

  // Column definitions
  const paddingBetweenCols = 5;
  const productColWidth = 65;
  const snBarcodeColWidth = 45;
  const qtyColWidth = 20;
  const priceColWidth = 30;
  // Subtotal width will be remaining space

  const colStartX = {
    productName: margin,
    snBarcode: margin + productColWidth + paddingBetweenCols,
    qty: margin + productColWidth + paddingBetweenCols + snBarcodeColWidth + paddingBetweenCols,
    price: margin + productColWidth + paddingBetweenCols + snBarcodeColWidth + paddingBetweenCols + qtyColWidth + paddingBetweenCols,
    subtotal: margin + productColWidth + paddingBetweenCols + snBarcodeColWidth + paddingBetweenCols + qtyColWidth + paddingBetweenCols + priceColWidth + paddingBetweenCols
  };
  
  // Table Headers
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos); // Line above table headers
  yPos += 5; // Padding before header text

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  doc.text('Product Name', colStartX.productName, yPos);
  doc.text('SN/Barcode', colStartX.snBarcode, yPos);
  doc.text('Qty', colStartX.qty + qtyColWidth, yPos, { align: 'right' });
  doc.text('Price', colStartX.price + priceColWidth, yPos, { align: 'right' });
  doc.text('Subtotal', pageWidth - margin, yPos, { align: 'right' }); 
  
  // Increment yPos by the height of the header text line
  yPos += (doc.getLineHeight() / doc.internal.scaleFactor); 
  
  yPos += 2; // Padding after header text
  doc.line(margin, yPos, pageWidth - margin, yPos); // Line below table headers
  yPos += 4; // Space before first item

  // Table Items
  doc.setFont('helvetica', 'normal');
  order.items.forEach((item) => {
    if (yPos > pageHeight - 45) { 
      doc.addPage();
      yPos = margin;
      // Optionally redraw headers (can be complex; for now, just reset yPos)
      // To redraw headers:
      // doc.setLineWidth(0.2);
      // doc.line(margin, yPos, pageWidth - margin, yPos); yPos += 5;
      // doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      // doc.text('Product Name', colStartX.productName, yPos); /* ... other headers ... */
      // yPos += (doc.getLineHeight() / doc.internal.scaleFactor); yPos += 2;
      // doc.line(margin, yPos, pageWidth - margin, yPos); yPos += 4;
      // doc.setFont('helvetica', 'normal'); // Reset font for items
    }
    const itemSubtotal = item.price * item.billQuantity;

    const productNameLines = doc.splitTextToSize(item.name, productColWidth);
    doc.text(productNameLines, colStartX.productName, yPos);
    
    const snBarcodeText = item.serialNumber || item.barcode || 'N/A';
    const snBarcodeLines = doc.splitTextToSize(snBarcodeText, snBarcodeColWidth);
    doc.text(snBarcodeLines, colStartX.snBarcode, yPos);

    doc.text(item.billQuantity.toString(), colStartX.qty + qtyColWidth, yPos, { align: 'right' });
    doc.text(`₹${item.price.toFixed(2)}`, colStartX.price + priceColWidth, yPos, { align: 'right' });
    doc.text(`₹${itemSubtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    
    const lineCount = Math.max(productNameLines.length, snBarcodeLines.length, 1); // Ensure at least 1 line for height calculation
    const textBlockHeight = lineCount * (doc.getLineHeight() / doc.internal.scaleFactor);
    yPos += textBlockHeight + 3; // Add padding below item row
  });

  // Summary Section
  yPos += 5; 
  const summaryX = pageWidth - margin - 60; 
  doc.line(summaryX - 10, yPos, pageWidth - margin, yPos); 
  yPos += 5;

  doc.setFontSize(10);
  doc.text('Subtotal:', summaryX, yPos, { align: 'right' });
  doc.text(`₹${order.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`GST (${(taxRate * 100).toFixed(0)}%):`, summaryX, yPos, { align: 'right' });
  doc.text(`₹${order.taxAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.line(summaryX - 10, yPos, pageWidth - margin, yPos); 
  yPos += 6;
  doc.text('Total Amount:', summaryX, yPos, { align: 'right' });
  doc.text(`₹${order.totalAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 15;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business! - Generated by StockPilot', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Auto print
  doc.autoPrint({variant: 'non-conform'});
  doc.output('dataurlnewwindow', { filename: `StockPilot-Bill-${order.orderNumber}.pdf` });
}
