import {
  DispatchAllocationRow,
  DispatchGroupRow,
  DispatchItemRow,
  DispatchRow,
  ProductionListRow,
  ProductRow
} from './types.js';

import {
  Product,
  Dispatch,
  DispatchAllocation,
  DispatchGroup,
  DispatchItem,
  ProductionItem,
  ProductionList
} from '@prisma/client';

export function mapProduct(product: Product): ProductRow {
  return {
    id: product.id,
    englishName: product.englishName,
    tamilName: product.tamilName,
    weight: product.weight,
    active: product.active,
    productType: product.productType,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

export function mapDispatch(
  dispatch: Dispatch & {
    groups: (DispatchGroup & {
      items: (DispatchItem & {
        product: Product;
        allocations: DispatchAllocation[];
      })[];
    })[];
  }
): DispatchRow {
  return {
    id: dispatch.id,
    dispatchDate: dispatch.dispatchDate,
    title: dispatch.title,
    factory: dispatch.factory,
    createdAt: dispatch.createdAt.toISOString(),
    updatedAt: dispatch.updatedAt.toISOString(),
    groups: dispatch.groups.map(group => ({
      id: group.id,
      dispatchId: group.dispatchId,
      sortOrder: group.sortOrder,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      items: group.items.map(item => ({
        id: item.id,
        groupId: item.groupId,
        productId: item.productId,
        quantity: item.quantity,
        description: item.description,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        product: mapProduct(item.product),
        allocations: item.allocations.map(mapDispatchAllocation)
      }))
    }))
  };
}

export function mapDispatchAllocation(allocation: DispatchAllocation): DispatchAllocationRow {
  return {
    id: allocation.id,
    itemId: allocation.itemId,
    factory: allocation.factory,
    source: allocation.source,
    quantity: allocation.quantity,
    createdAt: allocation.createdAt.toISOString(),
    updatedAt: allocation.updatedAt.toISOString()
  };
}

export function mapProductionList(
  list: ProductionList & {
    items: (ProductionItem & { product: Product })[];
  }
): ProductionListRow {
  return {
    id: list.id,
    productionDate: list.productionDate,
    title: list.title,
    factory: list.factory,
    sourceDispatchId: list.sourceDispatchId,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
    items: list.items.map(item => ({
      id: item.id,
        productionListId: item.productionListId,
        productId: item.productId,
        quantity: item.quantity,
        sortOrder: item.sortOrder,
        sourceType: item.sourceType,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        product: mapProduct(item.product)
    }))
  };
}
