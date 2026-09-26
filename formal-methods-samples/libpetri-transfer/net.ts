// The same two transfers as a libpetri net.
import { PetriNet, Transition, and, one, outPlace, place } from 'libpetri';

// A place holds values. An account's place holds one value while its lock is free.
export const alice = place<string>('alice');
export const bob = place<string>('bob');
export const done = place<string>('done');

// A transition is a step. It runs when every place it takes from has a value.
function transfer(from: typeof alice, to: typeof alice) {
  const waiting = place<string>(`${from.name} to ${to.name}`);
  const holding = place<string>(`${from.name} to ${to.name}, holding ${from.name}`);

  const lockFrom = Transition.builder(`${from.name} to ${to.name}: lock ${from.name}`)
    .inputs(one(waiting), one(from))
    .outputs(outPlace(holding))
    .action(async (ctx) => {
      ctx.output(holding, ctx.input(waiting));
    })
    .build();

  // The bug: it holds `from` while it waits for `to`.
  const lockToAndMove = Transition.builder(`${from.name} to ${to.name}: lock ${to.name}, move`)
    .inputs(one(holding), one(to))
    .outputs(and(outPlace(from), outPlace(to), outPlace(done)))
    .action(async (ctx) => {
      // move the money, then free both locks
      ctx.output(from, from.name);
      ctx.output(to, ctx.input(to));
      ctx.output(done, ctx.input(holding));
    })
    .build();

  return { waiting, steps: [lockFrom, lockToAndMove] };
}

export const aliceToBob = transfer(alice, bob);
export const bobToAlice = transfer(bob, alice);

export const net = PetriNet.builder('transfers')
  .transitions(...aliceToBob.steps, ...bobToAlice.steps)
  .build();
