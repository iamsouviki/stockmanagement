import type { Category } from '@/types';
import { Users, History, Smartphone, Laptop, Tv2, Headphones, Printer, HardDrive, Tags } from 'lucide-react'; // Added Tags

// mockCategories is deprecated as categories are fetched from Firebase.
// export const mockCategories: Category[] = [
//   { id: 'cat1', name: 'Smartphones' },
//   { id: 'cat2', name: 'Laptops' },
// ];

// Category icons mapping is also less directly used if IDs are dynamic and not hardcoded.
// Individual pages or components can import icons as needed.
// export const categoryIcons: { [key: string]: React.ElementType } = {
//   cat1: Smartphone,
//   cat2: Laptop,
//   cat3: Tv2,
//   cat4: Headphones,
//   cat5: Printer,
//   cat6: HardDrive,
// };

// Export lucide icons directly if needed elsewhere.
export { Users as UsersIcon, History as HistoryIcon, Tags as TagsIcon };
export { Smartphone, Laptop, Tv2, Headphones, Printer, HardDrive }; // Export other icons if they are needed individually.
