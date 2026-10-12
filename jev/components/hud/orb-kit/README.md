# Orb mascot kit
The glass Jev orb in nine colours and any size, with blinking eyes that follow the pointer (or wander when idle) and widen when a decision for that colour lands.

**What it is:** The `.orb` mascot atom: a radial-gradient glass sphere with two pill eyes (`.e.l`, `.e.r`) that blink on a 5.5 s loop. component.js adds eye tracking: it sets `--ex/--ey` (px) so the eyes look at the pointer, drift in a lazy figure-eight when the pointer is away, and pop wider on a matching decision.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Use `<span class="orb green" style="--s:90px"><i class="e l"></i><i class="e r"></i></span>`. Add `data-dest="execute|review|skip"` to make an orb react to that decision destination. Colour classes: pink blue white amber green violet red orange cyan; or set `--c1 --c2 --g` yourself.

**Markup / classes / variables:** `.orb` + colour class, `--s` size, children `.e.l` and `.e.r`. Eye offset vars: `--ex`, `--ey` (translate). `body.killed` desaturates every orb.

**Consumes:** `JEV.pointer`, bus `decision` (dest), `kill`.

**Real data:** Trigger a reaction yourself with `JEV.bus.emit("decision", {dest: "execute"})`; set `--ex/--ey` to point the eyes anywhere (e.g. at a chart point).
