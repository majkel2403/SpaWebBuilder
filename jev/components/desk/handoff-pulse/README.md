# desk / handoff-pulse
The "handoff pulse": each decision of the last 60 s is a 2 px bar at its age position (newest right, scrolling left and fading), coloured by gate result (green execute, amber review, grey skip) and sized by confidence; fresh executions get an additive glow. A legend counts the bars. Seeded with 44 earlier events so it never starts empty. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. The canvas (`.dkt-pu canvas`) takes its height from CSS and its width from the container.

## Data consumed
Bus `decision`: `dest`, `conf`.

## Swap in real data
Push `{t: performance.now(), dest: 'execute'|'review'|'skip', conf: 0..1}` into `pulseEv` for every event of your own stream (any event with three classes and a 0..1 magnitude works); the window length is the `60000` ms constant in `draw()`.
