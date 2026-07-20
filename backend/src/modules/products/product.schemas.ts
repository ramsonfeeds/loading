import { z } from 'zod';

const productTypeSchema = z.enum(['MANUFACTURED', 'PURCHASED']);

export const productCreateSchema = z.object({
  englishName: z.string().trim().min(1).max(191),
  tamilName: z.string().trim().min(1).max(191),
  weight: z.coerce.number().positive().max(999999.99),
  active: z.boolean().default(true),
  productType: productTypeSchema.default('MANUFACTURED')
});

export const productUpdateSchema = productCreateSchema.partial().refine(value => Object.keys(value).length > 0, {
  message: 'At least one field is required'
});

export const productSearchSchema = z.object({
  search: z.string().trim().optional(),
  active: z.enum(['true', 'false', 'all']).default('all')
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
