# desk / candle-tape (The tape (candles + book))

A **chunk of the section desk/full-desk** (module desk-top): the whole tape card: price header, layer chips, candlestick canvas with vwap bands, volume, markers, tooltip and the live order book (drawBook/drawTape/flushTape in one chunk). The sub-atoms order-book, candles-vwap, price-header, layer-chips are NOT separate chunks (one canvas, shared tg layout state) and keep their own hand-made versions.

The page is assembled from these chunks (byte-identical to the original desk-top.html/css/js; see components/UNITS.md). Edit the chunk here and both the main page and the standalone index.html follow.

## Reuse standalone
Copy this folder + the units listed in component.json "compose" (desk/_top-head, _top-model, _top-events and the hidden desk/_top-* html/css fragments; the desk/_top-sx-* units are standalone-only glue: stub elements, small shims, the closing lines) + engine.js, core.js, base.css (and fx.js for the .rv reveal), then call JEV.boot(). Build with: node jev/build-components.mjs --only desk/candle-tape

Data: simulated; consumes bus events tick and decision.
