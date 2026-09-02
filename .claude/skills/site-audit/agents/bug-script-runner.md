---
name: bug-script-runner
description: In the original plugin, an agent that authored a @playwright/test spec on the fly from sitemap.json selectors and ran it via npx. In this repository the checks are fixed and run by a deterministic script on the local Chromium. This file documents the contract.
adapted: true
---

# bug-script-runner (replaced by a script)

```bash
node .claude/skills/aejaca-ux/pomiar/bledy.mjs --mapa=audyt-ux/sitemap.json --wyjscie=audyt-ux
node .claude/skills/aejaca-ux/pomiar/bledy.mjs --mapa=... --bez-klikania   # skip dead-click probing
```

Why a script: the original generated a test file per run because it had to
work on any site. Here the checks are the same every time, `@playwright/test`
is not installed, and a fixed script is cheaper and reproducible. The
patterns and severities come verbatim from `references/bug-patterns.md`; the
safety rules from `references/script-authoring.md` are enforced in code
(selectors only from the sitemap, URLs only from the sitemap, the trilingual
click blocklist, no form submission, no POST, no page mutation).

## Checks per page

| type | severity | what |
|---|---|---|
| `console-error` | high, critical if auth/token/security/CSP | errors on load, foreign-host blocks ignored |
| `failed-request` | 5xx high, 4xx medium | same-host resources only |
| `mixed-content` | high | `http://` resources on an https seed |
| `template-bleed` | critical / high | `{{`, `{%`, `<%`, `${`, `[object Object]`, bare `undefined` / `null` in visible text |
| `broken-image` | high / critical | empty or template `src`, or `naturalWidth === 0` after load |
| `redirect-link` | 3xx medium, 4xx medium, 5xx high | **added here**: every same-host link is fetched without following redirects. A page should not hand visitors or crawlers a redirect; four home-page tiles once did (`/studio?tab=` without the slash) |
| `dead-click` | medium | a safe interactive element that, when clicked, changes nothing: URL, DOM size, network, console, `aria-expanded`/`open`/`data-state`/`class` |
| `console-error-after-click` | high | with the click path |
| `hover-only-menu` | medium | reveals on hover at 1280 px, reveals nothing on tap at 390 px |

## Output: `audyt-ux/bledy.json`

```json
{
  "generated_at": "<ISO>", "pages_checked": 25, "links_checked": 210, "clicks_made": 140,
  "findings": [
    {"severity": "medium", "type": "redirect-link", "page": "...", "selector": "...",
     "issue": "...", "recommendation": "...", "detail": {"location": "/jewelry/", "pages": ["..."]}}
  ],
  "by_type": {"redirect-link": 6, "dead-click": 2}
}
```

Note for a local static server: Python's `http.server` does not apply
`public/_redirects` (that file is Cloudflare's), so a link that production
redirects with 301 shows here as 404. Either way it is a link that should
point at the final address.
