# hero / backdrop-fx
A CSS-only hero backdrop: a spinning conic-gradient aura, a masked dot grid, a travelling scan bar, a vignette and the hot-pink glowing rule with a moving highlight. Everything is compositor-only (transform / rotate / opacity) and pauses off-screen via core.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 1100px), include component.css and (no script needed), and call `JEV.boot()`. Markup `.hero-bg > i.hero-aura + i.hero-grid + i.hero-scan`, `.hero-vig`, `.hero-rule`. Set `--hero-jx` / `--hero-jy` on the parent to move the aura centre. `body.killed` shifts the colours to red.

## Data
None (no JS). Press `k` (core shortcut) to see the kill tint.

## Swap in real data
Not applicable: purely decorative.
Everything shown is simulated; no orders are placed.
