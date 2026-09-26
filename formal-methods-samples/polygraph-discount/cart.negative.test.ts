// The natural test: a total is never negative. It fails at 150 percent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cart, emptyCart, total } from './cart.ts';

test('the total is never negative', () => {
  const state = cart(cart(emptyCart, { type: 'ADD_ITEM' }), { type: 'APPLY_DISCOUNT', percent: 150 });
  assert.ok(total(state) >= 0, `total is ${total(state)}`);
});
