# Footer marquee
A seamless looping status ticker of hard rules (floor, loss cap, kill switch) that stays in sync with the live floor and kill state, plus a live tape of the latest decisions.

**What it is:** The footer `.marq`: two identical flex children translate by -100% in a 40 s linear loop, so the strip never jumps. Variants: pause on hover, reverse direction, and a live variant rebuilt from `JEV.recent`.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Keep the content duplicated in two `<div>` children (the loop depends on it). Mark spans that follow the live state with `.foot-fl` (floor) and `.foot-kill` (kill switch); core.js already updates `.foot-fl` too.

**Markup / classes / variables:** `.marq > div > span` (bold `b` = accent). Modifiers: `.marq.rev` (reverse), pause-on-hover built in. Speed: `animation-duration` on `.marq > div`.

**Consumes:** `JEV.S.floor`, `JEV.S.killed`, `JEV.recent[]`; bus `floor`, `kill`, `decision`.

**Real data:** Swap the static rule texts for your own limits; for the live tape push your own records into `JEV.recent` (fields `symbol action dest conf`) and emit `decision`.
