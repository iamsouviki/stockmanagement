
// src/ai/flows/process-bulk-upload-flow.ts

/**
 * @fileOverview Handles bulk product uploads.
 *
 * - processBulkUpload - A function that processes an array of product data from a file.
 * - ProcessBulkUploadInput - The input type for the processBulkUpload function. (Exported)
 * - ProcessBulkUploadOutput - The return type for the processBulkUpload function. (Exported)
 */

import { z } from 'zod'; // For inferring types
import { 
  findCategoryByNameOrCreate, 
  addProduct,
  updateProduct,
  getProducts, 
  getCategories 
} from '@/services/firebaseService';
import type { Product, Category } from '@/types';
// Import SCHEMAS and their inferred TYPES from the schemas file
import { 
  BulkProductEntrySchema, // Schema for internal use
  ProcessBulkUploadInputSchema,
  ProcessBulkUploadOutputSchema,
  // Types are defined below using z.infer or imported directly
} from '@/schemas/productSchemas';

// Define and export types locally by inferring from the imported schemas
export type ProcessBulkUploadInput = z.infer<typeof ProcessBulkUploadInputSchema>;
export type ProcessBulkUploadOutput = z.infer<typeof ProcessBulkUploadOutputSchema>;
// Import BulkProductEntry type if used by name within this file (e.g. in function signature or variable types)
import type { BulkProductEntry } from '@/schemas/productSchemas';


// Wrapper function to be called by the client
export async function processBulkUpload(input: ProcessBulkUploadInput): Promise<ProcessBulkUploadOutput> {
  // This function now directly contains the processing logic
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  const newCategoriesCreated: string[] = [];

  const existingProducts = await getProducts();
  const existingCategories = await getCategories();
  const categoryMapByName = new Map(existingCategories.map(cat => [cat.name.toLowerCase(), cat]));
  
  const productMapBySN = new Map(existingProducts.filter(p => p.serialNumber).map(p => [p.serialNumber, p]));
  const productMapByBarcode = new Map(existingProducts.filter(p => p.barcode).map(p => [p.barcode, p]));

  for (const [index, productEntryUntyped] of input.products.entries()) {
    // Ensure productEntry is correctly typed as BulkProductEntry for intellisense and type safety
    const productEntry = productEntryUntyped as BulkProductEntry;
    try {
      // Validate individual entry
      const parsedEntry = BulkProductEntrySchema.safeParse(productEntry);
      if (!parsedEntry.success) {
        const formattedErrors = parsedEntry.error.errors.map(err => err.message).join(', ');
        errors.push(`Row ${index + 2}: Invalid data - ${formattedErrors}`);
        errorCount++;
        continue;
      }
      
      if (isNaN(productEntry.Price) || productEntry.Price < 0) {
        errors.push(`Row ${index + 2}: Invalid Price '${productEntry.Price}'. Must be a non-negative number.`);
        errorCount++;
        continue;
      }
      if (isNaN(productEntry.Quantity) || !Number.isInteger(productEntry.Quantity) || productEntry.Quantity < 0) {
         errors.push(`Row ${index + 2}: Invalid Quantity '${productEntry.Quantity}'. Must be a non-negative integer.`);
         errorCount++;
         continue;
      }
      // Redundant due to .refine in BulkProductEntrySchema, but kept for explicitness if refine is ever removed.
      if (!productEntry.SerialNumber && !productEntry.Barcode) {
        errors.push(`Row ${index + 2}: Missing SerialNumber and Barcode for product '${productEntry.Name}'. Provide at least one.`);
        errorCount++;
        continue;
      }

      let category: Category;
      const lowerCategoryName = productEntry.CategoryName.trim().toLowerCase();
      if (categoryMapByName.has(lowerCategoryName)) {
        category = categoryMapByName.get(lowerCategoryName)!;
      } else {
        const newCategory = await findCategoryByNameOrCreate(productEntry.CategoryName.trim());
        category = newCategory;
        categoryMapByName.set(lowerCategoryName, newCategory); 
        if (!newCategoriesCreated.includes(newCategory.name)) {
          newCategoriesCreated.push(newCategory.name);
        }
      }

      let existingProduct: Product | null = null;
      if (productEntry.SerialNumber) {
        existingProduct = productMapBySN.get(productEntry.SerialNumber) || null;
      }
      if (!existingProduct && productEntry.Barcode) {
        existingProduct = productMapByBarcode.get(productEntry.Barcode) || null;
      }
      
      const productData = {
        name: productEntry.Name.trim(),
        serialNumber: productEntry.SerialNumber?.trim() || '',
        barcode: productEntry.Barcode?.trim() || '',
        price: productEntry.Price,
        quantity: productEntry.Quantity,
        categoryId: category.id,
        categoryName: category.name, 
      };

      if (existingProduct) {
        await updateProduct(existingProduct.id, productData);
        if (productEntry.SerialNumber && existingProduct.serialNumber !== productEntry.SerialNumber) {
            productMapBySN.delete(existingProduct.serialNumber!);
            productMapBySN.set(productEntry.SerialNumber, {...existingProduct, ...productData});
        }
        if (productEntry.Barcode && existingProduct.barcode !== productEntry.Barcode) {
            productMapByBarcode.delete(existingProduct.barcode!);
            productMapByBarcode.set(productEntry.Barcode, {...existingProduct, ...productData});
        }
      } else {
        const newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
          ...productData,
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(productData.name.split(" ")[0])}/200/200`,
          imageHint: `${productData.name.split(' ')[0].toLowerCase()} item`,
        };
        const newProductId = await addProduct(newProduct);
        const createdProduct = {...newProduct, id: newProductId };
        if (createdProduct.serialNumber) productMapBySN.set(createdProduct.serialNumber, createdProduct);
        if (createdProduct.barcode) productMapByBarcode.set(createdProduct.barcode, createdProduct);
      }
      successCount++;
    } catch (e: any) {
      console.error(`Error processing product entry (Row ${index + 2}): ${productEntry.Name}`, e);
      errors.push(`Row ${index + 2} (${productEntry.Name || 'N/A'}): ${e.message || 'Unknown error'}`);
      errorCount++;
    }
  }
  
  let message = `Bulk upload completed. ${successCount} products processed successfully.`;
  if (errorCount > 0) {
    message += ` ${errorCount} products had errors.`;
  }
  if (newCategoriesCreated.length > 0) {
    message += ` Created new categories: ${newCategoriesCreated.join(', ')}.`;
  }

  return {
    successCount,
    errorCount,
    errors,
    newCategoriesCreated,
    message,
  };
}
