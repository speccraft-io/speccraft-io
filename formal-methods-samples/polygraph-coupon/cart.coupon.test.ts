// The natural test: a coupon that needs a 20.00 minimum must go when the cart drops under it. It fails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cart, emptyCart, type CartAction } from './cart.ts';

test('the coupon goes when the cart drops under the minimum', () => {
  const actions: CartAction[] = [
    { type: 'ADD_ITEM' },
    { type: 'ADD_ITEM' },
    { type: 'APPLY_COUPON', code: 'SAVE5' },
    { type: 'REMOVE_ITEM' },
  ];
  const state = actions.reduce(cart, emptyCart);
  assert.equal(state.coupon, null);
});
