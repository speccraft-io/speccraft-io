import { BitmapNetExecutor, tokenOf } from 'libpetri';
import { SmtVerifier, deadlockFree } from 'libpetri/verification';
import { describe, expect, it } from 'vitest';
import { transfer } from './transfer.js';
import { transfer as fixedTransfer } from './transfer.fixed.js';
import * as buggy from './net.js';
import * as fixed from './net.fixed.js';

// The rule: the net never gets stuck. When nothing can run, values are only in the accounts and in `done`.
const verify = (m: typeof buggy) =>
  SmtVerifier.forNet(m.net)
    .initialMarking((b) => b.tokens(m.aliceToBob.waiting, 1).tokens(m.bobToAlice.waiting, 1).tokens(m.alice, 1).tokens(m.bob, 1))
    .property(deadlockFree())
    .sinkPlaces(m.alice, m.bob, m.done)
    .verify();

const run = (m: typeof buggy) =>
  new BitmapNetExecutor(
    m.net,
    new Map<any, any[]>([
      [m.aliceToBob.waiting, [tokenOf('alice to bob')]],
      [m.bobToAlice.waiting, [tokenOf('bob to alice')]],
      [m.alice, [tokenOf('alice')]],
      [m.bob, [tokenOf('bob')]],
    ]),
  ).run();

describe('plain TypeScript', () => {
  it('one transfer at a time works', async () => {
    await transfer('alice', 'bob');
    await transfer('bob', 'alice');
  });

  it('two opposite transfers at once never finish', async () => {
    const both = Promise.all([transfer('alice', 'bob'), transfer('bob', 'alice')]).then(() => 'finished');
    const timeout = new Promise((resolve) => setTimeout(resolve, 100, 'still waiting'));
    expect(await Promise.race([both, timeout])).toBe('still waiting');
  });

  it('fixed: locking in the same order finishes', async () => {
    await Promise.all([fixedTransfer('alice', 'bob'), fixedTransfer('bob', 'alice')]);
  });
});

describe('libpetri', () => {
  it('as written: the check finds the steps to the hang', async () => {
    const result = await verify(buggy);
    console.log('as written:', result.verdict, result.counterexampleTransitions);
    expect(result.verdict.type).toBe('violated');
  });

  it('as written: the run ends stuck', async () => {
    const result = await run(buggy);
    console.log('run, as written: done =', result.tokenCount(buggy.done));
    expect(result.tokenCount(buggy.done)).toBe(0);
  });

  it('fixed: proven never stuck', async () => {
    const result = await verify(fixed);
    console.log('fixed:', result.verdict);
    expect(result.verdict.type).toBe('proven');
    expect((await run(fixed)).tokenCount(fixed.done)).toBe(2);
  });
});
