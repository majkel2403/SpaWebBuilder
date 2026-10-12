# Metric tooltip
One shared fixed tooltip for any [data-tip] element: opens on hover or keyboard focus, flips above near the viewport bottom, auto-hides on touch, scroll and Escape.

**What it is:** The HUD tooltip pattern: a single `.hud-tip` element appended to the body (so scrolling strips never clip it) that shows the `data-tip` text of the hovered or focused element.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Add `data-tip="text"` and `tabindex="0"` to any element; the sr-only sibling text keeps the hint available to screen readers. Change the text at any time (the demo updates one live chip with the last decision line).

**Markup / classes / variables:** `<div class="m" tabindex="0" data-tip="..."><label>Median</label><b>3.2 ms</b></div>` plus `.hud-tip` (fixed, `.on` = visible). Touch taps auto-hide after 3 s.

**Consumes:** Static `data-tip` text; the demo chip "last" shows `JEV.recent[0].line` via bus `decision`.

**Real data:** Set `el.dataset.tip = yourText` whenever your value changes; nothing else is needed.
