# Brief: /vs/libpetri

Follow "Who reads the site" in CLAUDE.md. Each point on the page once.

## The page answers

- What libpetri is, in Node words.
- When to pick it, when not, and which tool instead (including pnueli, stifinder, Polygraph).
- What is hard to see about it: why it is worth using.

## Example

Two transfers that lock two accounts in opposite order and wait for each other forever. Order: product case, plain
TypeScript (`async-mutex`, ~10 lines), why tests miss it, the libpetri net, the check, the fix. Code and output from
`formal-methods-samples/libpetri-transfer`.

## Facts

- A step takes all its inputs at once, so "take both locks" is one step and the lock-order bug cannot be written.
- The check runs on the net that runs in production; no separate model. Small nets need no z3.
- Step bodies stay ordinary async functions; only the wiring moves into the net.
- Good fit: steps waiting for shared things (locks, pools, worker slots, joins); the code that decides what runs next
  (agent loops, job runners, workflow engines).
- Poor fit: time (check ignores it), values and math, async code you already have, a straight chain of `await`s.
- pnueli: protocols, "eventually" rules, model next to the code. stifinder: crashes and retries, model next to the
  code. Polygraph: existing reducers, LLM writes the model, values, experimental.
- Limits: ~4x more code than plain TS; the checker trusts each step's declared inputs and outputs; young, one author.
- Future: production at Otto; Java, TypeScript, Rust, Python from one spec; Lean proofs; a coding-agent skill for
  designing nets.

## Alex's remarks

- "The goal is to make the page good for Node.js developers who don't know it and want to answer: should I use it,
  are there better alternatives, and when to use it, if ever."
- "Pool connections, rate-limit permits, a token budget: there are many tools for the job. Why would libpetri be used
  in this case?"
- "Don't tell the story from the point of view of a developer who needs to learn libpetri or Petri nets. Nobody reads
  SpecCraft to learn something."
- "The reader does not have a specific task; they usually don't even realize they do. The reader is exploring: what is
  out there, how it compares with everything else, pros and cons, what is recommended, what has potential in the
  future. They decide whether to invest their time into understanding it."
- "Put yourself in the shoes of a Node.js developer who is just looking around. Catch their attention and give
  guidance. Don't overwhelm them right away with knowledge they have zero chance to learn anyway. Paint a picture
  without scaring them."
- "Start by showing standard-looking code for the same problem, in plain TS, so the developer sees what kind of
  problem we have. Describe the problem cleanly: what the product use case is and what is difficult."
- "Why is the code '(shortened)'?"
- "Suggest the most basic example that suits Petri nets best. The simpler use case is the better one."
- "Why does the example have to be 100 lines long?"
- "After reading the page, will the reader understand that rate limits, debounce and retry are bad uses?"
- "What is the purpose of the text? Just to generate tons of fluff?"
- "This 'Our take' essentially says don't use it. Say what is hard to see; don't repeat what is obvious."
- "It is still not clear when to use Polygraph and when libpetri. The page lists similar tools, but where is the
  guidance?"
- "What is the idea behind repeating the same thing five times: good fit, how it compares, other tools, strengths,
  limitations?"
- "Slow down, stop making fast moves, and ask questions first."
- "No fancy words, no archaic words, no needlessly complicated English (I'm not a native speaker), no heavy jargon, no
  coined words or idioms."
