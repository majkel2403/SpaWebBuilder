# desk / handoff-pulse (Handoff pulse)

A **chunk of the section desk/full-desk** (module desk-top): the 60 s heartbeat canvas of decisions (green executed, amber review, grey skipped). Chunks: its HTML block, CSS rules and the seed + drawPulse() JS.

The page is assembled from these chunks (byte-identical to the original desk-top.html/css/js; see components/UNITS.md). Edit the chunk here and both the main page and the standalone index.html follow.

## Reuse standalone
Copy this folder + the units listed in component.json "compose" (desk/_top-head, _top-model, _top-events and the hidden desk/_top-* html/css fragments; the desk/_top-sx-* units are standalone-only glue: stub elements, small shims, the closing lines) + engine.js, core.js, base.css (and fx.js for the .rv reveal), then call JEV.boot(). Build with: node jev/build-components.mjs --only desk/handoff-pulse

Data: simulated; consumes bus events tick and decision.
