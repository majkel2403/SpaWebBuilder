# Card spotlight border
Glass cards whose border and surface are lit by a pointer-following radial spotlight (idle drift on touch screens), each showing the latest live decision for its destination.

**What it is:** The `.card` kit: a 1px gradient border drawn with a masked `::before` and a faint surface glow `::after`, both centred on `--mx/--my`. The page runtime normally sets those two variables on pointermove; this component carries its own small handler, and on touch it slowly orbits the light so the effect is visible without hover.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Add class `card` to any block; make sure something sets `--mx` and `--my` (CSS px, relative to the card) on pointermove. The `.ph` row is the optional card header (small caps title left, key right).

**Markup / classes / variables:** `.card > .ph (b title, .pk key) + content`. Variables: `--mx`, `--my`. Colours: the two `rgba(255, 70, 130, ...)` values in `.card::before/::after`; tier 1 drops the backdrop blur.

**Consumes:** `JEV.recent[]` / bus `decision` (latest decision per destination).

**Real data:** Feed any content in the body; the spotlight is data independent. For your own records emit `decision` with `dest` in execute/review/skip.
