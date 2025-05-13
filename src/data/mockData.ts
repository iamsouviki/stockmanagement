import type { Category /* Product, Customer */ } from '@/types'; // Product and Customer now from Firebase
import { Smartphone, Laptop, Tv2, Headphones, Printer, HardDrive, Users, History } from 'lucide-react';

// Categories can be fetched from Firebase or defined here if static
export const mockCategories: Category[] = [
  { id: 'cat1', name: 'Smartphones' },
  { id: 'cat2', name: 'Laptops' },
  { id: 'cat3', name: 'Televisions' },
  { id: 'cat4', name: 'Headphones' },
  { id: 'cat5', name: 'Printers' },
  { id: 'cat6', name: 'Storage Devices'},
  // It's better to manage categories in Firebase if they can change.
  // For now, these can serve as initial data or for UI components that need a static list.
];

// Category icons mapping can remain useful
export const categoryIcons: { [key: string]: React.ElementType } = {
  cat1: Smartphone,
  cat2: Laptop,
  cat3: Tv2,
  cat4: Headphones,
  cat5: Printer,
  cat6: HardDrive,
  // Add more as needed or make this dynamic if icons are stored with category data
};

// mockProducts and mockCustomers are now deprecated as data comes from Firebase.
// Keeping them commented out for reference or potential fallback during development.
/*
export const mockProducts: Product[] = [
  // ... old mock product data
];

export const mockCustomers: Customer[] = [
  // ... old mock customer data
];
*/

// Export lucide icons directly if needed elsewhere, though NavItem uses string names
export { Users as UsersIcon, History as HistoryIcon };
