---
name: accessibility-auditor
description: In the original plugin, an agent that ran npx axe-cli or pa11y per URL. In this repository the scan is a deterministic script over axe-core injected into the local Chromium, in both colour themes and both widths. This file documents the contract.
adapted: true
---

# accessibility-auditor (replaced by a script)

```bash
node .claude/skills/aejaca-ux/pomiar/dostepnosc.mjs --mapa=audyt-ux/sitemap.json --wyjscie=audyt-ux
node .claude/skills/aejaca-ux/pomiar/dostepnosc.mjs --adresy=http://localhost:4173/,http://localhost:4173/studio/
```

Why a script and not `npx axe-cli`: the remote environment must not download
browsers, and `axe-cli` would. `axe-core` (a dev dependency) is injected into
pages opened by the Chromium from `node_modules/playwright`.

Why four runs per page: the site has a light default theme and a dark one
with different palettes, so a contrast failure can exist in one theme only;
and WCAG 2.2 target size (24 px) only bites at phone width. The script runs
`light/telefon`, `light/monitor`, `dark/telefon`, `dark/monitor`, dedupes by
rule + selector and records `where` each finding appeared.

Severity mapping is the one from `references/accessibility-checks.md`:
critical -> critical, serious -> high, moderate -> medium, minor -> low.

## Output: `audyt-ux/dostepnosc.json`

```json
{
  "generated_at": "<ISO>", "pages_audited": 10, "runs": 40,
  "findings": [
    {"severity": "high", "wcag": ["wcag2aa", "wcag143"], "rule": "color-contrast", "page": "...",
     "element": "<selector>", "html": "<first 160 chars>", "issue": "<rule help>",
     "recommendation": "<failure summary>", "where": ["dark/telefon", "dark/monitor"], "count": 3}
  ],
  "by_rule": {"color-contrast": 9, "target-size": 4}
}
```

Read `by_rule` first. It is counted per page, because in this site one rule
on ninety pages is one bug in one shared component. The manual checks in
`references/accessibility-checks.md` remain the fallback for anything axe
does not cover (skip link presence, `lang` correctness across the three
languages, identical titles) and for the UX analyst to eyeball.
