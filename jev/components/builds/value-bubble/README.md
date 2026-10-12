# builds / value-bubble
A one-element hover bubble that follows the pointer (and taps on touch) over any element with a data-vt attribute and shows its live value, demoed on five action-share bars.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
One bubble `div.bld-vt` inside a `position: relative` host. Any descendant with the attribute `data-vt` shows the bubble while hovered (or tapped on touch, auto-hides after 2 s): either static `data-vt="text"` or a live function registered with `vtReg(el, () => 'text')` (the text is recomputed on show and on every refresh). The bubble is moved with `transform`, centred above the pointer and clamped to the host.

## Data
Demo: counts of `d.action` (buy / sell / hold / close / flatten) over the decision stream. To use real data: register your own rows/bars with `vtReg`.
