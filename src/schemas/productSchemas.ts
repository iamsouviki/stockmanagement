
import { z } from 'zod';

export const BulkProductEntrySchema = z.object({
  Name: z.string().min(1, "Product name is required."),
  SerialNumber: z.string().optional(),
  Barcode: z.string().optional(),
  Price: z.number().min(0, "Price cannot be negative."),
  Quantity: z.number().int().min(0, "Quantity cannot be negative."),
  CategoryName: z.string().min(1, "Category name is required."),
}).refine(data => !!(data.SerialNumber || data.Barcode), { // Ensure explicit boolean return
  message: "Either SerialNumber or Barcode must be provided for each product.",
});

export type BulkProductEntry = z.infer<typeof BulkProductEntrySchema>;
