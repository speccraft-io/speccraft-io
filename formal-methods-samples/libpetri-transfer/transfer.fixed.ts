// Two accounts, a lock each. The fix: every transfer locks the accounts in the same order.
import { Mutex } from 'async-mutex';

export const locks = { alice: new Mutex(), bob: new Mutex() };

export async function transfer(from: 'alice' | 'bob', to: 'alice' | 'bob') {
  const [first, second] = [from, to].sort() as [typeof from, typeof to];
  await locks[first].runExclusive(() =>
    locks[second].runExclusive(() => {
      // move the money
    }),
  );
}
