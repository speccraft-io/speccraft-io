import { BitmapNetExecutor, tokenOf } from 'libpetri';
import { SmtVerifier, placeBound } from 'libpetri/verification';
import { describe, expect, it } from 'vitest';
import { fakeApi } from './api.js';
import * as buggy from './net.js';
import * as fixed from './net.fixed.js';

// The rule: one checkout never makes more than one order.
const verify = (m: typeof buggy) =>
  SmtVerifier.forNet(m.checkoutNet(fakeApi(0).api, 10))
    .initialMarking((b) => b.tokens(m.requests, 1))
    .property(placeBound(m.orders, 1))
    .verify();

const run = async (m: typeof buggy) => {
  const { api, orders } = fakeApi(30);
  await new BitmapNetExecutor(m.checkoutNet(api, 10), new Map<any, any[]>([[m.requests, [tokenOf('cart-1')]]])).run();
  return orders;
};

describe('libpetri', () => {
  it('as written: the check finds the steps to the second order', async () => {
    const result = await verify(buggy);
    console.log('as written:', result.verdict, result.counterexampleTransitions);
    expect(result.verdict.type).toBe('violated');
  });

  it('as written: the run makes two orders', async () => {
    const orders = await run(buggy);
    console.log('run, as written: orders =', orders);
    expect(orders).toHaveLength(2);
  });

  it('fixed: proven one order at most', async () => {
    const result = await verify(fixed);
    console.log('fixed:', result.verdict);
    expect(result.verdict.type).toBe('proven');
    expect(await run(fixed)).toHaveLength(1);
  });
});
