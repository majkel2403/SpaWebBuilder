# Quality tier indicator
A three-bar quality-tier gauge showing the auto-detected performance tier (1 low, 2 medium, 3 high), with buttons to pin a tier and a live card/glitch preview of what each tier changes.

**What it is:** core.js samples frame times and sets `JEV.tier` (3 high, 2 medium, 1 low) plus `<html data-tier>`; effects read it and degrade (letter blur, backdrop blur, blend modes, particle counts). This piece visualises it as signal bars and lets you override it in the demo.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Read `JEV.tier` or listen to bus `tier`; style with `html[data-tier="1"] ...` selectors. Pin from the URL with `?tier=1|2|3`. The bars are `.hx-tr i` with `.on`.

**Markup / classes / variables:** `.hx-tier` > `.hx-tr` (3 `<i>`), `b#hx-tier-n`. `[data-tier-pin]` buttons set `JEV.tier`, `html[data-tier]` and emit `tier`.

**Consumes:** `JEV.tier`, bus `tier`.

**Real data:** Persist a user choice (e.g. a "reduce effects" toggle) by calling `JEV.bus.emit("tier", n)` after setting `document.documentElement.dataset.tier`.
