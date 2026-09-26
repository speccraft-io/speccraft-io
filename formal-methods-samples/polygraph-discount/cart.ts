// A cart with a percentage discount. Every item costs 10.00.
export type Cart = { items: number; percent: number };

export type CartAction = { type: 'ADD_ITEM' } | { type: 'APPLY_DISCOUNT'; percent: number };

export const PRICE = 1000;
export const MAX_ITEMS = 3;

export const emptyCart: Cart = { items: 0, percent: 0 };

export function cart(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_ITEM':
      if (state.items === MAX_ITEMS) return state;
      return { ...state, items: state.items + 1 };
    case 'APPLY_DISCOUNT':
      return { ...state, percent: action.percent }; // two coupons together can pass 100
  }
}

export const total = (c: Cart) => Math.round((c.items * PRICE * (100 - c.percent)) / 100);
