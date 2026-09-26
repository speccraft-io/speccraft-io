# libpetri-transfer

Two opposite transfers that each lock one account and wait for the other, so both hang. Written in plain TypeScript
and as a libpetri net, which the check proves stuck and, once fixed, never stuck.

```sh
npm install
npm test
```

`npm run hang` runs the natural test, "two transfers at once both finish", which times out.
