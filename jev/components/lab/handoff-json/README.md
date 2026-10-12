# lab / handoff-json

The handoff file Jev leaves for plain code, as a tiny editor window (traffic-light dots, `handoff.json` caption). Each decision re-renders the JSON with syntax colours (keys blue, strings green, numbers amber, booleans pink) and types it out line by line with a clip-path reveal. A "copy json" button puts the full handoff (including `floor` and `simulated: true`) on the clipboard and shows a check.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data
Bus `decision`: `action`, `size`, `venue`, `conf`, `riskOk`, `reason`, `dest`, `floor`.

## Markup
`<pre class="lab-js type"><span class="lab-jl" style="--i:1">  <u class="k">"action"</u><span class="p">:</span> <span class="s">"buy"</span>…</span></pre>` — `--i` is the line index (delay = i x 62 ms).

## Swap in real data
Emit your own records, or call `render(record, true)`; change the fields in `rowsJ` (and in `json()` for the clipboard text) to your handoff schema.
