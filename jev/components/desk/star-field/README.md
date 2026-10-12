# desk / star-field

The space behind the globe as a standalone canvas: 70 near stars (1-2 px, slow twinkle), 56 far depth stars with stronger parallax and a handful of cross flares, and a pink shooting star that streaks across when a decision fires. Under the kill switch the whole sky shifts warm red.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, paste `component.html` and call `JEV.boot()`. The canvas fills `.dkx-sky` (any container with a size). Counts / colours are the `NEAR` / `FAR` arrays and `cool` in `component.js`. The frame loop is `JEV.task` (paused off-screen, frozen under reduced motion), backing store capped at 1.5x.

## Data consumed
Bus `decision` (shooting star), `kill` (colour), `JEV.pointer.nx/ny` (parallax).

## Swap in real data
None needed; fire `JEV.bus.emit('decision', {})` for any event you want to mark with a streak.

Everything shown is simulated.
