// Runs Bombadil against both versions and checks each ends the way the page says. Needs Chrome.
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const bombadil = (label: string, fixed: boolean, status: number, text: string) =>
  (async () => {
    const server = spawn('node', ['server.ts', ...(fixed ? ['--fixed'] : [])], { stdio: 'ignore' });
    await sleep(500);
    const result = spawnSync('npx', ['bombadil', 'browser', 'test', 'http://localhost:4500', 'spec.ts',
      '--time-limit=30s', '--exit-on-violation', '--output-path', `out/${label}`, '--output-path-overwrite',
      '--chrome-grant-permissions=geolocation'], { encoding: 'utf8' });
    server.kill();
    const output = result.stdout + result.stderr;
    if (result.status !== status || !output.includes(text)) {
      console.error(output);
      throw new Error(`${label}: expected exit ${status} and "${text}"`);
    }
    console.log(`ok  ${label}: ${text}`);
  })();

await bombadil('buggy', false, 2, 'at_most_one_order was violated');
await bombadil('fixed', true, 0, 'Test finished after time limit');
