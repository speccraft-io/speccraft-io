import { assign, setup } from 'xstate';

export const signup = setup({
  types: {
    context: {} as { accepted: boolean },
    events: {} as { type: 'TOGGLE' } | { type: 'NEXT' } | { type: 'SUBMIT' },
  },
  actions: { toggle: assign({ accepted: ({ context }) => !context.accepted }) },
}).createMachine({
  initial: 'terms',
  context: { accepted: false },
  states: {
    terms: {
      on: {
        TOGGLE: { actions: 'toggle' },
        NEXT: { target: 'review', guard: ({ context }) => context.accepted },
      },
    },
    // The review page shows the checkbox again, so users can change their mind.
    review: {
      on: {
        TOGGLE: { actions: 'toggle' },
        SUBMIT: 'submitted',
      },
    },
    submitted: { type: 'final' },
  },
});
