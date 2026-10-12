# lab / scenario-chips

A wrapping row of preset chips with stroke icons, a pink pressed state with a dot, a dashed random chip with an R key hint, hover lift and a pop on pick. Picking a chip builds a nine-field simulated market state, runs `JEV.decide()` on it and prints the verdict (action, size, confidence, destination) plus the key inputs.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Markup
```html
<div class="lab-presets" role="group" aria-label="scenario presets">
  <button class="lab-sc" type="button" aria-pressed="false" data-p="trend"><svg class="lab-sc-i" viewBox="0 0 16 16">…</svg><span>trend</span></button>
  <button class="lab-sc lab-sc-r" type="button" aria-pressed="false" data-p="random">…<kbd class="lab-kbd">R</kbd></button>
</div>
```
`aria-pressed="true"` is the selected look. Rename chips by editing `data-p` + the `PRESETS` table in `component.js` (nine numbers in the order edge, imbalance, spread, vol, position, pnl, drawdown, latency, age).

## Data
Emits `JEV.bus 'lab-preset' {name, state}`. Uses `JEV.decide(state)` and, for random, `JEVEngine.sampleState`.

## Swap in real data
Replace `PRESETS` with your own scenarios (or recorded states) and handle `lab-preset` yourself; drop the `JEV.decide` preview if you do not need it.
