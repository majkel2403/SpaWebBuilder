# Lamp, pill and chip kit
Status atoms: pulsing lamps, outlined pills, accent-coloured chips and a live counter chip row, with a state pill that follows the kill switch.

**What it is:** Three tiny CSS atoms from base.css: `.lamp` (glowing pulsing dot: green, `.pink`, `.amber`), `.pill` (outlined uppercase tag) and `.sec-live span` (chip with accent dot and a tabular counter). `data-c` sets the accent for the chip dot.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Copy the markup below. Colour a chip with `data-c="green|blue|yellow|violet|orange|cyan|red|pink|gray"` on the `span`. The lamp pulse pauses automatically off-screen (core toggles `.is-off`).

**Markup / classes / variables:** `<span class="pill"><i class="lamp"></i> armed</span>` · `<div class="sec-live"><small>live</small><span data-c="green"><i></i>execute <b>0</b></span></div>`. Variables: `--cc` / `--cc-rgb` from `data-c`.

**Consumes:** `JEV.S.dest.{execute,review,skip}`, `JEV.S.killed`; bus `decision`, `kill`.

**Real data:** Write your own numbers into the `<b>` elements; the kit is pure CSS.
