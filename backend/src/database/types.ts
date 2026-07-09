export interface ProductRow {
  id: number;
  englishName: string;
  tamilName: string;
  weight: number;
  active: boolean;
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
  createdAt: string;
  updatedAt: string;
  groups: DispatchGroupRow[];
}

export interface SqlProductRecord {
  id: number;
  english_name: string;
  tamil_name: string;
  weight: number;
  active: number;
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
