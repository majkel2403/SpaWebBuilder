# desk / p-up-readout

The headline answer of the Bayesian card: a 62px serif odometer for P(up 5m) in neon green that flips to red below 50 percent (and when the kill switch is thrown), with two key/value lines (`vs coin flip`, `vs prior`, in percentage points) and the number of updates. Digits roll like an odometer. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; load the component files and call `JEV.boot()`. Markup: `.dkb-big` (label + `.dkb-bv` with a `span.num` for the odometer and a `<small>%</small>`), add `.dn` for red or `.dkb-cap` for the amber variant; `.dkb-kv` holds right-aligned label/value pairs (`b.neg` for red). Colour via `--rc` / `--rc-rgb` on `.dkb-big`.

## Data consumed
Bus `decision` (`d.state.edge_bps`, `d.state.imbalance`, `d.conf`), bus `tick`, `JEV.S.killed`.

## Swap in real data
Replace `makeModel()` with your own: all the component needs is `B.post` (0..1 probability) and `B.dmp` (the prior mean) each frame, plus `B.n` for the counter.
