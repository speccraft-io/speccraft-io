import { Machine } from '@typeonce/effect-machine';
import { Schema } from 'effect';

export const price = 10;

export const States = Machine.state({
  fields: { items: Schema.Number },
  states: {
    Cart: {},
    PaymentPending: { fields: { amount: Schema.Number } },
    Paid: { fields: { amount: Schema.Number } },
    Failed: {},
  },
});
export const targets = Machine.targets(States);

export const Events = Machine.events({
  AddItem: {},
  RemoveItem: {},
  Checkout: {},
  Back: {},
  PaymentSucceeded: { amount: Schema.Number },
  PaymentFailed: { amount: Schema.Number },
});

export const cart = {
  on: {
    AddItem: { update: targets.root, data: ({ root }: { root: { items: number } }) => ({ items: root.items + 1 }) },
    RemoveItem: {
      update: targets.root,
      data: ({ root }: { root: { items: number } }) => ({ items: root.items - 1 }),
    },
    Checkout: {
      target: targets.root.PaymentPending,
      data: ({ root }: { root: { items: number } }) => ({ amount: root.items * price }),
    },
  },
} as const;

export const machine = Machine.make({ root: States, events: Events }).handle({
  root: () => ({ items: 1 }),
  initial: { target: targets.root.Cart },
  states: {
    Cart: cart,
    PaymentPending: {
      on: {
        PaymentSucceeded: { target: targets.root.Paid, data: ({ event }) => ({ amount: event.amount }) },
        PaymentFailed: { target: targets.root.Failed },
      },
    },
    Paid: {},
    Failed: {},
  },
});
