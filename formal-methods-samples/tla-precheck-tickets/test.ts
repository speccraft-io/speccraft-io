// Checks both machines and that each ends the way the page says: the bug is found, the fix holds.
import { spawnSync } from 'node:child_process';

const expect = (script: string, status: number, text: string) => {
  const result = spawnSync('npm', ['run', '--silent', script], { encoding: 'utf8' });
  const output = result.stdout + result.stderr;
  if (result.status !== status || !output.includes(text)) {
    console.error(output);
    throw new Error(`${script}: expected exit ${status} and "${text}"`);
  }
  console.log(`ok  ${script}: ${text}`);
};

expect('check', 1, 'Invariant oneSeatPerCustomer is violated');
expect('check:fixed', 0, '"proofPassed": true');
