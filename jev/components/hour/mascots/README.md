# hour / mascots

The mascot kit: Hermes (inline-SVG pixel robot with blinking eyes, antenna and scanline glitch), Dots (blue `.orb`) and Jev (pink `.orb`) with ground shadows, hops, orbiting sparks, landing dust and a live "last answer" chip.

## Reuse
Copy this folder plus the three shared files into your project: `engine.js`, `core.js` and `base.css` (from `jev/src`). Inline them (or link them) in a page together with this folder's `component.css` / `component.html` / `component.js`, put the html inside a div about 720px wide, and call `JEV.boot()`. `node jev/build-components.mjs --only hour/mascots` produces the ready-made `index.html`.

## Data it consumes
- bus `decision` (`d.action`, `d.symbol`, `d.conf`, `d.dest`) — Jev hops, flashes and prints the typed answer
- bus `kill` (bool) — the Jev orb turns red (`.orb.red`) and the sparks slow down

## Swapping in real data
Use the markup of any `.hr-ag` block as a character card: swap the name / caption text, the `data-c` colour (orange, blue, pink, green, ...) or put your own SVG inside `.hr-av`. Trigger `hop(i)` from your own events.

Everything shown is a simulation: no order is placed and no figure is a real result.
