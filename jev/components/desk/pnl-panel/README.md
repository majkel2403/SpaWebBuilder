# desk / pnl-panel (Swarm P&L panel)

A **chunk of the section desk/full-desk** (module desk-top): the whole SWARM P&L card: odometer balance, balance-history canvas with scrub, win/loss strip, proportion bars and stats. One JS chunk (flashes, setBalText, flushPnl, canvases, drawStrip, task) plus the card HTML/CSS. The sub-atoms pnl-odometer, balance-line, winloss-strip, proportion-bars, stats-row are NOT separate chunks (they share flushPnl and the sim state) and keep their own hand-made versions.

The page is assembled from these chunks (byte-identical to the original desk-top.html/css/js; see components/UNITS.md). Edit the chunk here and both the main page and the standalone index.html follow.

## Reuse standalone
Copy this folder + the units listed in component.json "compose" (desk/_top-head, _top-model, _top-events and the hidden desk/_top-* html/css fragments; the desk/_top-sx-* units are standalone-only glue: stub elements, small shims, the closing lines) + engine.js, core.js, base.css (and fx.js for the .rv reveal), then call JEV.boot(). Build with: node jev/build-components.mjs --only desk/pnl-panel

Data: simulated; consumes bus events tick and decision.
