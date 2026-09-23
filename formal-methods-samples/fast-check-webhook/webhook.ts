export type OrderStatus = 'unpaid' | 'charging' | 'paid';

export interface Deps {
  getStatus: (orderId: string) => Promise<OrderStatus>;
  chargeCard: (orderId: string) => Promise<void>;
  setStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

export async function handleOrderConfirmed(orderId: string, deps: Deps): Promise<void> {
  const status = await deps.getStatus(orderId);
  if (status === 'unpaid') {
    await deps.chargeCard(orderId);
    await deps.setStatus(orderId, 'paid');
  }
}
