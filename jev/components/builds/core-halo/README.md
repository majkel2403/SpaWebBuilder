# builds / core-halo
The glow stack behind the JEV core: a breathing radial halo that swells with confidence, a slow conic-gradient sweep, two orbiting dashed rings and a flash on every answer, red under the kill switch.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
`.bld-core` (the host, `position: relative`) holding `i.bld-halo` (radial pink halo, 3.8 s breathing), `i.bld-sweep` (conic-gradient light sweep masked to a ring, 18 s), `i.bld-ring.bld-ring-a / -b` (dashed and dotted rings, 60 s / 90 s counter-rotation) and `i.bld-flash` (opacity 0, flashed per answer). Everything is centred on the host, so put any element (a card, a logo) in the middle with `position: relative; z-index: 2`. Two registered custom properties `--hi` and `--hs` (transitioned) scale the halo opacity and size.

## Data
`d.conf` from bus `decision` -> `--hi` 0.8..1.3 and `--hs` 0.88..1.08, flash on each decision; `body.killed` shifts the colours to red. To use real data: set the two properties from any 0..1 signal.
