// Serves the checkout page. Each POST /orders creates an order after 500 ms, like a real payment call.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const fixed = process.argv.includes('--fixed');
const port = Number(process.env.PORT ?? 4500);
let nextId = 1;

createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/orders') {
    const id = nextId++;
    if (process.env.LOG) console.log('POST /orders', id);
    setTimeout(() => res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id })), 500);
    return;
  }
  if (req.url === '/checkout.js') {
    res.writeHead(200, { 'content-type': 'text/javascript' }).end(readFileSync(fixed ? 'checkout.fixed.js' : 'checkout.js'));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html' }).end(readFileSync('public/index.html'));
}).listen(port, () => console.log(`checkout${fixed ? ' (fixed)' : ''} on http://localhost:${port}`));
