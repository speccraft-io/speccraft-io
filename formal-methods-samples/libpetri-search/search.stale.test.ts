import { expect, it } from 'vitest';
import { createSearch } from './search.js';

it('the list matches the box', async () => {
  const delay = { rea: 30, react: 10 }; // the reply for "rea" is slower
  const search = createSearch(async (q) => {
    await new Promise((r) => setTimeout(r, delay[q as keyof typeof delay]));
    return [`results for ${q}`];
  });
  await Promise.all([search.onInput('rea'), search.onInput('react')]);
  expect(search.state.results).toEqual([`results for ${search.state.query}`]);
});
