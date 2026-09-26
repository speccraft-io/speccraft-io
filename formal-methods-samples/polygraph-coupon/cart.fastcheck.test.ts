// The same rule, checked by fast-check on the real reducer with random lists of actions.
import { test } from 'node:test';
import fc from 'fast-check';
import { cart, emptyCart, type Cart, type CartAction } from './cart.ts';

const action = fc.oneof<fc.Arbitrary<CartAction>[]>(
  fc.constant({ type: 'ADD_ITEM' }),
  fc.constant({ type: 'REMOVE_ITEM' }),
  fc.constantFrom('SAVE5', 'SAVE10').map((code) => ({ type: 'APPLY_COUPON', code })),
);

const couponNeedsMinimumSpend = (s: Cart) => s.coupon === null || s.items * 1000 >= 2000;

test('coupon-needs-minimum-spend holds after every action', () => {
  fc.assert(
    fc.property(fc.array(action, { maxLength: 10 }), (actions) => {
      let state = emptyCart;
      for (const a of actions) {
        state = cart(state, a);
        if (!couponNeedsMinimumSpend(state)) return false;
      }
      return true;
    }),
  );
});
