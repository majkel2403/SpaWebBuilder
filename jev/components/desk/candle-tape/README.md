# desk / candle-tape
"THE TAPE": a canvas candlestick chart (1 candle = 6 s of live data, back-filled with 76 seeded candles), decayed VWAP with +/-1 sigma bands, volume bars with glow, buy / sell / close markers fired by executed decisions, last-price tag, hover / touch / arrow-key crosshair with OHLC and ticket cards, and the live order book + imbalance meter on the right. Chips toggle vwap / bands / book. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, include the three component files and call `JEV.boot()`. The canvas fills its container (`.dkt-tc`), so it works as the only element on a page at any width.

## Data it consumes
Bus events from `engine.js`/`core.js`: `tick` ({price, dp}, 4 Hz), `decision` (action, symbol, size, conf, dest, venue, build, state), `kill` (via `JEV.S.killed`). Everything is simulated.

## Swap in real data
Candles are built in `tapeTick(price, dp)` from the bus `tick`; call it from your trade/quote stream (`dp` = price change, used for volume). The seeded history lives in `seedTape()` (replace with real klines: objects {o,h,l,c,v} then `accum()`). Book levels come from `tA/tB` (target sizes per level) and `bookLabels(price)`; overwrite them with your L2 snapshot. Markers: push {cid, price, kind:'buy'|'sell'|'close', t, txt, size, conf, dest, venue} onto `marks`.
