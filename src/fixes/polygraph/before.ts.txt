// A shopping cart reducer. Every item costs 10.00; the SAVE5 coupon needs a subtotal of at least 20.00.
export type Cart = { items: number; coupon: 'SAVE5' | null };

export type CartAction =
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM' }
  | { type: 'APPLY_COUPON'; code: string };

export const PRICE = 1000;
export const MIN_SPEND = 2000;
export const MAX_ITEMS = 3;

export const emptyCart: Cart = { items: 0, coupon: null };

export function cart(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM':
      if (state.items === MAX_ITEMS) return state;
      return { ...state, items: state.items + 1 };
    case 'REMOVE_ITEM':
      if (state.items === 0) return state;
      return { ...state, items: state.items - 1 };
    case 'APPLY_COUPON':
      if (action.code !== 'SAVE5') return state;
      if (state.items * PRICE < MIN_SPEND) return state;
      return { ...state, coupon: 'SAVE5' };
  }
}
