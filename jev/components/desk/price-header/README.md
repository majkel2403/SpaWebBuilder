# desk / price-header
The price readout above the candle chart: a large tabular sans price with a superscript $ and a small decimal, a green or red percent pill with an arrow (versus the session open) and a hi / lo / volume figure line. On every tick the digits flash green or red for 400 ms. Simulated BTC-perp.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. Markup: `.dkt-pxv > sup + b + em` for the price and `.dkt-pxp` (`.dn` for negative) for the pill. Scale it with `font-size` on `.dkt-pxv`.

## Data consumed
Bus `tick` ({price, dp}, 4 Hz) and `JEV.market.open`.

## Swap in real data
Call `render(lastPrice)` from your own websocket handler instead of the `tick` subscription, and keep `M.open` (session open) current; `st.vol` is a simulated volume sum, replace it with your traded volume.
