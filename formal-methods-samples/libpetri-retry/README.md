# libpetri-retry

A checkout that retries the order API after a timeout while the first call is still running, so one checkout makes
two orders. Written in plain TypeScript and as a libpetri net, which the check proves can make two and, once fixed
with an idempotency key, at most one.

```sh
npm install
npm test
```

`npm run double` runs the natural test, "one checkout, one order", which fails.
