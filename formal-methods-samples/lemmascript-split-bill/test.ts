// Checks both versions and that each ends the way the page says: the bug fails a proof, the fix is proved.
import { spawnSync } from 'node:child_process';
import { splitBill } from './src/splitBill.ts';

const expect = (script: string, status: number, text: string) => {
  const result = spawnSync('npm', ['run', '--silent', script], { encoding: 'utf8' });
  const output = result.stdout + result.stderr;
  if (result.status !== status || !output.includes(text)) {
    console.error(output);
    throw new Error(`${script}: expected exit ${status} and "${text}"`);
  }
  console.log(`ok  ${script}: ${text}`);
};

expect('check', 1, 'ensures (splitBill(total, people).last >= 0)');
expect('check:fixed', 0, '0 errors');

const { last } = splitBill(341, 20);
if (last !== -1) throw new Error(`splitBill(341, 20).last: expected -1, got ${last}`);
console.log('ok  splitBill(341, 20) leaves the last person at -1');
