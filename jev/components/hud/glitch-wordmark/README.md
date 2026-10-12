# Glitch wordmark
A CSS-only chromatic glitch wordmark: cyan and pink slices flicker across the text every few seconds, with a manual burst and a burst on every kill-switch toggle.

**What it is:** `.glitch` duplicates its text via `attr(data-text)` into two pseudo-elements (cyan and pink, `mix-blend-mode: screen`) that clip-path-jump for a few frames out of every 7 s. The effect is pure CSS; the optional script only adds the burst button and the kill reaction.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Wrap any text: `<span class="glitch" data-text="JEV">JEV</span>` (the attribute must equal the text). Add `.hx-burst` for a one-off fast glitch. Tier 1 devices drop the blend mode automatically (`html[data-tier="1"]`).

**Markup / classes / variables:** `.glitch[data-text]` · keyframes `gl1`/`gl2` (idle, 7 s) and `gx1`/`gx2` (burst, .55 s). Colours are the two `color:` values on `::before` / `::after`.

**Consumes:** Bus `kill` (burst when toggled). No other data.

**Real data:** Call `el.classList.add("hx-burst")` and remove it on `animationend` to glitch on your own events (errors, fills, halts).
