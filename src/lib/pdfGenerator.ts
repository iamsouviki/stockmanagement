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
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;
  const taxRate = 0.18; // 18% GST

  // --- Store Header ---
  doc.setFontSize(18); // Slightly reduced for A4
  doc.setFont('helvetica', 'bold');
  doc.text(storeDetails.name, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;
  doc.setFontSize(9); // Reduced for A4
  doc.setFont('helvetica', 'normal');
  doc.text(storeDetails.storeType, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8; // Increased spacing a bit

  // --- Store Address and Contact ---
  doc.setFontSize(8); // Reduced for A4
  const storeAddressLines = doc.splitTextToSize(storeDetails.address, contentWidth / 2 - 5);
  doc.text(storeAddressLines, margin, yPos);
  
  const contactLines = doc.splitTextToSize(storeDetails.contact, contentWidth / 2 - 5);
  doc.text(contactLines, pageWidth - margin, yPos, { align: 'right' });
  
  const addressHeight = (storeAddressLines.length * (doc.getLineHeight('helvetica', 'normal', 8) / doc.internal.scaleFactor));
  const contactHeight = (contactLines.length * (doc.getLineHeight('helvetica', 'normal', 8) / doc.internal.scaleFactor));
  yPos += Math.max(addressHeight, contactHeight) + 2;

  doc.text(`GSTIN: ${storeDetails.gstNo}`, margin, yPos);
  yPos += 5; 

  // Line below store details
  doc.setLineWidth(0.3); // Slightly thinner line
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6; 

  // --- Invoice Title ---
  doc.setFontSize(14); // Reduced for A4
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 7; 

  // --- Order and Customer Info ---
  doc.setFontSize(9); // Reduced for A4
  doc.setFont('helvetica', 'normal');
  doc.text(`Order No: ${order.orderNumber}`, margin, yPos);
  doc.text(`Date: ${formatDateForPdf(order.orderDate)}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;

  doc.text(`Customer: ${order.customerName || 'N/A'}`, margin, yPos);
  yPos += 5;

  doc.text(`Mobile: ${order.customerMobile || 'N/A'}`, margin, yPos);
  yPos += 5;

  if (order.customerAddress) {
    doc.setFontSize(8); // Smaller for address
    const addressText = `Address: ${order.customerAddress}`;
    const customerAddressLines = doc.splitTextToSize(addressText, contentWidth); // Allow full width for customer address
    doc.text(customerAddressLines, margin, yPos);
    const customerAddressHeight = (customerAddressLines.length * (doc.getLineHeight('helvetica', 'normal', 8) / doc.internal.scaleFactor));
    yPos += customerAddressHeight + 2;
    doc.setFontSize(9); // Reset font size
  } else {
    doc.text(`Address: N/A`, margin, yPos);
    yPos += 5;
  }
  yPos += 2; // Extra padding before table headers

  // --- Column definitions for A4 (in mm) ---
  const paddingBetweenCols = 3; // mm
  const qtyColWidth = 15; // mm
  const priceColWidth = 25; // mm
  const itemSubtotalColWidth = 25; // mm
  // Remaining width for Product Name and SN/Barcode
  const fixedColsWidth = qtyColWidth + priceColWidth + itemSubtotalColWidth + (paddingBetweenCols * 4); // 4 gaps for 5 columns
  const remainingWidthForDynamicCols = contentWidth - fixedColsWidth;
  const productColWidth = Math.floor(remainingWidthForDynamicCols * 0.6); // 60% for product name
  const snBarcodeColWidth = Math.floor(remainingWidthForDynamicCols * 0.4); // 40% for SN/Barcode

  const colStartX = {
    productName: margin,
    snBarcode: margin + productColWidth + paddingBetweenCols,
    qty: margin + productColWidth + paddingBetweenCols + snBarcodeColWidth + paddingBetweenCols,
    price: margin + productColWidth + paddingBetweenCols + snBarcodeColWidth + paddingBetweenCols + qtyColWidth + paddingBetweenCols,
    subtotal: pageWidth - margin - itemSubtotalColWidth // Align from right
  };
  
  const drawTableHeaders = () => {
    yPos += 1; 
    doc.setLineWidth(0.1);
    doc.line(margin, yPos, pageWidth - margin, yPos); 
    yPos += 4; 

    doc.setFontSize(9); // Header font size
    doc.setFont('helvetica', 'bold');

    doc.text('Product Name', colStartX.productName, yPos);
    doc.text('SN/Barcode', colStartX.snBarcode, yPos);
    doc.text('Qty', colStartX.qty + qtyColWidth / 2, yPos, { align: 'center' }); // Center align qty header
    doc.text('Price', colStartX.price + priceColWidth, yPos, { align: 'right' });
    doc.text('Subtotal', colStartX.subtotal + itemSubtotalColWidth, yPos, { align: 'right' }); 
    
    yPos += (doc.getLineHeight('helvetica', 'bold', 9) / doc.internal.scaleFactor); 
    yPos += 2; 
    doc.line(margin, yPos, pageWidth - margin, yPos); 
    yPos += 3; 
    doc.setFont('helvetica', 'normal'); 
    doc.setFontSize(8); // Item row font size
  };

  drawTableHeaders();

  // --- Table Items ---
  doc.setFontSize(8); // Set font size for item rows
  order.items.forEach((item) => {
    const itemLineHeight = (doc.getLineHeight('helvetica', 'normal', 8) / doc.internal.scaleFactor);
    // Estimate lines needed for product and SN/Barcode
    const productNameLines = doc.splitTextToSize(item.name, productColWidth);
    const snBarcodeText = item.serialNumber || item.barcode || 'N/A';
    const snBarcodeLines = doc.splitTextToSize(snBarcodeText, snBarcodeColWidth);
    const maxLinesPerItem = Math.max(productNameLines.length, snBarcodeLines.length, 1);
    const itemBlockHeight = maxLinesPerItem * itemLineHeight + 2; // +2 for padding

    if (yPos + itemBlockHeight > pageHeight - (margin + 15)) { // Check if item fits, leave 15mm for footer
      doc.addPage();
      yPos = margin;
      drawTableHeaders(); 
      doc.setFontSize(8); // Reset font size for items on new page
    }
    const currentItemY = yPos;

    doc.text(productNameLines, colStartX.productName, currentItemY);
    doc.text(snBarcodeLines, colStartX.snBarcode, currentItemY);

    doc.text(item.billQuantity.toString(), colStartX.qty + qtyColWidth / 2, currentItemY, { align: 'center' }); // Center align qty value
    doc.text(`₹${item.price.toFixed(2)}`, colStartX.price + priceColWidth, currentItemY, { align: 'right' });
    doc.text(`₹{(item.price * item.billQuantity).toFixed(2)}`, colStartX.subtotal + itemSubtotalColWidth, currentItemY, { align: 'right' });
    
    yPos += itemBlockHeight;
  });

  // --- Summary Section ---
  // Check if summary fits on current page, otherwise new page
  const summarySectionHeight = 35; // Approximate height needed for summary in mm
  if (yPos + summarySectionHeight > pageHeight - margin) {
    doc.addPage();
    yPos = margin;
  }

  yPos += 5; 
  const summaryTextX = pageWidth - margin - 50; // X position for summary labels
  const summaryValueX = pageWidth - margin;    // X position for summary values (right aligned)

  doc.setLineWidth(0.1);
  doc.line(margin, yPos, pageWidth - margin, yPos); // Line above summary
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryTextX, yPos, { align: 'right' });
  doc.text(`₹${order.subtotal.toFixed(2)}`, summaryValueX, yPos, { align: 'right' });
  yPos += 5;
  doc.text(`GST (${(taxRate * 100).toFixed(0)}%):`, summaryTextX, yPos, { align: 'right' });
  doc.text(`₹${order.taxAmount.toFixed(2)}`, summaryValueX, yPos, { align: 'right' });
  yPos += 5;

  doc.setFontSize(10); // Larger for total
  doc.setFont('helvetica', 'bold');
  doc.line(summaryTextX - 5, yPos, summaryValueX, yPos); // Line above total
  yPos += 5;
  doc.text('Total Amount:', summaryTextX, yPos, { align: 'right' });
  doc.text(`₹${order.totalAmount.toFixed(2)}`, summaryValueX, yPos, { align: 'right' });
  yPos += 10; // Space after total

  // --- Footer ---
  const footerY = pageHeight - (margin / 2); // Position footer near bottom margin
  doc.setFontSize(7); // Smallest font for footer
  doc.setFont('helvetica', 'italic');
  // Ensure footer is drawn on every page if multi-page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${pageCount}`, margin, footerY, {align: 'left'});
    doc.text('Thank you for your business! - Generated by StockPilot', pageWidth / 2, footerY, { align: 'center' });
  }


  // Auto print
  doc.autoPrint({variant: 'non-conform'});
  doc.output('dataurlnewwindow', { filename: `StockPilot-Bill-${order.orderNumber}.pdf` });
}
