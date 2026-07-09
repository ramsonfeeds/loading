import {
  DispatchGroupRow,
  DispatchItemRow,
  DispatchRow,
  ProductRow
} from './types.js';

import {
  Product,
  Dispatch,
  DispatchGroup,
  DispatchItem
} from '@prisma/client';

export function mapProduct(product: Product): ProductRow {
  return {
    id: product.id,
    englishName: product.englishName,
    tamilName: product.tamilName,
    weight: product.weight,
    active: product.active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

export function mapDispatch(
  dispatch: Dispatch & {
    groups: (DispatchGroup & {
      items: (DispatchItem & {
        product: Product;
      })[];
    })[];
  }
): DispatchRow {
  return {
    id: dispatch.id,
    dispatchDate: dispatch.dispatchDate,
    title: dispatch.title,
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
        product: mapProduct(item.product)
      }))
    }))
  };
}