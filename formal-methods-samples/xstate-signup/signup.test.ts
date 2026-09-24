import { expect, test } from 'vitest';
import { createActor } from 'xstate';
import { signup } from './signup';

test('you cannot get past the terms without accepting them', () => {
  const actor = createActor(signup).start();
  actor.send({ type: 'NEXT' }); // not accepted: blocked
  expect(actor.getSnapshot().value).toBe('terms');
});
