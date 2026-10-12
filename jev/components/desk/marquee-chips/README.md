# desk / marquee-chips (Marquee chips)

A **chunk of the section desk/full-desk** (module desk-top): the endless scrolling strip of live status chips (clone, edge fade, hover/focus/tap hold, --mqd speed). Its chunks are the marquee HTML, its CSS and the setup JS (clone, K()/chipC() helpers, tab order, speed watcher). Values are driven by flushBar() from desk/ticker, which the standalone page composes.

The page is assembled from these chunks (byte-identical to the original desk-top.html/css/js; see components/UNITS.md). Edit the chunk here and both the main page and the standalone index.html follow.

## Reuse standalone
Copy this folder + the units listed in component.json "compose" (desk/_top-head, _top-model, _top-events and the hidden desk/_top-* html/css fragments; the desk/_top-sx-* units are standalone-only glue: stub elements, small shims, the closing lines) + engine.js, core.js, base.css (and fx.js for the .rv reveal), then call JEV.boot(). Build with: node jev/build-components.mjs --only desk/marquee-chips

Data: simulated; consumes bus events tick and decision.
