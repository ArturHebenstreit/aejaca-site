---
name: site-audit
description: >
  Audit a website for UX issues, bugs, accessibility problems, performance issues,
  and behavior that would surprise users. Use when the user says "audit this site",
  "check this URL", "review this website", "find issues on", "test this page",
  "what's wrong with", "przejrzyj strone", "co jest nie tak ze strona", or anything
  about evaluating a live or locally served website for quality.
  Writes audyt-ux/raport.md with findings grouped by severity.
tools: Bash, Agent, Write, Read, TaskCreate, TaskUpdate
version: 1.4.1-aejaca
---

# Site Audit (adapted for aejaca-site)

> This is the dan323 `site-audit` plugin, adapted to run in this repository.
> What changed and why is recorded in `ORIGIN.md`. In short: the crawl, the
> accessibility scan and the bug checks are deterministic scripts driving the
> Chromium already in `node_modules/playwright`; there is no Playwright MCP
> server, no `npx playwright install`, no `npx axe-cli`. Only the judgement
> steps (UX heuristics, performance reading) stay with agents.

Audit a website by first measuring it once (crawl, accessibility, bug
patterns), then spawning the judgement agents that read the shared
artifacts. Aggregate findings into `audyt-ux/raport.md`.

**Prereqs:** `npm run build` (the default target is the local `dist/`), or a
reachable URL. Chromium is resolved by `.claude/skills/aejaca-ux/pomiar/wspolne.mjs`
(`PW_EXECUTABLE_PATH` or the remote environment default). On a local machine
Playwright finds its own browser.

---

## Task Tracking

Before doing any work, call `TaskCreate` for each phase below. Call `TaskUpdate`
(status `in_progress`) when you begin a phase and `TaskUpdate` (status
`completed`) when you finish it.

- Get URL and verify reachability
- Measure (site map, accessibility, bug patterns)
- Run judgement agents in parallel (UX, performance)
- Parse results
- Write report

---

## Phase 0: Get the URL

If the user gave a URL, use it. Otherwise the target is the local build:
`npm run build` if `dist/` is missing or stale, then let `pomiar.mjs` serve it
(it starts a static server without a catch-all rule, which matters: a server
that answers `index.html` for every path makes every page look like the home
page and every hydration look broken).

Remember the network limits of the remote environment: only `localhost` and a
short allow-list are reachable. Auditing production `https://www.aejaca.com/`
works on a local machine only.

Working directory is `audyt-ux/` in the repository root (git-ignored). All
artifacts live there:

```
audyt-ux/sitemap.json      pages, selectors, links, forms, console, failed requests
audyt-ux/zrzuty/*.png      every page at 390 px (full page) and 1280 px (first screen)
audyt-ux/dostepnosc.json   axe-core findings, both themes, both widths
audyt-ux/bledy.json        bug-pattern findings, redirects, dead clicks
audyt-ux/raport.md         the report this skill writes
```

---

## Phase 1: Measure (sequential, one command)

```bash
npm run ux:pomiar                       # serves dist/ and runs all three
npm run ux:pomiar -- --start=https://www.aejaca.com/   # a live site (local machine)
npm run ux:pomiar -- --wszystko         # whole site instead of 25 pages
```

`pomiar.mjs` runs, in order: `mapa.mjs` (crawl), `dostepnosc.mjs` (axe-core),
`bledy.mjs` (bug patterns). It serves `dist/` on a FIXED port (4177, or
`--port=`), because the map stores full URLs and a later `--tylko=bledy` must
hit the same server. Each step can be run alone with `--tylko=`; see
`.claude/skills/aejaca-ux/SKILL.md`.

If `sitemap.json` is missing afterwards, **stop the entire audit** and tell
the user what `mapa.mjs` printed. Do not write a report from nothing.

---

## Phase 2: Judgement agents (parallel)

