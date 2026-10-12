# desk / utc-clock
The UTC clock from the desk status bar: tabular mono digits with a white glow, a tiny letter-spaced "utc" label and an amber "simulated" pill. The demo also shows a compact variant and two meta readouts (ISO date, session uptime).

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. Markup: `<div class="dkt-clk"><b class="num" data-clock>00:00:00</b><i>utc</i></div>` anywhere inside the component root; every `[data-clock]` is filled each second. Size it with `font-size` on the `b` (default `clamp(22px, 2.6vw, 30px)`).

## Data consumed
None from the bus: it reads the device clock (`new Date().toISOString()`).

## Swap in real data
For a server-synced time replace `new Date()` in `flush()` with `new Date(Date.now() + offsetMs)`; for another zone use `Intl.DateTimeFormat` with `timeZone` and change the label.
