// Two accounts, a lock each. A transfer locks the sender, then the receiver.
import { Mutex } from 'async-mutex';

export const locks = { alice: new Mutex(), bob: new Mutex() };

export async function transfer(from: 'alice' | 'bob', to: 'alice' | 'bob') {
  await locks[from].runExclusive(() =>
    locks[to].runExclusive(() => {
      // move the money
    }),
  );
}
