// Runs the check and the plain test and confirms each ends the way the page says: the check passes over the listed values, the total still goes negative.
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

expect('check', 0, 'no invariant violations reachable');
expect('negative', 1, 'total is -500');
