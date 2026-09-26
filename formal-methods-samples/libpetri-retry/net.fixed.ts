// The fix: one idempotency key per checkout. The API creates one order per key and ignores the rest.
import { PetriNet, Transition, and, delayed, one, outPlace, place } from 'libpetri';
import type { Api } from './api.js';

export const requests = place<string>('requests');
export const waiting = place<string>('waiting');
export const pending = place<string>('pending');
export const key = place<string>('key'); // the idempotency key, not used yet
export const orders = place<string>('orders');
export const ignored = place<string>('ignored');

export function checkoutNet(api: Api, timeoutMs: number) {
  const send = Transition.builder('send')
    .inputs(one(requests))
    .outputs(and(outPlace(waiting), outPlace(pending), outPlace(key)))
    .action(async (ctx) => {
      ctx.output(waiting, ctx.input(requests));
      ctx.output(pending, ctx.input(requests));
      ctx.output(key, ctx.input(requests));
    })
    .build();

  const retry = Transition.builder('retry')
    .inputs(one(waiting))
    .outputs(outPlace(pending))
    .timing(delayed(timeoutMs))
    .action(async (ctx) => {
      ctx.output(pending, ctx.input(waiting));
    })
    .build();

  // Creating an order uses up the key.
  const create = Transition.builder('create')
    .inputs(one(pending), one(key))
    .outputs(outPlace(orders))
    .action(async (ctx) => {
      ctx.output(orders, await api.createOrder(ctx.input(pending)));
    })
    .build();

  // A call with a used key makes no order.
  const duplicate = Transition.builder('duplicate')
    .inputs(one(pending))
    .inhibitor(key)
    .outputs(outPlace(ignored))
    .action(async (ctx) => {
      ctx.output(ignored, ctx.input(pending));
    })
    .build();

  return PetriNet.builder('checkout').transitions(send, retry, create, duplicate).build();
}
