# hero / title-card
The JEV DECIDES title card: eyebrow, 11-letter headline, "hermes writes / jev decides / code acts" line, in a glass card with a hot-pink spine. At tier >= 2 the letters ignite one by one like a neon sign (two keep a faulty-tube flicker), a conic-gradient border spins at tier 3 and a holographic sheen follows the mouse. A replay button re-runs the ignition.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 760px), include component.css and component.js, and call `JEV.boot()`. Markup: `.hero-card > .hero-eyebrow + h1.hero-title > #heroTitle.glitch + p.hero-sub`. Change the headline by editing `TXT` in component.js and the `data-text` attribute. Colours come from `--hero-a/-b/-c` on `.hero-card` and `--pink`, `--violet`, `--red` in base.css.

## Data
None. Only CSS reacts to the kill switch (`body.killed` turns the spine and neon red).

## Swap in real data
Nothing to wire: it is a static brand element. Replace the text, keep the `.hero-l` letter spans created by the script.
Everything shown is simulated; no orders are placed.
