# Logo mark
The JEV logo mark: a pink gradient J tile with glow, in four sizes with and without wordmark, that pulses on every decision and turns red when halted.

**What it is:** The HUD `.logo` link: a rounded gradient square carrying a bold J plus the spaced JEV wordmark. This version is size-driven by a single `--s` variable.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Use `<a class="logo" style="--s:56px"><b>J</b><span>JEV</span></a>`. Replace the letter and the label to brand your own console; the glow colour is the first `box-shadow` in `.logo b`.

**Markup / classes / variables:** `.logo` (flex link) > `b` (tile) + `span` (wordmark). `--s` sets tile size (default 34px); font sizes scale with it. `body.killed` turns the tile red.

**Consumes:** Bus `decision` (glow flash), `kill` (via `body.killed`, set by `JEV.setKilled`).

**Real data:** Flash on your own event: `JEV.bus.emit("decision", {})` or call `JEV.animate(tile, keyframes, opts)` yourself.
