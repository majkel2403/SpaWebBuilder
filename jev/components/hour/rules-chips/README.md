# hour / rules-chips

The hard-rule chips: a dim label on the left, a value pill on the right. Three are plain readouts (daily loss cap, max position, confidence floor); the fourth is a button that mirrors the global kill switch (green "armed" lamp, red "halted" with a fast pulse) and toggles it on click.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; add `component.html` and call `JEV.boot()`. Build the standalone page with `node jev/build-components.mjs --only hour/rules-chips`.

Markup:
```html
<div class="hr-rules">
  <div class="hr-chip"><span>daily loss cap</span><b>$2,000</b></div>
  <button class="hr-chip hr-kill" aria-pressed="false"><span>kill switch</span><b><i></i>armed</b></button>
</div>
```
Add any number of `.hr-chip` rows; the grid is one column and goes two columns in a narrow container. Pill colour: edit `.hr-chip b` (amber by default); `.hr-kill b` is green / red via `body.killed`.

## Data it consumes
`J.RULES.lossCap`, `J.RULES.maxPos`, `J.S.floor` + bus `floor`, `J.S.killed` + bus `kill`; click calls `J.setKilled`.

## Swapping in real data
Write your own limits into the `<b>` elements (`#hr-r-loss`, `#hr-r-pos`, `#hr-r-floor`) and replace the `J.setKilled` call with your own halt endpoint.

Everything shown is a simulation.
