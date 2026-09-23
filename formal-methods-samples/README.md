# Formal methods samples

Small, self-contained case studies used on [speccraft.io](https://speccraft.io). Each folder is its own npm project: one realistic bug, checked with one TypeScript tool.

- [fast-check-webhook](fast-check-webhook): A webhook handler that charges a card twice when a retry races the first delivery. Checked with fast-check.
- [fake-timers-autosave](fake-timers-autosave): An autosave editor where a slow save reply overwrites newer text. Checked with fake timers.
- [hegel-stock-reservation](hegel-stock-reservation): Stock reservation with a quantity bug and a concurrent oversell. Checked with Hegel.
- [effect-job-lease](effect-job-lease): A job worker whose lease renewal lands after a cancel and revives the lease. Checked with Effect.
- [pnueli-distributed-lock](pnueli-distributed-lock): A distributed lock with lease expiry: two writers without fencing tokens. Checked with pnueli.
- [stifinder-outbox](stifinder-outbox): A transactional outbox relay that loses or duplicates events after a crash or retry. Checked with stifinder.
- [polygraph-coupon](polygraph-coupon): A cart reducer that keeps a minimum-spend coupon after an item is removed. Checked with Polygraph.
- [effect-machine-checkout](effect-machine-checkout): A checkout statechart where a late payment reply marks a changed cart paid. Checked with effect-machine.

Each one runs on its own:

```sh
cd <folder>
npm install
npm test
```
