import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import type { Order } from '@/types/order';

const DATA_PATH = join(process.cwd(), 'data', 'orders.json');

function toOrderNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const code = randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `BDO-${y}${m}${day}-${code}`;
}

export function newOrderNo() {
  return toOrderNo();
}

export async function readOrders(): Promise<Order[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('orders', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as Order[];
  } catch {
    return [];
  }
}

export async function writeOrders(orders: Order[]): Promise<void> {
  await writeJsonStore('orders', orders, DATA_PATH);
}

