# stateproof-subscription

A subscription where a renewal reactivates a plan the customer canceled. Checked with stateproof.

stateproof is not on npm; `npm run setup` clones it. Needs Java for TLC. Set `TLA2TOOLS_JAR` to a `tla2tools.jar`, or stateproof downloads one.

```sh
npm run setup
npm test
```
