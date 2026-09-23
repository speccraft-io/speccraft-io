import { stateKey } from '@botiroff/pnueli';
import type { Action, Invariant, Spec } from '@botiroff/pnueli';
import type { State } from './lock.js';

export type Lock = typeof import('./lock.js');

function step(next: State | null): State[] {
  return next === null ? [] : [next];
}

function nodeActions(i: number, n: number, lock: Lock): Action<State>[] {
  return [
    {
      name: `n${i} acquires lock`,
      process: i,
      reads: ['nodes', 'epoch'],
      writes: ['nodes', 'epoch'],
      step: (s) => step(lock.acquire(s, i)),
    },
    {
      name: `n${i} writes`,
      process: i,
      reads: ['nodes', 'newest', 'stale'],
      writes: ['nodes', 'newest', 'stale'],
      step: (s) => step(lock.write(s, i)),
    },
    {
      name: `n${i} releases lock`,
      process: i,
      reads: ['nodes'],
      writes: ['nodes'],
      step: (s) => step(lock.release(s, i)),
    },
    {
      name: `lease of n${i} expires`,
      process: n,
      reads: ['nodes'],
      writes: ['nodes'],
      step: (s) => step(lock.expire(s, i)),
    },
  ];
}

function sortNodes(s: State): State {
  return { ...s, nodes: [...s.nodes].sort((a, b) => stateKey(a).localeCompare(stateKey(b))) };
}

export const noStaleWrite: Invariant<State> = {
  name: 'the store never takes a write older than one it already took',
  reads: ['stale'],
  holds: (s) => !s.stale,
};

export const n0Writes: Invariant<State> = {
  name: 'n0 gets a write in',
  reads: ['nodes'],
  holds: (s) => s.nodes[0]?.phase === 'wrote',
};

export const someNodeWrites: Invariant<State> = {
  name: 'some node gets a write in',
  reads: ['nodes'],
  holds: (s) => s.nodes.some((node) => node.phase === 'wrote'),
};

export function lockSpec(n: number, store: string, lock: Lock, symmetry: boolean): Spec<State> {
  return {
    name: `lock, ${n} nodes, store ${store}${symmetry ? ', symmetry' : ''}`,
    processes: n + 1,
    init: [lock.init(n)],
    actions: Array.from({ length: n }, (_, i) => nodeActions(i, n, lock)).flat(),
    invariants: [noStaleWrite],
    ...(symmetry ? { symmetry: sortNodes } : {}),
  };
}
