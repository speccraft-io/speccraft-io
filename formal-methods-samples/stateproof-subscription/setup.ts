// stateproof is not on npm: clone it at the commit this sample was checked with.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('vendor/stateproof')) {
  execFileSync('git', ['clone', '--quiet', 'https://github.com/HexaField/stateproof', 'vendor/stateproof'], { stdio: 'inherit' });
}
execFileSync('git', ['-C', 'vendor/stateproof', 'checkout', '--quiet', '4cb6308'], { stdio: 'inherit' });
