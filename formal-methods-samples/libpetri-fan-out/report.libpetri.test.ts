import { BitmapNetExecutor, tokenOf } from 'libpetri';
import { SmtVerifier, quiescentCount } from 'libpetri/verification';
import { describe, expect, it } from 'vitest';
import * as buggy from './report.js';
import * as fixed from './report.fixed.js';

// The rule: once nothing can run, both connections are back in the pool.
const verify = (m: typeof buggy) =>
  SmtVerifier.forNet(m.reportNet({ query: async () => [] }))
    .initialMarking((b) => b.tokens(m.requests, 2).tokens(m.pool, 2))
    .property(quiescentCount([m.pool], 2, 2))
    .verify();

// Runs the real net: two report requests, and the invoices query fails.
const run = (m: typeof buggy) =>
  new BitmapNetExecutor(
    m.reportNet({
      query: async (_conn, table) => {
        if (table === 'invoices') throw new Error('invoices: connection reset');
        return ['row'];
      },
    }),
    new Map<any, any[]>([
      [m.requests, [tokenOf('report 1'), tokenOf('report 2')]],
      [m.pool, [tokenOf({ id: 1 }), tokenOf({ id: 2 })]],
    ]),
  ).run();

describe('report fan-out', () => {
  it('the happy path passes', async () => {
    const result = await new BitmapNetExecutor(
      buggy.reportNet({ query: async () => ['row'] }),
      new Map<any, any[]>([
        [buggy.requests, [tokenOf('report 1')]],
        [buggy.pool, [tokenOf({ id: 1 }), tokenOf({ id: 2 })]],
      ]),
    ).run();
    expect(result.tokenCount(buggy.reports)).toBe(1);
    expect(result.tokenCount(buggy.pool)).toBe(2);
  });

  it('as written: a failed query keeps its connection', async () => {
    const result = await verify(buggy);
    expect(result.verdict.type).toBe('violated');
    expect(result.counterexampleTransitions).toContain('fail');
  });

  it('as written: the second report never starts', async () => {
    const result = await run(buggy);
    expect(result.tokenCount(buggy.pool)).toBe(1);
    expect(result.tokenCount(buggy.requests)).toBe(1);
  });

  it('fixed: every connection comes back', async () => {
    expect((await verify(fixed)).verdict.type).toBe('proven');
    const result = await run(fixed);
    expect(result.tokenCount(fixed.pool)).toBe(2);
    expect(result.tokenCount(fixed.errors)).toBe(2);
  });
});
