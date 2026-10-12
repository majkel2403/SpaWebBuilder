# desk / agent-tabs

the six-tab agent strip (spotter, prior, edge, kelly, taker, closer): each tab shows its orb, step name and idle / working / done / halted state with a progress bar; click to pin one

## Reuse
Copy this folder plus the three shared files (`engine.js`, `core.js`, `base.css`) next to it, inline them in a page (see `index.html` built by `build-components.mjs`), add the markup of `component.html` inside a width-limited container and call `JEV.boot()`.

## Data it consumes
The agents take turns in a six-step loop (scan, research, price, size, fill, close) driven by a timer; each loop adopts the newest `execute` decision from `JEV.recent` (or `JEV.makeDecision()`). Bus: `tick`, `kill` (taker/closer/kelly halt). Emits `agentstep` {agent, verb, text, pnl}.

## Swapping in real data
Call `setStatus(i, 'working'|'done'|'idle'|'halted')` from your own agent events instead of the timer in `runStep()`; the tab paints itself from `ST.status`.

Everything shown is simulated.
