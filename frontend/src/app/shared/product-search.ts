import { Product } from '../core/models';

export function filterProductsForAutocomplete(products: readonly Product[], search: string, limit = 20): Product[] {
  const normalized = search.trim().toLowerCase();

  return products
    .filter(product => {
      if (!normalized) {
        return true;
      }

      return product.englishName.toLowerCase().includes(normalized) ||
        product.tamilName.toLowerCase().includes(normalized);
    })
    .slice(0, limit);
}
