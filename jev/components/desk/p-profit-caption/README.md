# desk / p-profit-caption

The caption of the drift card on its own: the big amber serif odometer for P(profit), the share of 140 simulated equity paths that are above zero at the current trade, plus drift and noise per step, the trade counter `n=`, a loss-to-profit colour key and the pooled result across finished runs. It makes the law-of-large-numbers point in one number: a tiny positive drift buried in noise still turns profit-likely over many trades. A red HALTED badge appears (and the walk stops) under the kill switch. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; load the component files and call `JEV.boot()`. Markup: `.dkb-big.dkb-cap` (label + `.dkb-bv` with `span.num` + `<small>%</small>`), `.dkb-kv` pairs (`b.dkb-vi` violet, `b.dkb-or` orange), footer `.dkb-df` with the colour key `.dkb-gr` and `.dkb-pool`.

## Data consumed
No bus data: it runs its own simulated walks (drift +0.8bp, noise 8.6bp per step, 220 trades, a new run every ~10 s). `JEV.S.killed` halts it.

## Swap in real data
Replace `makeSim()`: keep the paths' current equity values in `sim.V` (N values) and set `sim.step`, `sim.mu`, `sim.sg`; the caption counts `V[i] > 0`. For real runs push `sim.poolW` / `sim.poolN` / `sim.runs` when a backtest completes.
