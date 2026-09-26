// The same two transfers in petri-ts, the other TypeScript Petri net with a deadlock check.
// Tokens are plain counts, and there is no way to name the places where a run may end.
import { analyse } from 'petri-ts';
import { describe, expect, it } from 'vitest';

const buggy = {
  transitions: [
    { name: 'alice to bob: lock alice', inputs: ['aliceToBob', 'alice'], outputs: ['aliceToBobHolding'] },
    { name: 'alice to bob: lock bob, move', inputs: ['aliceToBobHolding', 'bob'], outputs: ['alice', 'bob', 'done'] },
    { name: 'bob to alice: lock bob', inputs: ['bobToAlice', 'bob'], outputs: ['bobToAliceHolding'] },
    { name: 'bob to alice: lock alice, move', inputs: ['bobToAliceHolding', 'alice'], outputs: ['alice', 'bob', 'done'] },
  ],
  initialMarking: { aliceToBob: 1, bobToAlice: 1, alice: 1, bob: 1, aliceToBobHolding: 0, bobToAliceHolding: 0, done: 0 },
};
const fixed = {
  transitions: [
    { name: 'alice to bob: lock both, move', inputs: ['aliceToBob', 'alice', 'bob'], outputs: ['alice', 'bob', 'done'] },
    { name: 'bob to alice: lock both, move', inputs: ['bobToAlice', 'alice', 'bob'], outputs: ['alice', 'bob', 'done'] },
  ],
  initialMarking: { aliceToBob: 1, bobToAlice: 1, alice: 1, bob: 1, done: 0 },
};

describe('petri-ts', () => {
  it('as written: finds the hang, as a terminal state with both transfers holding one lock', () => {
    const result = analyse(buggy);
    console.log('petri-ts, as written:', result.isDeadlockFree, JSON.stringify(result.terminalStates));
    expect(result.isDeadlockFree).toBe(false);
    expect(result.terminalStates).toContainEqual(expect.objectContaining({ aliceToBobHolding: 1, bobToAliceHolding: 1 }));
  });

  it('fixed: still reports a deadlock, because a finished run is a terminal state too', () => {
    const result = analyse(fixed);
    console.log('petri-ts, fixed:', result.isDeadlockFree, JSON.stringify(result.terminalStates));
    expect(result.isDeadlockFree).toBe(false);
    expect(result.terminalStates).toEqual([{ aliceToBob: 0, bobToAlice: 0, alice: 1, bob: 1, done: 2 }]);
  });
});
