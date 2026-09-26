# polygraph-coupon

A cart reducer that keeps a minimum-spend coupon after an item is removed. Checked with Polygraph.

```sh
npm install
npm test          # record traces, replay, model check: the bug is found, the fix holds
npm run coupon    # the plain test that fails on the buggy cart
npm run fastcheck # the same rule checked by fast-check on the real reducer
```
