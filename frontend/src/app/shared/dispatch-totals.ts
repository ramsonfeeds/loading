import { DispatchGroup, DispatchGroupPayload, Product, WeightLine } from '../core/models';

export function groupTotal(group: DispatchGroupPayload | DispatchGroup): number {
  return group.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

export function grandTotal(groups: readonly (DispatchGroupPayload | DispatchGroup)[]): number {
  return groups.reduce((sum, group) => sum + groupTotal(group), 0);
}

export function weightLines(groups: readonly DispatchGroup[], productFallback: readonly Product[] = []): WeightLine[] {
  const lookup = new Map<number, Product>();
  productFallback.forEach(product => lookup.set(product.id, product));
  groups.flatMap(group => group.items).forEach(item => lookup.set(item.productId, item.product));

  const map = new Map<number, number>();
  groups.forEach(group => {
    group.items.forEach(item => {
      const product = lookup.get(item.productId);
      if (!product) {
        return;
      }
      const weight = Number(product.weight);
      map.set(weight, (map.get(weight) ?? 0) + Number(item.quantity || 0));
    });
  });

  return [...map.entries()]
    .sort((first, second) => second[0] - first[0])
    .map(([weight, bags]) => ({ weight, bags }));
}

export function totalWeight(lines: readonly WeightLine[]): number {
  return lines.reduce((sum, line) => sum + line.weight * line.bags, 0);
}
