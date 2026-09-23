// Checks both machines and that each ends the way the page says: the bug is found, the fix holds.
import { spawnSync } from 'node:child_process';
import { createRuntime } from './vendor/stateproof/packages/core/src/index.ts';
import { subscription } from './subscription.ts';

const expect = (script: string, status: number, text: string) => {
  const result = spawnSync('npm', ['run', '--silent', script], { encoding: 'utf8' });
  const output = result.stdout + result.stderr;
  if (result.status !== status || !output.includes(text)) {
    console.error(output);
    throw new Error(`${script}: expected exit ${status} and "${text}"`);
  }
  console.log(`ok  ${script}: ${text}`);
};

expect('verify', 1, '"invariant": "canceled_plans_are_not_renewed"');
expect('verify:fixed', 0, '"ok": true');

const rt = createRuntime(subscription);
rt.send('activate');
rt.send('cancel');
const renewed = rt.send('renew');
if (!renewed || rt.state !== 'active' || !rt.context.canceledByUser) throw new Error('expected the buggy runtime to renew a canceled plan');
console.log('ok  the runtime renews a canceled plan');
