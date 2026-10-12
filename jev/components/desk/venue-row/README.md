# desk / venue-row

One venue feed row (and a list of four): venue name + city tag in the venue colour, price that rolls up/down on every tick, 12 spark bars of the last prices, latency (green/amber/orange) and bps versus the oracle. The row warms up (orange = rich, blue = cheap) with its deviation from the oracle.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, paste `component.html` into a container and call `JEV.boot()`. Add a row by copying one `<li><button class="dkw-v">`; set `--vc` / `--vc-rgb` (colour), `data-bias` (standing bps vs oracle) and `data-lat` (base latency ms). Wrap in an element with class `dkx` (defines `--dkw-k`, `--dkw-ink`, `--dkw-glass`).

## Data consumed
`JEV.bus` `tick` and `JEV.market.price` (the oracle). The venue prices are simulated as oracle times a small mean-reverting noise.

## Swap in real data
Delete the simulation in `step()` and set `f.price`, `f.lat` from each venue's websocket; keep pushing `f.hist` (12 values) and call `paint(f, true)`.

Everything shown is simulated.
