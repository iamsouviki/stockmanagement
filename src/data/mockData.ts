import type { Category, Product } from '@/types';
import { Smartphone, Laptop, Tv2, Headphones, Printer, HardDrive } from 'lucide-react';

export const mockCategories: Category[] = [
  { id: 'cat1', name: 'Smartphones' },
  { id: 'cat2', name: 'Laptops' },
  { id: 'cat3', name: 'Televisions' },
  { id: 'cat4', name: 'Headphones' },
  { id: 'cat5', name: 'Printers' },
  { id: 'cat6', name: 'Storage Devices'},
];

export const categoryIcons: { [key: string]: React.ElementType } = {
  cat1: Smartphone,
  cat2: Laptop,
  cat3: Tv2,
  cat4: Headphones,
  cat5: Printer,
  cat6: HardDrive,
};

export const mockProducts: Product[] = [
  {
    id: 'prod1',
    name: 'Galaxy S23 Ultra',
    serialNumber: 'SN-GS23U-001',
    barcode: '1234567890123',
    price: 1199.99,
    quantity: 15,
    categoryId: 'cat1',
    imageUrl: 'https://picsum.photos/seed/s23ultra/200/200',
    imageHint: 'smartphone device',
  },
  {
    id: 'prod2',
    name: 'MacBook Pro 16"',
    serialNumber: 'SN-MBP16-005',
    barcode: '9876543210987',
    price: 2499.00,
    quantity: 8,
    categoryId: 'cat2',
    imageUrl: 'https://picsum.photos/seed/macbookpro/200/200',
    imageHint: 'laptop computer',
  },
  {
    id: 'prod3',
    name: 'Sony Bravia XR A95L',
    serialNumber: 'SN-SBA95L-010',
    barcode: '5678901234567',
    price: 2799.99,
    quantity: 5,
    categoryId: 'cat3',
    imageUrl: 'https://picsum.photos/seed/sonytv/200/200',
    imageHint: 'smart television',
  },
  {
    id: 'prod4',
    name: 'Bose QuietComfort Ultra',
    serialNumber: 'SN-BOSEQC-021',
    barcode: '3210987654321',
    price: 379.00,
    quantity: 25,
    categoryId: 'cat4',
    imageUrl: 'https://picsum.photos/seed/boseqc/200/200',
    imageHint: 'noise cancelling headphones',
  },
  {
    id: 'prod5',
    name: 'HP LaserJet Pro M404dn',
    serialNumber: 'SN-HPLJM-015',
    barcode: '1122334455667',
    price: 250.00,
    quantity: 12,
    categoryId: 'cat5',
    imageUrl: 'https://picsum.photos/seed/hpprinter/200/200',
    imageHint: 'laser printer',
  },
];
