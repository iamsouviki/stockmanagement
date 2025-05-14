
// src/lib/pdfGenerator.ts
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Order, StoreDetails } from '@/types';
import { Timestamp } from 'firebase/firestore';


function formatDateForPdf(dateValue: Timestamp | string | Date | undefined | null) {
  if (!dateValue) return 'N/A';
  let dateToFormat: Date;

  if (dateValue instanceof Timestamp) {
    try {
      dateToFormat = dateValue.toDate();
    } catch (e) {
      console.error("Error converting Firestore Timestamp to Date:", e, dateValue);
      return 'Invalid Date';
    }
  } else if (dateValue instanceof Date) {
    dateToFormat = dateValue;
  } else if (typeof dateValue === 'string') {
    dateToFormat = new Date(dateValue);
  } else {
    console.warn("Unknown date type in formatDateForPdf:", dateValue);
    return 'N/A';
  }

  try {
    // Check if the resulting date is valid before formatting
    if (isNaN(dateToFormat.getTime())) {
      console.warn("Invalid date created in formatDateForPdf:", dateValue, "Resulted in:", dateToFormat);
      return 'Invalid Date';
    }
    return format(dateToFormat, 'MMM dd, yyyy HH:mm:ss');
  } catch (e) {
    console.error("Error formatting date in formatDateForPdf:", e, dateToFormat);
    return 'Error Date';
  }
}


