import { Machine } from '@typeonce/effect-machine';
import { Schema } from 'effect';

export const price = 10;

export const States = Machine.state({
  // Shared by every state: the number of items in the cart.
  fields: { items: Schema.Number },
  states: {
    Cart: {},
    PaymentPending: { fields: { amount: Schema.Number } },
    Paid: { fields: { amount: Schema.Number } },
  },
});
export const targets = Machine.targets(States);

export const Events = Machine.events({
  AddItem: {},
  Checkout: {},
  Back: {},
  // The payment reply carries the amount it was for.
  PaymentSucceeded: { amount: Schema.Number },
});

type Root = { root: { items: number } };

export const machine = Machine.make({ root: States, events: Events }).handle({
  root: () => ({ items: 1 }),
  initial: { target: targets.root.Cart },
  states: {
    Cart: {
      on: {
        AddItem: { update: targets.root, data: ({ root }: Root) => ({ items: root.items + 1 }) },
        Checkout: { target: targets.root.PaymentPending, data: ({ root }: Root) => ({ amount: root.items * price }) },
      },
    },
    PaymentPending: {
      on: {
        PaymentSucceeded: { target: targets.root.Paid, data: ({ event }) => ({ amount: event.amount }) },
      },
    },
    Paid: {},
  },
});
