import { z } from 'zod';

const factorySchema = z.enum(['R', 'S']);
const productionItemSourceSchema = z.enum(['AUTO', 'MANUAL']);

export const productionItemSchema = z.object({
  id: z.number().int().positive().optional(),
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  sortOrder: z.number().int().nonnegative(),
  sourceType: productionItemSourceSchema.optional()
});

export const productionListSaveSchema = z.object({
  productionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  factory: factorySchema,
  sourceDispatchId: z.number().int().positive().optional().nullable(),
  items: z.array(productionItemSchema)
});

export const productionSearchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  factory: factorySchema.optional()
});

export const productionGenerateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export type ProductionListSaveInput = z.infer<typeof productionListSaveSchema>;
export type ProductionSearchInput = z.infer<typeof productionSearchSchema>;
export type ProductionGenerateInput = z.infer<typeof productionGenerateSchema>;