export function generateInvoicePdf(
  order: Order,
  storeDetails: StoreDetails,
) {
  // Initialize jsPDF for A4 portrait, using mm as units
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10; // 10mm margin
  const contentWidth = pageWidth - (margin * 2); // 190mm for A4
  let yPos = margin;
  const taxRate = 0.18; // 18% GST

  // --- Store Header ---
  doc.setFontSize(18); 
  doc.setFont('helvetica', 'bold');
  doc.text(storeDetails.name, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.setFontSize(9); 
  doc.setFont('helvetica', 'normal');
  doc.text(storeDetails.storeType, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8; 

  // --- Store Address and Contact ---
  doc.setFontSize(8); 
  const storeAddressLines = doc.splitTextToSize(storeDetails.address, contentWidth / 2 - 5);
  doc.text(storeAddressLines, margin, yPos);
  
  const contactLines = doc.splitTextToSize(storeDetails.contact, contentWidth / 2 - 5);
  doc.text(contactLines, pageWidth - margin, yPos, { align: 'right' });
  
  doc.setFontSize(8); // Ensure font size is set before calling getLineHeight
  const lineHeightForSize8 = doc.getLineHeight();
  const addressHeight = (storeAddressLines.length * lineHeightForSize8);
  const contactHeight = (contactLines.length * lineHeightForSize8);
  yPos += Math.max(addressHeight, contactHeight) + 2;

  doc.text(`GSTIN: ${storeDetails.gstNo}`, margin, yPos);
  yPos += 5; 

  // Line below store details
  doc.setLineWidth(0.3); 
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6; 

  // --- Invoice Title ---
  doc.setFontSize(14); 
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7; 

  // --- Order and Customer Info ---
  doc.setFontSize(9); 
  doc.setFont('helvetica', 'normal');
  doc.text(`Order No: ${order.orderNumber}`, margin, yPos);
  doc.text(`Date: ${formatDateForPdf(order.orderDate)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;

  doc.text(`Customer: ${order.customerName || 'N/A'}`, margin, yPos);
  yPos += 5;

  doc.text(`Mobile: ${order.customerMobile || 'N/A'}`, margin, yPos);
  yPos += 5;

  if (order.customerAddress) {
    doc.setFontSize(8); 
    const addressText = `Address: ${order.customerAddress}`;
    const customerAddressLines = doc.splitTextToSize(addressText, contentWidth); 
    doc.text(customerAddressLines, margin, yPos);
    doc.setFontSize(8); // Ensure font size is set before calling getLineHeight
    const customerAddressHeight = customerAddressLines.length * doc.getLineHeight();
    yPos += customerAddressHeight + 2;
    doc.setFontSize(9); 
  } else {
    doc.text(`Address: N/A`, margin, yPos);
    yPos += 5;
  }
  yPos += 2; 

  // --- Column definitions for A4 (in mm) ---
  // Adjusted widths to prevent overflow, especially for price/subtotal columns
  const productColWidth = contentWidth * 0.28;    // Was 0.30
  const snBarcodeColWidth = contentWidth * 0.18;  // Was 0.20
  const qtyColWidth = contentWidth * 0.08;        // Unchanged
  const priceColWidth = contentWidth * 0.23;      // Was 0.20
  const itemSubtotalColWidth = contentWidth * 0.23; // Was 0.22
  
  // No paddingBetweenCols needed if widths sum to contentWidth

  const colStartX = {
    productName: margin,
    snBarcode: margin + productColWidth,
    qty: margin + productColWidth + snBarcodeColWidth,
    price: margin + productColWidth + snBarcodeColWidth + qtyColWidth,
    subtotal: margin + productColWidth + snBarcodeColWidth + qtyColWidth + priceColWidth,
  };
  
  const drawTableHeaders = () => {
    yPos += 1; 
    doc.setLineWidth(0.1);
    doc.line(margin, yPos, pageWidth - margin, yPos); 
    yPos += 4; 

    doc.setFontSize(9); 
    doc.setFont('helvetica', 'bold');

    doc.text('Product Name', colStartX.productName + 1, yPos); // Added small padding for left-aligned
    doc.text('SN/Barcode', colStartX.snBarcode + 1, yPos); // Added small padding for left-aligned
    doc.text('Qty', colStartX.qty + qtyColWidth / 2, yPos, { align: 'center' }); 
    doc.text('Price', colStartX.price + priceColWidth - 1, yPos, { align: 'right' }); // Keep right alignment
    doc.text('Subtotal', colStartX.subtotal + itemSubtotalColWidth - 1, yPos, { align: 'right' }); // Keep right alignment
    
    doc.setFontSize(9); 
    yPos += doc.getLineHeight(); 
    yPos += 2; 
    doc.line(margin, yPos, pageWidth - margin, yPos); 
    yPos += 3; 
    doc.setFont('helvetica', 'normal'); 
    doc.setFontSize(8); 
  };

  drawTableHeaders();

  // --- Table Items ---
  doc.setFontSize(8); 
  order.items.forEach((item) => {
    doc.setFontSize(8); 
    const itemLineHeight = doc.getLineHeight(); 
    const productNameLines = doc.splitTextToSize(item.name, productColWidth - 2); 
    const snBarcodeText = item.serialNumber || item.barcode || 'N/A';
    const snBarcodeLines = doc.splitTextToSize(snBarcodeText, snBarcodeColWidth - 2); 
    const maxLinesPerItem = Math.max(productNameLines.length, snBarcodeLines.length, 1);
    const itemBlockHeight = maxLinesPerItem * itemLineHeight + 2; 

    if (yPos + itemBlockHeight > pageHeight - (margin + 35)) { 
      doc.addPage();
      yPos = margin;
      drawTableHeaders(); 
      doc.setFontSize(8); 
    }
    const currentItemY = yPos;

    doc.text(productNameLines, colStartX.productName + 1, currentItemY); 
    doc.text(snBarcodeLines, colStartX.snBarcode + 1, currentItemY); 

    doc.text(item.billQuantity.toString(), colStartX.qty + qtyColWidth / 2, currentItemY, { align: 'center' }); 
    // Use Unicode for Rupee symbol and ensure correct alignment/padding
    doc.text(`\u20B9${(item.price).toFixed(2)}`, colStartX.price + priceColWidth - 2 , currentItemY, { align: 'right' });  // Adjusted padding
    doc.text(`\u20B9${(item.price * item.billQuantity).toFixed(2)}`, colStartX.subtotal + itemSubtotalColWidth - 2, currentItemY, { align: 'right' }); // Adjusted padding
    
    yPos += itemBlockHeight;
  });

  // --- Summary Section ---
  const summarySectionHeight = 35; 
  if (yPos + summarySectionHeight > pageHeight - margin) {
    doc.addPage();
    yPos = margin;
  }

  yPos += 5; 
  const summaryLabelX = margin + contentWidth * 0.55; 
  const summaryValueX = pageWidth - margin - 2; // Adjusted padding for summary values

  doc.setLineWidth(0.1);
  doc.line(margin, yPos, pageWidth - margin, yPos); 
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryLabelX, yPos, { align: 'left' });
  doc.text(`\u20B9${order.subtotal.toFixed(2)}`, summaryValueX, yPos, { align: 'right' });
  yPos += 5;
  doc.text(`GST (${(taxRate * 100).toFixed(0)}%):`, summaryLabelX, yPos, { align: 'left' });
  doc.text(`\u20B9${order.taxAmount.toFixed(2)}`, summaryValueX, yPos, { align: 'right' });
  yPos += 5;

  doc.setFontSize(10); 
  doc.setFont('helvetica', 'bold');
  doc.line(summaryLabelX - 2 , yPos, pageWidth - margin, yPos); 
  yPos += 5;
  doc.text('Total Amount:', summaryLabelX, yPos, { align: 'left' });
  doc.text(`\u20B9${order.totalAmount.toFixed(2)}`, summaryValueX, yPos, { align: 'right' });
  yPos += 10; 

  // --- Footer ---
  const footerY = pageHeight - (margin / 2) - 3; 
  doc.setFontSize(7); 
  doc.setFont('helvetica', 'italic');
  const pageCount = doc.internal.pages.length; 
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, margin, footerY, {align: 'left'});
    doc.text(`Thank you for your business! - Generated by ${storeDetails.name}`, pageWidth / 2, footerY, { align: 'center' });
  }

  doc.autoPrint({variant: 'non-conform'});
  doc.output('dataurlnewwindow', { filename: `${storeDetails.name.replace(/\s+/g, '_')}-Bill-${order.orderNumber}.pdf` });
}

