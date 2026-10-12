# phosphor-log

The terminal log of the jev-starter window without minimap and pause pill, focused on its look: every printed line flashes with a bright phosphor text-shadow and brightness boost that cools in 650 ms, a CRT vignette with scanlines sits on top and a faint band rolls slowly down the screen. Lines stream in with a 95 ms stagger per decision.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`.code-term` (flex column, `justify-content: flex-end`, fixed height) > `.code-out` > `.code-tl` rows of `<span class="code-<c>">` (classes `t-buy t-sell t-hold t-close t-flatten t-conf t-ok t-no t-dest t-warn t-ps t-cmd td tx`). Add `.seed` to a row to skip the glow (initial lines). `<i class="code-crt">` overlays the view. `html[data-tier="1"]` drops the rolling band and glow.

## Data it consumes
Bus `decision` (`action conf size riskOk dest reason ms floor id`), `kill`, `floor`; `JEV.recent` seeds three decisions.

## Swap in real data
Call `push([[["tx","your text"],["t-ok","OK"]]], JEV.time)` with your own token arrays (`[class, text]` pairs) for each log line from your system.