Spawn both with the `Agent` tool in the same turn. Each agent's instructions
are a file in `agents/`; pass the path and tell the agent to read it first.
Use `subagent_type: "general-purpose"` with `model: "sonnet"`.

### UX analyst

Prompt:
```
Read .claude/skills/site-audit/agents/ux-analyst.md and follow it exactly.

Sitemap path: audyt-ux/sitemap.json
Screenshots: audyt-ux/zrzuty/ (referenced from each page's "screenshots" field)
UX checklist: .claude/skills/site-audit/references/ux-checks.md
Site-specific rules: .claude/skills/aejaca-ux/uklad-tresci.md and .claude/skills/aejaca-ux/wygoda.md

Return ONLY a JSON array of findings. No prose, no markdown fences.
Each object: {"severity":"critical|high|medium|low","category":"<from checklist>","page":"<url>","issue":"<description>","recommendation":"<specific fix>"}
```

### Performance auditor

Prompt:
```
Read .claude/skills/site-audit/agents/performance-auditor.md and follow it exactly.

Sitemap path: audyt-ux/sitemap.json
Thresholds and manual checks: .claude/skills/site-audit/references/performance-checks.md

Return ONLY a JSON object. No prose, no markdown fences.
Format: {"lighthouseScore":<0-100 or null>,"findings":[{"severity":"critical|high|medium|low","metric":"<metric>","page":"<url>","issue":"<description>","value":"<measured value or null>","recommendation":"<specific fix>"}]}
```

Wait for both.

---

## Phase 3: Parse results

- `audyt-ux/dostepnosc.json`: `findings[]` is the accessibility list. Read
  `by_rule` first: one rule on a hundred pages is one bug in a shared
  component, not a hundred bugs.
- `audyt-ux/bledy.json`: `findings[]` is the bug list. `by_type` first.
- Agent responses: strip accidental fences, parse JSON. If parsing fails,
  wrap the raw text as one low finding:
  `{"severity":"low","category":"other","page":"<seed>","issue":"Agent returned unparseable output: <first 200 chars>","recommendation":"Re-run the audit"}`
- Performance: extract `findings` and record `lighthouseScore` separately.

Collect four lists: `uxFindings`, `a11yFindings`, `perfFindings`, `bugFindings`.

---

## Phase 4: Write report

Compute per-list counts by severity. Write `audyt-ux/raport.md`:

```markdown
# Site Audit: [URL]
*Generated: [ISO 8601 UTC]*

## Summary

| Category       | Critical | High | Medium | Low | Total |
|----------------|----------|------|--------|-----|-------|
| UX             | N | N | N | N | N |
| Accessibility  | N | N | N | N | N |
| Performance    | N | N | N | N | N |
| Bugs           | N | N | N | N | N |
| **Total**      | **N** | **N** | **N** | **N** | **N** |

[If lighthouseScore is not null: > **Lighthouse performance score: N/100**]

## Classes, not instances

[For accessibility and bugs: one line per rule/type with the page count.
This is the section the owner reads. A rule hitting 90 of 90 pages is one
fix in one shared component; say which component when you can tell.]

## Critical Issues
### [category/type]: [page]
**Issue:** ... **Fix:** ...

## UX Issues            (High, Medium, Low; "No UX issues found." if empty)
## Accessibility Issues (same, plus WCAG criterion and the themes/widths it appeared in)
## Performance Issues   (same, with metric and value)
## Bugs & Functional Issues (same, with type; redirects list the target)

## Top 5 Recommendations
[Severity first, then fix effort. Quick wins before refactors.]
```

After writing, confirm to the user in their language:

> Audit complete. Report at `audyt-ux/raport.md`. Found N issues: N critical,
> N high, N medium, N low. Measurement artifacts kept in `audyt-ux/`.

Then hand the findings to `aejaca-ux` for the fix-at-the-source pass: a
finding is closed when the class is gone from a fresh measurement, not when
one instance is patched.
