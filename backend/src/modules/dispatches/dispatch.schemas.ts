import { z } from 'zod';

export const dispatchItemSchema = z.object({
  id: z.number().int().positive().optional(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  description: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().nonnegative()
});

export const dispatchGroupSchema = z.object({
  id: z.number().int().positive().optional(),
  sortOrder: z.number().int().nonnegative(),
  items: z.array(dispatchItemSchema)
});

export const dispatchSaveSchema = z.object({
  dispatchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  groups: z.array(dispatchGroupSchema).min(1)
});

export const dispatchSearchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  title: z.string().trim().optional(),
  product: z.string().trim().optional()
});

export type DispatchSaveInput = z.infer<typeof dispatchSaveSchema>;
export type DispatchSearchInput = z.infer<typeof dispatchSearchSchema>;
