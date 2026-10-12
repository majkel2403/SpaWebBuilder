# desk / end-histogram

The end-value histogram of the drift card as its own panel: 140 simulated random-walk paths with a small positive drift, binned into 30 horizontal bars by their current equity (bps of capital). Bars are coloured by value, hot pink (loss) through violet, blue, cyan and green to amber (big win), wobble gently, and the cloud visibly drifts right as the run advances. A dashed zero line separates loss from profit, a mean tag rides the axis, and a pointer probe draws a level line with the share of paths above it and the count in the bin. A new run starts every ~10 s; the kill switch halts the walk. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; load the component files and call `JEV.boot()`. Two stacked canvases in `.dkb-cvw` (static axis + live bars). Keyboard: focus the canvas, up/down arrows move the probe, esc clears.

## Data consumed
No bus data: it runs its own simulated walks (`makeSim()`). `JEV.S.killed` halts it.

## Swap in real data
Fill `sim.V` (one equity value in bps per strategy run / path) every update and set `sim.step`; the histogram, mean tag and share-above readout follow. Adjust `lo` / `hi` for your value range.
