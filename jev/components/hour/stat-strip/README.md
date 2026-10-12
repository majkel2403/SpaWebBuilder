# hour / stat-strip

A strip of six big serif numerals with a text-shadow glow and a small caption each. When the strip scrolls into view they count up (`J.countTo`) and settle with a flare (`.hr-done`); tap or press Enter to replay. The first four are illustrative backtest numbers (`data-to`), the last two follow the live decision counter and cost (`J.S.count`, `J.S.cost`).

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; add the html and call `JEV.boot()`. Standalone page: `node jev/build-components.mjs --only hour/stat-strip`.

```html
<div class="hr-st4 hr-st6">
  <div><b data-to="1840" data-f="int">1,840</b><span>backtested trades</span></div> ...
</div>
```
- `data-to` is the end value, `data-f` picks the formatter (`time`, `int`, `pct`, `usd2`, `usd3`; add your own to the `F` table in `component.js`).
- the colour of each number comes from the `:nth-child` rules; use `b.up` (green), `b.dn` (red), `b.hr-amb` (amber) to override.
- columns: 6 wide, 3 in a narrow container; edit `.hr-st6` for another count.

## Data it consumes
`J.S.count`, `J.S.cost` (last two cells) via bus `decision`.

## Swapping in real data
Put your own numbers into `data-to`, and replace `setLive()` with your counters (orders sent, fees paid, P&L).

Everything shown is a simulation.
