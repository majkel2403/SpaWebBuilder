# hero / decision-chip
The "latest decision" readout chip: symbol, action, confidence, size, risk flag, destination badge (execute green, review amber, skip grey, review red when killed) and typed-question latency. Confidence, size and latency roll per digit like an odometer, and the border flashes white on every update.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 900px), include component.css and component.js, and call `JEV.boot()`. Markup `#hero-chip` with ids `hero-c-sym|act|conf|size|risk|dest|ms|why` (all optional; missing ones are skipped). The `data-d` attribute on `#hero-c-dest` selects the badge colour.

## Data
JEV.bus `decision`: `d.symbol d.action d.p d.conf d.size d.riskOk d.dest d.reason d.floor d.ms`; seeds from `JEV.recent[0]`.

## Swap in real data
Emit `JEV.bus.emit("decision", d)` with real records in that shape (see main README, Decision record), or call the module `update(d)` from your own socket handler.
Everything shown is simulated; no orders are placed.
