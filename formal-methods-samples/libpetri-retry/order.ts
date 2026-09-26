// A checkout that gives the order API a few seconds, then tries again.
import type { Api } from './api.js';

export async function placeOrder(api: Api, cart: string, timeoutMs = 5_000) {
  try {
    return await withTimeout(api.createOrder(cart), timeoutMs);
  } catch {
    return await api.createOrder(cart); // the first call may still finish: two orders
  }
}

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}
