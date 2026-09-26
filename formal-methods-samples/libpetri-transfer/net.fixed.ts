// The same two transfers as a libpetri net.
import { PetriNet, Transition, and, one, outPlace, place } from 'libpetri';

// A place holds values. An account's place holds one value while its lock is free.
export const alice = place<string>('alice');
export const bob = place<string>('bob');
export const done = place<string>('done');

// A transition is a step. It runs when every place it takes from has a value.
function transfer(from: typeof alice, to: typeof alice) {
  const waiting = place<string>(`${from.name} to ${to.name}`);

  // The fix: one step takes both locks at once, or waits for both.
  const lockBothAndMove = Transition.builder(`${from.name} to ${to.name}: lock both, move`)
    .inputs(one(waiting), one(from), one(to))
    .outputs(and(outPlace(from), outPlace(to), outPlace(done)))
    .action(async (ctx) => {
      // move the money, then free both locks
      ctx.output(from, ctx.input(from));
      ctx.output(to, ctx.input(to));
      ctx.output(done, ctx.input(waiting));
    })
    .build();

  return { waiting, steps: [lockBothAndMove] };
}

export const aliceToBob = transfer(alice, bob);
export const bobToAlice = transfer(bob, alice);

export const net = PetriNet.builder('transfers')
  .transitions(...aliceToBob.steps, ...bobToAlice.steps)
  .build();
