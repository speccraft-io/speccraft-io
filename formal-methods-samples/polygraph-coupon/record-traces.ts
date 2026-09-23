// Records real runs of the reducer as Polygraph traces: one {pre, action, data, post} line per step.
import { mkdirSync, rmSync } from 'node:fs';
import { tapReducer } from '@cognitive-fab/polygraph/scripts/instrument/trace-emitter.mjs';
import { cart as buggy, emptyCart, type Cart, type CartAction } from './cart.ts';
import { cart as fixed } from './cart.fixed.ts';

const reducer = process.argv.includes('--fixed') ? fixed : buggy;
const file = 'traces/sessions.ndjson';
mkdirSync('traces', { recursive: true });
rmSync(file, { force: true });

const sessions: CartAction[][] = [
  [{ type: 'ADD_ITEM' }, { type: 'APPLY_COUPON', code: 'SAVE5' }, { type: 'ADD_ITEM' }, { type: 'APPLY_COUPON', code: 'SAVE5' }],
  [{ type: 'ADD_ITEM' }, { type: 'ADD_ITEM' }, { type: 'ADD_ITEM' }, { type: 'ADD_ITEM' }, { type: 'APPLY_COUPON', code: 'SAVE10' }],
  [{ type: 'REMOVE_ITEM' }, { type: 'ADD_ITEM' }, { type: 'ADD_ITEM' }, { type: 'ADD_ITEM' }, { type: 'APPLY_COUPON', code: 'SAVE5' }, { type: 'REMOVE_ITEM' }],
];

const traced = tapReducer(reducer, (s: Cart) => s, file);
for (const session of sessions) session.reduce(traced, emptyCart);
