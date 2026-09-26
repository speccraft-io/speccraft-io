// The same checkout as a net. The API call is its own step, because the second order is made there.
import { PetriNet, Transition, and, delayed, one, outPlace, place } from 'libpetri';
import type { Api } from './api.js';

export const requests = place<string>('requests');
export const waiting = place<string>('waiting'); // the checkout waits for a reply
export const pending = place<string>('pending'); // the API is creating an order
export const orders = place<string>('orders');

export function checkoutNet(api: Api, timeoutMs: number) {
  const send = Transition.builder('send')
    .inputs(one(requests))
    .outputs(and(outPlace(waiting), outPlace(pending)))
    .action(async (ctx) => {
      ctx.output(waiting, ctx.input(requests));
      ctx.output(pending, ctx.input(requests));
    })
    .build();

  // The bug: after the timeout the checkout sends again while the first call is still pending.
  const retry = Transition.builder('retry')
    .inputs(one(waiting))
    .outputs(outPlace(pending))
    .timing(delayed(timeoutMs))
    .action(async (ctx) => {
      ctx.output(pending, ctx.input(waiting));
    })
    .build();

  const create = Transition.builder('create')
    .inputs(one(pending))
    .outputs(outPlace(orders))
    .action(async (ctx) => {
      ctx.output(orders, await api.createOrder(ctx.input(pending)));
    })
    .build();

  return PetriNet.builder('checkout').transitions(send, retry, create).build();
}
