# Section tint wash
The page colour temperature: a fixed two-corner radial wash that eases to a new colour as each section crosses the viewport middle, with a live readout of the tint value.

**What it is:** core.js watches `#hero #code #builds #hour #desk #lab` and the footer with a hairline IntersectionObserver, eases `J.tint` toward the section colour, and writes it to `--tint: r,g,b` on `<html>`. `body::before` paints a static wash from that variable, and `.h2 em` glows in it. Pure colour change, no layout cost.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Give your sections those ids (or edit `TINTS` in core.js) and use `rgba(var(--tint), .1)` anywhere you want the page temperature: borders, glows, gradients. Listen to bus `tint` for the target colour.

**Markup / classes / variables:** `html { --tint: 255,46,110 }` eased by JS; `body::before` = the wash; `.h2 em` uses `--em-sh`. Sections: hero pink, code orchid, builds magenta, hour amber, desk blue-violet, lab green, footer violet.

**Consumes:** `JEV.tint` [r,g,b] (eased), bus `tint` (target [r,g,b]).

**Real data:** Drive it from your data: `JEV.bus.emit("tint", [r,g,b])` only reports; to tint by state, set `document.documentElement.style.setProperty("--tint", "46,230,166")`.
