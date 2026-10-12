# desk / random-walk-fan

The equity-curve fan of the drift card on its own: 140 simulated random-walk equity paths with a small positive drift (+0.8bp per step against 8.6bp of noise) fan out left to right over 220 trades. Each path is coloured by where it ENDS (hot pink loss, violet, blue, cyan, green, amber big win), a bright white sample-mean spine runs through the cloud, the dashed line is the pure drift and the dotted lines the +/-2 sigma noise cone. A strong-path comet and a mean tag ride the front; hovering traces the nearest path and reads its value. A new run crossfades in every ~10 s; the kill switch halts the walk. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; load the component files and call `JEV.boot()`. Four stacked canvases in `.dkb-cvw` (axes, two crossfading path layers, interaction overlay); keyboard: focus the overlay canvas, arrows move the probe, esc clears.

## Data consumed
No bus data: it rolls its own simulated runs. `JEV.S.killed` halts it.

## Swap in real data
Replace `gen()`: fill `PX[i * S1 + k]` with the cumulative equity (bps) of strategy run `i` at trade `k` (and `MN[k]` with their mean), then call `newRun()`. Adjust `lo` / `hi` for your range.
