// src/lib/pdfGenerator.ts
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Order, StoreDetails } from '@/types';
import { Timestamp } from 'firebase/firestore';
// import { WALK_IN_CUSTOMER_ID } from '@/types'; // Not directly needed here as order object has resolved names

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

  // Customer Name and Mobile
  doc.text(`Customer: ${order.customerName}`, margin, yPos);
  const customerMobileText = `Mobile: ${order.customerMobile}`;
  
  // Attempt to place mobile next to name if space allows
  const customerNameWidth = doc.getTextWidth(`Customer: ${order.customerName}`);
  const mobileTextWidth = doc.getTextWidth(customerMobileText);
  const availableSpaceForMobile = pageWidth - (margin * 2) - customerNameWidth - 5; // 5 for padding

  if (mobileTextWidth < availableSpaceForMobile) {
    doc.text(customerMobileText, margin + customerNameWidth + 5, yPos);
  } else { // If not enough space, put mobile on new line
    yPos += 6;
    doc.text(customerMobileText, margin, yPos);
  }
  yPos += 6;


  // Customer Address (if available)
  if (order.customerAddress) {
    const addressLines = doc.splitTextToSize(`Address: ${order.customerAddress}`, pageWidth - (margin * 2));
    doc.text(addressLines, margin, yPos);
    yPos += (addressLines.length * (doc.getLineHeight('helvetica', 'normal', 10) / doc.internal.scaleFactor)) + 2; // +2 for padding
  } else {
    doc.text(`Address: N/A`, margin, yPos);
    yPos += 6;
  }
  yPos += 2; // Extra space before table

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
    subtotal: pageWidth - margin // Subtotal will be right aligned to page margin
  };
  
  const drawTableHeaders = () => {
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos); 
    yPos += 5; 

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    doc.text('Product Name', colStartX.productName, yPos);
    doc.text('SN/Barcode', colStartX.snBarcode, yPos);
    doc.text('Qty', colStartX.qty + qtyColWidth, yPos, { align: 'right' });
    doc.text('Price', colStartX.price + priceColWidth, yPos, { align: 'right' });
    doc.text('Subtotal', colStartX.subtotal, yPos, { align: 'right' }); 
    
    yPos += (doc.getLineHeight('helvetica', 'bold', 10) / doc.internal.scaleFactor); 
    yPos += 2; 
    doc.line(margin, yPos, pageWidth - margin, yPos); 
    yPos += 4; 
    doc.setFont('helvetica', 'normal'); // Reset font for items
  };

  drawTableHeaders();

  // Table Items
  order.items.forEach((item) => {
    if (yPos > pageHeight - 45) { // Check for page break
      doc.addPage();
      yPos = margin;
      drawTableHeaders(); // Redraw headers on new page
    }
    const itemSubtotal = item.price * item.billQuantity;

    const productNameLines = doc.splitTextToSize(item.name, productColWidth);
    doc.text(productNameLines, colStartX.productName, yPos);
    
    const snBarcodeText = item.serialNumber || item.barcode || 'N/A';
    const snBarcodeLines = doc.splitTextToSize(snBarcodeText, snBarcodeColWidth);
    doc.text(snBarcodeLines, colStartX.snBarcode, yPos);

    doc.text(item.billQuantity.toString(), colStartX.qty + qtyColWidth, yPos, { align: 'right' });
    doc.text(`₹${item.price.toFixed(2)}`, colStartX.price + priceColWidth, yPos, { align: 'right' });
    doc.text(`₹${itemSubtotal.toFixed(2)}`, colStartX.subtotal, yPos, { align: 'right' });
    
    const lineCount = Math.max(productNameLines.length, snBarcodeLines.length, 1); 
    const textBlockHeight = lineCount * (doc.getLineHeight('helvetica', 'normal', 10) / doc.internal.scaleFactor);
    yPos += textBlockHeight + 3; 
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

