export interface Product {
  id: string;
  name: string;
  language: string;
  description?: string;
  imageUrl?: string;
  inventoryCount?: number;
  minStock?: number;
  maxStock?: number;
  cost?: number;
  price?: number;
  type?: string;
  barcode?: string;
  sku?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contact?: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  location?: string;
  condition?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  notes?: string;
  owner?: string;
  purchasedBy?: string;
}

export interface InventoryEntry {
  id: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  cost: number;
  entryDate: string;
  notes?: string;
}

export interface InventoryOut {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  outDate: string;
  reason: string;
  notes?: string;
} 