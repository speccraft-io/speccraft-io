import { it } from 'vitest';
import { transfer } from './transfer.js';

it('two transfers at once both finish', async () => {
  await Promise.all([transfer('alice', 'bob'), transfer('bob', 'alice')]);
}, 1000);
