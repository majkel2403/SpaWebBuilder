# desk / candles-vwap
The candle chart without the order book: 80 visible candles (6 s each, seeded with back-history), volume bars along the bottom, an exponentially-decayed VWAP line with a +/-1 sigma violet band, fired-ticket markers (green up-triangle buy, red down-triangle sell, amber diamond close), a dashed pink last-price line with a price tag and a pulsing live dot, plus a crosshair tooltip (OHLC, vwap, volume) on hover or touch. Simulated BTC-perp.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. The canvas fills `.dkt-tc` (set its height with `min-height`); it repaints only while visible. For the full tape with the order book use `desk/candle-tape`.

## Data consumed
Bus `tick` ({price, dp}, 4 Hz) builds the live candle (new candle every 6 s); bus `decision` (BTC-PERP, executed) adds a marker.

## Swap in real data
Fill `cands` with `{cid, o, h, l, c, v, ...}` bars (call `accum(bar, previousBar)` to compute vwap and sigma, or set `bar.vw` / `bar.sd` yourself) and replace the `tick` handler with your own trade stream; push `{cid, price, kind: 'buy'|'sell'|'close'}` into `marks` for fills.
