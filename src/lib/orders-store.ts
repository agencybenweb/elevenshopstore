import { Order, OrderItem } from '@/types/database';

/**
 * Global order store used in fallback / demo mode
 * when Supabase is not connected. Preserved across requests in memory.
 */

declare global {
  // eslint-disable-next-line no-var
  var __ELEVEN_ORDERS__: Order[] | undefined;
}

if (!global.__ELEVEN_ORDERS__) {
  global.__ELEVEN_ORDERS__ = [];
}

export const inMemoryOrders: Order[] = global.__ELEVEN_ORDERS__;

export function saveInMemoryOrder(order: Order): void {
  const existingIdx = inMemoryOrders.findIndex((o) => o.id === order.id);
  if (existingIdx >= 0) {
    inMemoryOrders[existingIdx] = order;
  } else {
    inMemoryOrders.unshift(order);
  }
}

export function getInMemoryOrderByCode(code: string): Order | null {
  const norm = code.toUpperCase().trim();
  return inMemoryOrders.find((o) => o.public_code.toUpperCase() === norm) || null;
}

export function updateInMemoryOrderStatus(
  code: string,
  status: Order['status'],
  driverName?: string | null
): Order | null {
  const order = getInMemoryOrderByCode(code);
  if (!order) return null;
  order.status = status;
  if (driverName !== undefined) {
    order.assigned_driver = driverName;
  }
  return order;
}
