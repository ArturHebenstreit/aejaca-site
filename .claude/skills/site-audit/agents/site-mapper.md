---
name: site-mapper
description: In the original plugin, an agent that drove a browser through the Playwright MCP server and wrote sitemap.json. In this repository the same artifact is produced by a deterministic script; this file documents the contract so downstream agents know what they are reading.
adapted: true
---

# site-mapper (replaced by a script)

The site map is written by:

```bash
node .claude/skills/aejaca-ux/pomiar/mapa.mjs --start=<url> --wyjscie=audyt-ux
```

It seeds all three language roots (`/`, `/en/`, `/de/`), because the
language switcher is a button and a link-following crawler would never reach
the other two languages. Then it follows the original crawl rules: depth 3, 25 pages, ~6 minutes, same
host only, no `mailto:`/`tel:`/`javascript:`, canonicalised visited set,
never re-visit, never click anything on the blocklist (the list in
`.claude/skills/aejaca-ux/pomiar/wspolne.mjs` adds Polish and German words,
because "Zamow" and "Kaufen" would pass the English list). Unlike the
original it does not click at all: it only navigates and observes. Safe
clicks are exercised later by `bledy.mjs`.

## What it writes (superset of the original schema)

```json
{
  "host": "localhost:4173",
  "seed": "http://localhost:4173/",
  "crawled_at": "<ISO 8601 UTC>",
  "budget_hit": "depth | pages | time | none",
  "unreached": ["<same-host URLs seen in links but not visited>"],
  "pages": [
    {
      "url": "...", "depth": 0, "status": 200, "title": "...", "lang": "pl",
      "words": 812,
      "headings": [{"level": 1, "text": "..."}],
      "forms": [{"selector": "...", "action": "...", "method": "GET",
                 "fields": [{"selector": "...", "name": "q", "type": "text", "required": false, "label": "..."}],
                 "submit_selector": "..."}],
      "interactive": [{"selector": "...", "role": "button", "text": "Menu", "safe": true}],
      "links": [{"selector": "...", "href": "...", "text": "...", "area": "header|nav|footer|main"}],
      "console_errors": [{"text": "...", "source": "..."}],
      "failed_requests": [{"url": "...", "status": 404}],
      "screenshots": {"telefon": "zrzuty/start-telefon.png", "telefon_cala": "zrzuty/start-telefon-cala.png", "monitor": "zrzuty/start-monitor.png"},
      "phone_height_px": 6210, "phone_screens": 8
    }
  ]
}
```

Additions over the original, and why:

- `screenshots`: three PNGs per page (phone first screen, phone full page,
  desktop first screen) plus `phone_screens`, the page length in phone
  screens. The UX analyst LOOKS at pages instead of reading HTML. That is the single most important change: in this repository
  the bugs that survived code reading (hanging prong legs, an arrow pinned to
  the wrong edge) were found on screenshots in minutes.
- `headings` and `words`: the information-architecture questions (what does
  this page promise, in what order) are answered from the outline.
- `links[].area`: header/footer links are not "content links". The link
  graph of this site is dominated by the footer (privacy policy once got 38x
  the links of a blog post), so the analyst needs to tell them apart.
- `interactive[].safe`: precomputed with the trilingual blocklist.
- `unreached`: the orphan-page question. If a page exists in `dist/` but no
  click path reaches it within budget, that is an IA finding.

Selectors are observed in the DOM (id, data-testid, or an nth-of-type path),
never invented. Downstream scripts use them verbatim; a selector that does
not resolve is skipped, never reported as a bug.
