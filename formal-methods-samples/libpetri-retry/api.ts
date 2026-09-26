// A fake order API: slow, and it creates an order on every call.
export type Api = { createOrder: (cart: string) => Promise<string> };

export function fakeApi(delayMs: number) {
  const orders: string[] = [];
  const api: Api = {
    createOrder: async (cart) => {
      await new Promise((r) => setTimeout(r, delayMs));
      orders.push(cart);
      return `order-${orders.length}`;
    },
  };
  return { api, orders };
}
