// Runs the whole loop and checks each step ends the way the page says: the bug is found, the fix holds.
import { spawnSync } from 'node:child_process';

const run = (script: string) => spawnSync('npm', ['run', '--silent', script], { encoding: 'utf8' });
const expect = (script: string, status: number, text: string) => {
  const result = run(script);
  const output = result.stdout + result.stderr;
  if (result.status !== status || !output.includes(text)) {
    console.error(output);
    throw new Error(`${script}: expected exit ${status} and "${text}"`);
  }
  console.log(`ok  ${script}: ${text}`);
};

expect('record', 0, '');
expect('replay', 0, '15/15 windows consistent');
expect('check', 1, 'coupon-needs-minimum-spend');
expect('record:fixed', 0, '');
expect('check:fixed', 0, 'no invariant violations reachable');
