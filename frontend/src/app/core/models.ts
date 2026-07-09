export interface Product {
  id: number;
  englishName: string;
  tamilName: string;
  weight: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPayload {
  englishName: string;
  tamilName: string;
  weight: number;
  active: boolean;
}

export interface DispatchItem {
  id?: number;
  productId: number;
  quantity: number;
  description?: string | null;
  sortOrder: number;
  product: Product;
}

export interface DispatchGroup {
  id?: number;
  sortOrder: number;
  items: DispatchItem[];
}

export interface Dispatch {
  id: number;
  dispatchDate: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  groups: DispatchGroup[];
}

export interface DispatchItemPayload {
  id?: number;
  productId: number;
  quantity: number;
  description?: string | null;
  sortOrder: number;
}

export interface DispatchGroupPayload {
  id?: number;
  sortOrder: number;
  items: DispatchItemPayload[];
}

export interface DispatchPayload {
  dispatchDate: string;
  title: string;
  groups: DispatchGroupPayload[];
}

export interface WeightLine {
  weight: number;
  bags: number;
}
