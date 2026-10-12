# desk / posterior-history

The thin history strip of the Bayesian card as its own panel: the posterior P(up 5m) sampled four times a second over the last 30 seconds as a glowing line with a gradient fill, a dotted 50 percent coin-flip line, a bright live head and low / high / now readouts. Turns red under the kill switch. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; load the component files and call `JEV.boot()`. One `canvas` inside `.dkb-cvw` (any height >= 60px), readout ids `dkph-now`, `dkph-lo`, `dkph-hi` (each optional).

## Data consumed
Bus `decision` and `tick` (through the shared model) and `JEV.S.killed`.

## Swap in real data
Push your own probability (0..1) into the ring buffer every 250 ms: `SPK[B.si] = p; B.si = (B.si + 1) % NSP` (drop the `dyn` call), and set `B.post` for the head.
