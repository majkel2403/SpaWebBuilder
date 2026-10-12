# token-link

Identifier linking as in a code editor: point at a name (a constant, a call, an attribute, a JSON key or a string value) and every other occurrence of the same name in all panes gets an outline and tint; the status line says how many refs and panes. Works with touch (tap) and is case-insensitive, so `FLOOR` links to `"floor"`.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
Any element tree whose tokens are `<span class="code-<c>">` (output of the shared `hl()` highlighter). The linker only considers identifier-like classes (`v ct f fa fd a b jk s`). Highlight style: `.code-lk` with variables `--code-lkc` (outline) and `--code-lkbg` (tint) from the skin.

## Data it consumes
None; it reads the DOM text of the snippets.

## Swap in real data
Render your own code into the `.cx-tl-src` blocks (using `hl()`), and change the selector in `J.$$(".cx-tl-src span", root)` if you use different containers.
