# Use case bank

Real TypeScript use cases that break in ways formal methods can catch. Each one gets worked through with the tools
that fit it. Put together, the cases form a map: which problem, which tools, how well each did, and which one to use.

Not published yet. The site's problem × tool pages will be built from this folder.

## Per case (later)

```text
bank/NN-name/
├── README.md        the use case, the TS code with the bug, the rule it breaks, the fix
├── ts/              the buggy and fixed code and a passing unit test that misses the bug
└── tools/<tool>/    that tool's take: the model or proof, real output, time spent, verdict
```

Each case ends with a bottom line: which tools found the bug, how much work each took, what each one could not say,
and which one to use.

## Tool groups

- **Model checkers** walk every order of steps: TLA+, Quint, pnueli, SpecCraft TS, stifinder, stateproof,
  tla-precheck.
- **Samplers** try many random inputs and orders: fast-check, Hegel, Bombadil.
- **Provers** prove a function right for every input: Lean, Dafny, LemmaScript.
- **Statechart explorers**: effect-machine.

"Used on" means a site page already works through that case.

## A. Order of async steps

| # | Use case | What goes wrong | Rule | Fits | Used on |
|---|---|---|---|---|---|
| 1 | Search as you type | A slow reply for "rea" lands after the one for "react" and replaces the list | The list matches the box | Quint, TLA+, fast-check | Quint |
| 2 | Single-flight (one shared call per key) | A failed call stays in the map, so the key fails forever | Every caller gets a value in the end | TLA+, Quint, pnueli | TLA+ |
| 3 | Webhook handler | The same event arrives twice and the card is charged twice | One charge per order | fast-check, Quint, SpecCraft TS | fast-check |
| 4 | Token refresh in two tabs | Both tabs refresh at once; with rotating refresh tokens the second one is rejected and the user is logged out | The user stays logged in | TLA+, Quint, fast-check | |
| 5 | Autosave | An edit made while a save is in flight is never saved | The saved text is the last edit, in the end | TLA+, Quint, fast-check | |
| 6 | Subscribe after setup | Events sent while `await setup()` runs are lost | Every event sent is received | TLA+, Quint, pnueli | |
| 7 | `Promise.all` fan-out | One branch fails; the others keep their connections open | Everything acquired is released | TLA+, Quint, stifinder | |
| 8 | Timeout around a call | The timeout fires, but the work keeps going and writes its result later | No side effect after the timeout | TLA+, Quint, fast-check | |
| 9 | Cancel button | Stop is pressed, but the upload loop never checks the signal | After cancel, no more chunks are sent | Quint, fast-check, TLA+ | |
| 10 | Optimistic like button | Two quick clicks; the replies arrive out of order and the count is off | The UI matches the server once replies stop | Quint, fast-check, Bombadil | |
| 11 | Stock reservation | Two orders take the last item | Stock never goes below zero | Hegel, fast-check, TLA+ | Hegel |
| 12 | Checkout button | A double click places the order twice | One order per checkout | Bombadil, fast-check | Bombadil |
| 13 | Retry after timeout | The first attempt lands after all, and the retry creates a second order | At most one order per idempotency key | TLA+, Quint, fast-check | |
| 14 | Cache invalidation | A slow read from before a write fills the cache with the old value | After a write, reads see the new value in the end | TLA+, Quint, pnueli | |

## B. Workflows and state machines

| # | Use case | What goes wrong | Rule | Fits | Used on |
|---|---|---|---|---|---|
| 15 | Payment hold and 24h timer | An approval and the timer both run: the money is captured and released | Never both; every hold is settled | TLA+, Quint, pnueli | TLA+ (earlier version) |
| 16 | Subscription | A canceled plan is renewed | No renewal after cancel | stateproof, TLA+, Quint | stateproof |
| 17 | Checkout with Back | Back during a pending payment lets the old cart's reply mark the new cart paid | A cart is paid only for its own total | effect-machine, Quint | effect-machine |
| 18 | Transactional outbox | A crash between writing and sending sends a message twice or not at all | Every message is sent, and only once | stifinder, TLA+, Quint | stifinder |
| 19 | Lock with a lease | A paused holder wakes up after its lease ran out, and two holders write | One holder at a time | pnueli, TLA+, Quint | pnueli |
| 20 | Saga with compensation | The refund runs before the charge has finished | Compensations undo exactly what happened | TLA+, Quint, stifinder | |
| 21 | Crosswalk lights | Cars and walkers get green at once | Never both green | SpecCraft TS, TLA+, effect-machine | SpecCraft TS |
| 22 | Ticket shop | The per-customer limit is checked before an earlier order is counted | No customer goes over the limit | tla-precheck, TLA+, Quint | tla-precheck |
| 23 | Job queue with a visibility timeout | A slow worker's job reappears and is processed twice; a crashed worker's job never returns | Every job is done exactly once | TLA+, Quint, pnueli | |
| 24 | Multi-step form | Async validation of step 1 finishes after the user is on step 3 and sends them back | The step shown matches the user's last action | effect-machine, Quint, Bombadil | |
| 25 | WebSocket reconnect | Messages sent during a reconnect are lost or sent twice | Each message is delivered once, in order | TLA+, Quint, fast-check | |

## C. Values and arithmetic, for every input

| # | Use case | What goes wrong | Rule | Fits | Used on |
|---|---|---|---|---|---|
| 26 | Percentage discount with a cap | `percent` over 100 makes the price negative | The price never goes below zero | Lean, Dafny, LemmaScript, fast-check | Lean |
| 27 | Bill split | 100 split three ways gives 33.33 each and loses a cent | The parts add up to the total | LemmaScript, Lean, Dafny | LemmaScript |
| 28 | Retry backoff with jitter | The delays add up to more than the time budget | Total wait stays within the budget | Lean, Dafny, fast-check | |
| 29 | Token-bucket rate limiter | Refilling on a timer drifts and lets bursts through | No window lets more than rate plus burst through | Lean, Dafny, fast-check | |
| 30 | Pagination | The last page is skipped, or an item shows on two pages | The pages cover every item exactly once | Dafny, Lean, fast-check | |
| 31 | Tax on line items | Rounding each line gives a different total than rounding the sum | The invoice total matches its lines | Lean, Dafny, LemmaScript | |
| 32 | Booking overlap check | Back-to-back bookings, or one across a clock change, count as overlapping or slip through | No two bookings overlap | Lean, Dafny, fast-check | |

## D. Loops and data structures

| # | Use case | What goes wrong | Rule | Fits | Used on |
|---|---|---|---|---|---|
| 33 | Binary search over sorted ids | The loop stops before the last element and misses it | Every id in the list is found | Dafny, Lean, LemmaScript | Dafny |
| 34 | Sending in batches | The last partial batch is dropped | The batches put back together equal the input | Dafny, Lean, fast-check | |
| 35 | Merging two sorted timelines | When one list runs out, the rest of the other is lost | The result is sorted and has every item | Dafny, Lean, fast-check | |
| 36 | Cart reducer with a coupon | A coupon applies twice, or survives removing the item it needs | The total follows the coupon rules | Polygraph, fast-check, Quint | Polygraph |
| 37 | Dedupe by id | The older copy is kept instead of the newer one | One item per id, the latest one | Dafny, Lean, fast-check | |
| 38 | LRU cache | A hit does not move the key, so the wrong one is evicted | Size stays within capacity; the least recently used key goes first | Dafny, fast-check, Quint | |
