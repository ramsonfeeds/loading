export type ProductType = 'MANUFACTURED' | 'PURCHASED';
export type Factory = 'R' | 'S';
export type AllocationSource = 'STOCK' | 'PRODUCTION';
export type ProductionItemSource = 'AUTO' | 'MANUAL';

export interface ProductRow {
  id: number;
  englishName: string;
  tamilName: string;
  weight: number;
  active: boolean;
  productType: ProductType;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchItemRow {
  id: number;
  groupId: number;
  productId: number;
  quantity: number;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  product: ProductRow;
  allocations: DispatchAllocationRow[];
}

export interface DispatchGroupRow {
  id: number;
  dispatchId: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  items: DispatchItemRow[];
}

export interface DispatchRow {
  id: number;
  dispatchDate: string;
  title: string;
  factory: Factory;
  createdAt: string;
  updatedAt: string;
  groups: DispatchGroupRow[];
}

export interface DispatchAllocationRow {
  id: number;
  itemId: number;
  factory: Factory;
  source: AllocationSource;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionItemRow {
  id: number;
  productionListId: number;
  productId: number;
  quantity: number;
  sortOrder: number;
  sourceType: ProductionItemSource;
  createdAt: string;
  updatedAt: string;
  product: ProductRow;
}

export interface ProductionListRow {
  id: number;
  productionDate: string;
  title: string;
  factory: Factory;
  sourceDispatchId: number | null;
  createdAt: string;
  updatedAt: string;
  items: ProductionItemRow[];
}

export interface SqlProductRecord {
  id: number;
  english_name: string;
  tamil_name: string;
  weight: number;
  active: number;
  product_type: ProductType;
  created_at: string;
  updated_at: string;
}

export interface SqlDispatchRecord {
  id: number;
  dispatch_date: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface SqlDispatchGroupRecord {
  id: number;
  dispatch_id: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SqlDispatchItemRecord {
  id: number;
  group_id: number;
  product_id: number;
  quantity: number;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LastIdResult {
  lastID?: number;
  changes?: number;
}
