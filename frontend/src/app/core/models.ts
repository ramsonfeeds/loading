export type ProductType = 'MANUFACTURED' | 'PURCHASED';
export type Factory = 'R' | 'S';
export type AllocationSource = 'STOCK' | 'PRODUCTION';
export type ProductionItemSource = 'AUTO' | 'MANUAL';

export interface Product {
  id: number;
  englishName: string;
  tamilName: string;
  weight: string;
  active: boolean;
  productType: ProductType;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPayload {
  englishName: string;
  tamilName: string;
  weight: number;
  active: boolean;
  productType: ProductType;
}

export interface DispatchItem {
  id?: number;
  productId: number;
  quantity: number;
  description?: string | null;
  sortOrder: number;
  product: Product;
  allocations: DispatchAllocation[];
}

export interface DispatchGroup {
  id?: number;
  sortOrder: number;
  items: DispatchItem[];
}

export interface DispatchGroupPayload {
  id?: number;
  sortOrder: number;
  items: DispatchItemPayload[];
}

export interface Dispatch {
  id: number;
  dispatchDate: string;
  title: string;
  factory: Factory;
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
  allocations: DispatchAllocationPayload[];
}

// export interface DispatchGroupPayload {
//   id?: number;
//   sortOrder: number;
//   factory: Factory;
//   items: DispatchItemPayload[];
// }

export interface DispatchPayload {
  dispatchDate: string;
  title: string;
  factory: Factory;
  groups: DispatchGroupPayload[];
}

export interface WeightLine {
  weight: number;
  bags: number;
}

export interface DispatchAllocation {
  id?: number;
  itemId?: number;
  factory: Factory;
  source: AllocationSource;
  quantity: number;
}

export interface DispatchAllocationPayload {
  id?: number;
  factory: Factory;
  source: AllocationSource;
  quantity: number;
}

export interface ProductionItem {
  id?: number;
  productionListId?: number;
  productId: number;
  quantity: number;
  sortOrder: number;
  sourceType: ProductionItemSource;
  product: Product;
}

export interface ProductionList {
  id: number;
  productionDate: string;
  title: string;
  factory: Factory;
  sourceDispatchId: number | null;
  createdAt: string;
  updatedAt: string;
  items: ProductionItem[];
}

export interface ProductionItemPayload {
  id?: number;
  productId: number;
  quantity: number;
  sortOrder: number;
  sourceType?: ProductionItemSource;
}

export interface ProductionListPayload {
  productionDate: string;
  title: string;
  factory: Factory;
  sourceDispatchId?: number | null;
  items: ProductionItemPayload[];
}
