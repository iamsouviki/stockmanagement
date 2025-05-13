// src/ai/flows/process-bulk-upload-flow.ts
'use server';
/**
 * @fileOverview Handles bulk product uploads.
 *
 * - processBulkUpload - A function that processes an array of product data from a file.
 * - BulkProductEntry - The type for a single product entry from the file.
 * - ProcessBulkUploadInput - The input type for the processBulkUpload function.
 * - ProcessBulkUploadOutput - The return type for the processBulkUpload function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
  findCategoryByNameOrCreate, 
  findProductBySerialNumberOrBarcode,
  addProduct,
  updateProduct,
  getProducts, // To optimize product existence checks
  getCategories // To optimize category existence checks
} from '@/services/firebaseService';
import type { Product, Category } from '@/types';

// Schema for a single product entry from the uploaded file
export const BulkProductEntrySchema = z.object({
  Name: z.string().min(1, "Product name is required."),
  SerialNumber: z.string().optional(), // Made optional, barcode can be primary identifier
  Barcode: z.string().optional(), // Made optional, serial number can be primary identifier
  Price: z.number().min(0, "Price cannot be negative."),
  Quantity: z.number().int().min(0, "Quantity cannot be negative."),
  CategoryName: z.string().min(1, "Category name is required."),
}).refine(data => data.SerialNumber || data.Barcode, {
  message: "Either SerialNumber or Barcode must be provided for each product.",
});

export type BulkProductEntry = z.infer<typeof BulkProductEntrySchema>;

// Input schema for the flow
export const ProcessBulkUploadInputSchema = z.object({
  products: z.array(BulkProductEntrySchema),
});
export type ProcessBulkUploadInput = z.infer<typeof ProcessBulkUploadInputSchema>;

// Output schema for the flow
export const ProcessBulkUploadOutputSchema = z.object({
  successCount: z.number(),
  errorCount: z.number(),
  errors: z.array(z.string()),
  newCategoriesCreated: z.array(z.string()),
  message: z.string(),
});
export type ProcessBulkUploadOutput = z.infer<typeof ProcessBulkUploadOutputSchema>;


// Wrapper function to be called by the client
export async function processBulkUpload(input: ProcessBulkUploadInput): Promise<ProcessBulkUploadOutput> {
  return processBulkUploadFlow(input);
}

const processBulkUploadFlow = ai.defineFlow(
  {
    name: 'processBulkUploadFlow',
    inputSchema: ProcessBulkUploadInputSchema,
    outputSchema: ProcessBulkUploadOutputSchema,
  },
  async (input) => {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const newCategoriesCreated: string[] = [];

    // Fetch all existing products and categories once to optimize lookups
    const existingProducts = await getProducts();
    const existingCategories = await getCategories();
    const categoryMapByName = new Map(existingCategories.map(cat => [cat.name.toLowerCase(), cat]));
    
    // Map products by SN and Barcode for quick lookup
    const productMapBySN = new Map(existingProducts.filter(p => p.serialNumber).map(p => [p.serialNumber, p]));
    const productMapByBarcode = new Map(existingProducts.filter(p => p.barcode).map(p => [p.barcode, p]));


    for (const [index, productEntry] of input.products.entries()) {
      try {
        // 1. Validate product entry (Zod already did basic validation)
        // Additional custom validation if needed (e.g., if price is zero when it shouldn't be)
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
        if (!productEntry.SerialNumber && !productEntry.Barcode) {
          errors.push(`Row ${index + 2}: Missing SerialNumber and Barcode for product '${productEntry.Name}'. Provide at least one.`);
          errorCount++;
          continue;
        }


        // 2. Resolve Category
        let category: Category;
        const lowerCategoryName = productEntry.CategoryName.trim().toLowerCase();
        if (categoryMapByName.has(lowerCategoryName)) {
          category = categoryMapByName.get(lowerCategoryName)!;
        } else {
          const newCategory = await findCategoryByNameOrCreate(productEntry.CategoryName.trim());
          category = newCategory;
          categoryMapByName.set(lowerCategoryName, newCategory); // Add to local map
          if (!newCategoriesCreated.includes(newCategory.name)) {
            newCategoriesCreated.push(newCategory.name);
          }
        }

        // 3. Find existing product by SerialNumber or Barcode
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
          categoryName: category.name, // Denormalized for display
        };

        if (existingProduct) {
          // Update existing product
          await updateProduct(existingProduct.id, productData);
          // Update local maps if SN/Barcode changed (though usually they don't)
          if (productEntry.SerialNumber && existingProduct.serialNumber !== productEntry.SerialNumber) {
              productMapBySN.delete(existingProduct.serialNumber);
              productMapBySN.set(productEntry.SerialNumber, {...existingProduct, ...productData});
          }
          if (productEntry.Barcode && existingProduct.barcode !== productEntry.Barcode) {
              productMapByBarcode.delete(existingProduct.barcode);
              productMapByBarcode.set(productEntry.Barcode, {...existingProduct, ...productData});
          }

        } else {
          // Add new product
          const newProduct: Omit&lt;Product, 'id' | 'createdAt' | 'updatedAt'&gt; = {
            ...productData,
            imageUrl: `https://picsum.photos/seed/${encodeURIComponent(productData.name.split(" ")[0])}/200/200`,
            imageHint: `${productData.name.split(' ')[0].toLowerCase()} item`,
          };
          const newProductId = await addProduct(newProduct);
          // Add to local maps for subsequent checks within the same upload batch
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
);