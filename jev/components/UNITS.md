# Units: atoms as the source of truth for a section

A **section** (e.g. `builds/full-section`) is built by concatenating the **chunks** of its **units**. A unit is a component folder whose `component.html/css/js` hold a *piece of the section's real source*. The main page (`node jev/build.mjs`) and every standalone page are built from these same chunks, so there is no copy to drift.

## component.json
```jsonc
// a unit that is also a standalone, reusable component
{ "title": "...", "description": "...", "width": "1100px", "needs": {"fx": true, "hud": false},
  "section": "builds/full-section",                 // which section this chunk belongs to
  "html": ["component.html"], "css": ["component.css"], "js": ["component.js"],   // chunk files (any may be omitted)
  "compose": ["builds/_head", "self", "builds/_tail"] } // what its standalone page contains, in order ("self" = this unit's own chunks)
// a hidden helper unit (shared head/tail, not shown in the gallery, no standalone page)
{ "hidden": true, "section": "builds/full-section", "js": ["head.js"] }
// the section component itself
{ "title": "...", "needs": {"fx": true}, "units": ["builds/_head","builds/hub","builds/tile-cost","builds/_tail"],
  "order": { "html": [...], "css": [...], "js": [...] } }   // optional per-kind order (when kinds are not in the same order)
```
Rules of the resolver (`jev/lib/units.mjs`): chunks are joined with `''` (no separators), in the section's order; all js chunks of a section go into **one `<script>`** (a unit with `"newScript": true` starts a new one); `compose` lists are joined the same way into one script for the standalone page.

## Invariant (must hold)
`concat(chunks) == the section's original source`, byte for byte. Check with
`node jev/tools/check-units.mjs --kind js --orig <original file> --units a/b,a/c,a/d` (also `html`, `css`). Because JS chunks are pieces of one closure they are not valid JS alone; only the concatenation (page) and the `compose` (standalone) are.
