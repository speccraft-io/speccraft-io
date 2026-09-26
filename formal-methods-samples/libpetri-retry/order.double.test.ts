import { expect, it } from 'vitest';
import { fakeApi } from './api.js';
import { placeOrder } from './order.js';

it('one checkout, one order', async () => {
  const { api, orders } = fakeApi(30);
  await placeOrder(api, 'cart-1', 10);
  await new Promise((r) => setTimeout(r, 50));
  expect(orders).toHaveLength(1);
});
