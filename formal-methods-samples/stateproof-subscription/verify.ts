// Model-checks the subscription with TLC and prints stateproof's result.
import { resolve } from 'node:path';
import { verify } from './vendor/stateproof/packages/core/src/index.ts';

const fixed = process.argv.includes('--fixed');
const { subscription } = await import(fixed ? './subscription.fixed.ts' : './subscription.ts');

const jar = process.env.TLA2TOOLS_JAR;
const result = await verify(subscription, jar ? { tlcPath: resolve(jar) } : {});
const { tlaSpec, tlcOutput, ...summary } = result;
console.log(JSON.stringify(summary, null, 2));
process.exit(result.ok ? 0 : 1);
