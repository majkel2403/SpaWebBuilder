# live-pill

The sticky status pill of the terminal pane. States: `live` (green, pulsing), `paused` (amber, while the log is hovered or focused) and `pinned` (pink, after click or Enter). While held, new decisions are queued and counted as "+N new"; on resume they print in order.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`<button class="code-lv" data-s="live"><i></i><span class="code-lv-t">live</span><em class="code-lv-n" hidden>+0 new</em></button>`. Set `data-s` to `live | hover | pin`; `aria-pressed` mirrors the pin. The colours are CSS only (`--green`, `--amber`, `--pink2`). The log below is a plain `role="log"` list.

## Data it consumes
Bus `decision` (`action conf dest`) and the seed from `JEV.recent`.

## Swap in real data
Push your own events into `q` (log lines, fills, alerts) and render them in `push()`; the pill logic (hover/focus/pin hold + counter) is independent of what the lines contain.
