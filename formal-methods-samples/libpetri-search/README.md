# libpetri-search

A search box where a slow reply for an old query lands last and replaces the results for the new one. Written in
plain TypeScript and as a libpetri net, to show what libpetri can check here (a count) and what it cannot (which
reply is newer).

```sh
npm install
npm test
```

`npm run stale` runs the natural test, "the list matches the box", which fails.
