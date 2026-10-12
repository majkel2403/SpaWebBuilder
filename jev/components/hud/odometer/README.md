# Odometer digit reels
Mechanical digit-reel counters: each digit is a 0-9 reel that rolls with a small overshoot, fed live by decisions, cost and price.

**What it is:** A number display where every digit is a vertical reel (`.od-d > .od-r > i`) that translates to its value; separators ($ , . :) stay static. A visually hidden copy carries the text for screen readers.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Put `<b data-odo="count"></b>` (or `cost`, `price`, `floor`, `manual`) anywhere; font-size/colour are inherited, the reel height is 1.55em. For your own number call the same `odo(el, text)` function (it lives in component.js) or dispatch `el.dispatchEvent(new CustomEvent("odo", {detail: "12,480"}))`.

**Markup / classes / variables:** `.od` wrapper, `.od-d` digit window, `.od-r` reel (`--d` = digit), `.od-s` separator. Layout is rebuilt only when the glyph pattern changes (e.g. 999 to 1,000); otherwise only `--d` changes and CSS animates the roll (`.62s` overshoot curve).

**Consumes:** `JEV.S.count`, `JEV.S.cost`, `JEV.S.floor`, `JEV.market.price`; bus `decision`, `tick`, `floor`.

**Real data:** Replace the formatters in `fmtOf` with your numbers (or dispatch the `odo` event with a string); no simulator needed.
