# tla-precheck-tickets

A ticket shop where the one-seat-per-customer limit counts only held seats, so a customer can buy a seat and hold another. Checked with tla-precheck.

Needs Java 17 or newer. `npx tla-precheck setup` downloads TLC; or point `TLA2TOOLS_JAR` at a `tla2tools.jar`.

```sh
npm install
npx tla-precheck setup
npm test
```
