// The search box as a net: typing sends a request, a reply fills the list.
import { PetriNet, Transition, one, outPlace, place } from 'libpetri';

export const typed = place<string>('typed'); // a query the user typed
export const inFlight = place<string>('inFlight'); // a request waiting for its reply
export const shown = place<string>('shown'); // the list, holding the query it was fetched for

export function searchNet(fetchResults: (query: string) => Promise<string[]>) {
  const send = Transition.builder('send')
    .inputs(one(typed))
    .outputs(outPlace(inFlight))
    .action(async (ctx) => {
      ctx.output(inFlight, ctx.input(typed));
    })
    .build();

  const reply = Transition.builder('reply')
    .inputs(one(inFlight))
    .outputs(outPlace(shown))
    .action(async (ctx) => {
      const query = ctx.input(inFlight);
      await fetchResults(query);
      ctx.output(shown, query);
    })
    .build();

  return PetriNet.builder('search').transitions(send, reply).build();
}
