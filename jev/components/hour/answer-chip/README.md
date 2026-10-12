# hour / answer-chip

The "last answer" pill: a coloured dot and one line of mono text (`buy BTC 0.91 > execute`). `data-d` picks the colour: `execute` green, `review` amber, anything else (`skip`) grey. The live pill pulses on every decision; three static ones show the states.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; add the html, call `JEV.boot()`. Standalone page: `node jev/build-components.mjs --only hour/answer-chip`.

```html
<span class="hr-last" data-d="execute"><i></i><span>buy BTC 0.91 &gt; execute</span></span>
```
Update with JS: set the text of the inner `<span>`, set `el.dataset.d`, and swap `hr-fl-a` / `hr-fl-b` to replay the pulse. On narrow screens the live pill drops the symbol and confidence.

## Data it consumes
bus `decision`: `d.action`, `d.symbol`, `d.conf`, `d.dest`.

## Swapping in real data
Emit your own object with those four fields (`JEV.bus.emit('decision', {...})`) or call the handler body directly with your order result.

Everything shown is a simulation.
