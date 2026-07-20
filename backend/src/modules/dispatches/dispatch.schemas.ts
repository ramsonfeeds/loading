import { z } from 'zod';

const factorySchema = z.enum(['R', 'S']);
const allocationSourceSchema = z.enum(['STOCK', 'PRODUCTION']);

export const dispatchAllocationSchema = z.object({
  id: z.number().int().positive().optional(),
  factory: factorySchema,
  source: allocationSourceSchema,
  quantity: z.number().int().positive()
});

export const dispatchItemSchema = z.object({
  id: z.number().int().positive().optional(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  description: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().nonnegative(),
  allocations: z.array(dispatchAllocationSchema).default([])
}).refine(item => item.allocations.length === 0 || item.allocations.reduce((sum, allocation) => sum + allocation.quantity, 0) === item.quantity, {
  message: 'Allocation total must equal item quantity',
  path: ['allocations']
});

export const dispatchGroupSchema = z.object({
  id: z.number().int().positive().optional(),
  sortOrder: z.number().int().nonnegative(),
  items: z.array(dispatchItemSchema)
});

export const dispatchSaveSchema = z.object({
  dispatchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
   factory: factorySchema,
  groups: z.array(dispatchGroupSchema).min(1)
});

export const dispatchSearchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  title: z.string().trim().optional(),
  product: z.string().trim().optional()
});

export type DispatchSaveInput = z.infer<typeof dispatchSaveSchema>;
export type DispatchSearchInput = z.infer<typeof dispatchSearchSchema>;
