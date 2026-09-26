import { SmtVerifier, placeBound } from 'libpetri/verification';
import { describe, expect, it } from 'vitest';
import { inFlight, searchNet, typed } from './net.js';

describe('libpetri', () => {
  it('can prove a count: never more than two requests in flight', async () => {
    const result = await SmtVerifier.forNet(searchNet(async () => []))
      .initialMarking((b) => b.tokens(typed, 2))
      .property(placeBound(inFlight, 2))
      .verify();
    console.log(result.verdict);
    expect(result.verdict.type).toBe('proven');
  });

  // There is no test for the rule that matters, "the list matches the box": none of libpetri's
  // eight properties can compare what the `shown` token carries with what the user typed last.
});
