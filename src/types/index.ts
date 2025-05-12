export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  serialNumber: string;
  barcode: string;
  price: number;
  quantity: number;
  categoryId: string;
  // Optional: for image display
  imageUrl?: string; 
  imageHint?: string;
}

export interface BillItem extends Product {
  billQuantity: number;
}
