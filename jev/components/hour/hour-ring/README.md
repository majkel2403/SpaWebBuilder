# hour / hour-ring

The "60:00" ring: 60 svg ticks coloured by phase (orange, blue, amber, green, cyan, pink), a glowing progress circle with a bright head, a rotating radar sweep and a serif clock. It runs 00:00 to 60:00 in twelve seconds, rests for four, flashes a shock ring when the hour is up and starts over. Tap or press Enter on the ring to restart.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; add the html, call `JEV.boot()`. Standalone page: `node jev/build-components.mjs --only hour/hour-ring`.

- size: `.hr-ringbox` width (the svg scales; the clock is sized in `clamp()`).
- phases: edit `PHS` (minute boundaries) and `PCOL` (colours) in `component.js`; `PLAY` / `REST` are seconds.
- drive it yourself: call `render(minutes)` with 0..60 and skip `J.task` (for example from a real build timer).

## Data it consumes
Bus `kill` (the end label reads "halted" instead of "armed"). The rest is a timer.

## Swapping in real data
Feed `render(elapsedMinutes)` from the real run; call `finish()` when the pipeline reports done.

Everything shown is a simulation.
