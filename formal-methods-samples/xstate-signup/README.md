# xstate-signup

A signup written as an XState machine. The review page shows the terms checkbox again, and Submit does not check it,
so a user can be signed up without accepting the terms. `xstate/graph` walks every reachable state and finds the path.

```sh
npm install
npm test
```

- `signup.ts`: the machine with the bug.
- `signup.fixed.ts`: the same machine with the fix.
- `signup.test.ts`: a normal unit test that passes on the buggy machine.
- `signup.graph.test.ts`: walks every reachable state of both machines and checks the rule.
