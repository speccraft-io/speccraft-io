import { expect, test } from 'vitest';
import { getShortestPaths } from 'xstate/graph';
import { signup } from './signup';
import { signup as fixedSignup } from './signup.fixed';

// The rule: nobody is signed up without accepting the terms.
// Returns the path to every reachable state that breaks it.
function brokenPaths(machine: typeof signup) {
  // One shortest path to every state (value and context) these events can reach.
  const paths = getShortestPaths(machine, { events: [{ type: 'TOGGLE' }, { type: 'NEXT' }, { type: 'SUBMIT' }] });
  return paths
    .filter((p) => p.state.value === 'submitted' && !p.state.context.accepted)
    .map((p) => p.steps.map((s) => s.event.type).join(' → '));
}

test('the original machine: submitted without the terms', () => {
  expect(brokenPaths(signup)).toEqual(['xstate.init → TOGGLE → NEXT → TOGGLE → SUBMIT']);
});

test('the fixed machine: the rule holds in every reachable state', () => {
  expect(brokenPaths(fixedSignup)).toEqual([]);
});
