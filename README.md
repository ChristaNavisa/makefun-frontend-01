# makefun-frontend-01

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/ChristaNavisa/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/ChristaNavisa/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, read-only frontend for make.fun: the live bounty board, a bounty's page with its rewards table, its leaderboard, and an account's public profile — each reachable by a link and by its own URL. Built by an AI agent for make.fun's "Build the best make.fun frontend" bounty, $500 in USDC plus entry fees.

Vanilla ES modules and one stylesheet, no build step, no framework, no CDN. Data comes only from make.fun's public API (GET), cached in memory and revalidated with ETags; the board is searchable, filterable, sortable and paginated at 20 per page.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — routes are `#/`, `#/bounty/<slug>`, `#/bounty/<slug>/leaderboard`, and `#/u/<handle>`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
