import { describe, expect, it } from '@effect/vitest';
import { Machine } from '@typeonce/effect-machine';
import { MachineTest } from '@typeonce/effect-machine/testing';
import { Effect, Option } from 'effect';
import { Events, machine, price, States, targets } from './checkout.js';
import { machine as fixedMachine } from './checkout.fixed.js';

type Snapshot = Machine.Snapshot<typeof States>;
type Event = Machine.Machine.InputEvent<typeof machine>;
type Step = { readonly event: Event; readonly before: Snapshot };

// The rule: in Paid, the paid amount is the cart total.
function paidMatchesCart(snapshot: Snapshot): true | string {
  const total = snapshot.value.items * price;
  return States.get(snapshot, 'Paid').pipe(
    Option.match({
      onNone: () => true,
      onSome: ({ amount }) => amount === total || `paid ${amount} for a cart of ${total}`,
    }),
  );
}

// What the user can do: add a second item and check out in Cart, press Back while paying.
function userEvents(snapshot: Snapshot): Event[] {
  if (States.matches(snapshot, 'Cart')) {
    return snapshot.value.items < 2 ? [{ _tag: 'Checkout' }, { _tag: 'AddItem' }] : [{ _tag: 'Checkout' }];
  }
  return States.matches(snapshot, 'PaymentPending') ? [{ _tag: 'Back' }] : [];
}

// Every charge still waiting for its reply: each Checkout adds one, each reply removes one.
function inFlight(steps: readonly Step[]): number[] {
  const amounts = new Set<number>();
  for (const { event, before } of steps) {
    if (event._tag === 'Checkout' && States.matches(before, 'Cart')) amounts.add(before.value.items * price);
    if (event._tag === 'PaymentSucceeded') amounts.delete(event.amount);
  }
  return [...amounts].sort((a, b) => a - b);
}

function explore(m: typeof machine, replies: 'current' | 'in-flight') {
  return MachineTest.explore(m, {
    events: ({ snapshot, trace }) => [
      ...userEvents(snapshot),
      ...(replies === 'current'
        ? States.get(snapshot, 'PaymentPending').pipe(
            Option.match({ onNone: () => [], onSome: ({ amount }) => [{ _tag: 'PaymentSucceeded', amount } as Event] }),
          )
        : inFlight(trace.steps).map((amount) => ({ _tag: 'PaymentSucceeded', amount }) as Event)),
    ],
    // Two snapshots with different replies in flight are different states.
    stateKey: ({ snapshot, trace }) => JSON.stringify([snapshot, inFlight(trace.steps)]),
    invariants: [MachineTest.invariants(m).state('the paid amount matches the cart', ({ snapshot }) => paidMatchesCart(snapshot))],
  });
}

// The same checkout with the charge as an invoke: the explorer does not run it.
const invokeMachine = Machine.make({
  root: States,
  events: Events,
  effects: { charge: (amount: number) => Effect.succeed(amount) },
}).handle({
  root: () => ({ items: 1 }),
  initial: { target: targets.root.Cart },
  states: {
    Cart: {
      on: {
        AddItem: { update: targets.root, data: ({ root }) => ({ items: root.items + 1 }) },
        Checkout: { target: targets.root.PaymentPending, data: ({ root }) => ({ amount: root.items * price }) },
      },
    },
    PaymentPending: {
      invoke: {
        src: 'charge',
        input: ({ state }) => state.amount,
        onDone: { target: targets.root.Paid, data: ({ output }) => ({ amount: output }) },
      },
      on: { Back: { target: targets.root.Cart } },
    },
    Paid: {},
  },
});

describe('checkout under effect-machine', () => {
  it.effect('the invoke version never reaches Paid: the invoke is not run', () =>
    Effect.gen(function* () {
      const explored = yield* MachineTest.explore(invokeMachine, {
        events: ({ snapshot }) => userEvents(snapshot),
        stateKey: ({ snapshot }) => JSON.stringify(snapshot),
      });
      console.log('invoke:', explored.stats, explored.completeness._tag);
      expect(explored.completeness._tag).toBe('Complete');
      expect(explored.nodes.some((node) => States.matches(node.snapshot, 'Paid'))).toBe(false);
    }),
  );

  it.effect('passes when only the reply to the current charge is sent', () =>
    Effect.gen(function* () {
      const explored = yield* explore(machine, 'current');
      console.log('current reply:', explored.stats, explored.completeness._tag);
      expect(explored.completeness._tag).toBe('Complete');
    }),
  );

  it.effect('finds the late reply when every reply still in flight is sent', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(explore(machine, 'in-flight'));
      expect(error._tag).toBe('MachineTestInvariantError');
      if (error._tag !== 'MachineTestInvariantError') return;
      console.log(error.trace.steps.map((step) => JSON.stringify(step.event)).join(' → '));
      console.log(error.violations.map((violation) => violation.message));
      expect(error.trace.steps.map((step) => step.event._tag)).toEqual(['Checkout', 'Back', 'AddItem', 'Checkout', 'PaymentSucceeded']);
    }),
  );

  it.effect('holds on the fixed machine with every reply still in flight', () =>
    Effect.gen(function* () {
      const explored = yield* explore(fixedMachine, 'in-flight');
      console.log('fixed:', explored.stats, explored.completeness._tag);
      expect(explored.completeness._tag).toBe('Complete');
    }),
  );
});
