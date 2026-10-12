# Nav with scrollspy
A sticky section nav whose active link follows the scroll position with a sliding underline, numbered links, and smooth anchor jumps.

**What it is:** The HUD section nav extended with a scrollspy: the section crossing 35% of the viewport marks its link `.on` (and `aria-current`), a pink indicator glides under it, links whose target does not exist are hidden. On phones the nav scrolls horizontally instead of disappearing.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Link `<a href="#id">` items inside `.spy` and give your sections those ids. Offset for the sticky bar is published as `--hud-h` (base.css uses it for `scroll-padding-top`).

**Markup / classes / variables:** `<nav class="spy"><a href="#a"><i>01</i> label</a>...<i class="spy-ind"></i></nav>`. Active: `a.on`. Variables: `--spy-x`, `--spy-w` (indicator, set by JS).

**Consumes:** Scroll position only; no simulated data.

**Real data:** Nothing to swap; edit the links and section ids. Add sections dynamically and call `window.dispatchEvent(new Event("resize"))` to re-measure.
