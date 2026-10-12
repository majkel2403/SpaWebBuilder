# Runtime tail
A blank dark stage that prints `JEV.S`, `JEV.market` and the newest decisions (`JEV.recent`) as JSON, updating on the bus. Use it to check a feed or to see what the other components receive.

**Reuse:** copy this folder + `engine.js`, `core.js`, `base.css`; call `JEV.boot()`.

**Consumes:** `JEV.S`, `JEV.market` (4 Hz `tick`), `JEV.recent[]`, bus `decision` / `tick` / `kill` / `floor`. Decision fields printed: `id symbol action size conf dest reason ms`.

**Real data:** replace the simulator by emitting your own records: `JEV.recent.unshift(d); JEV.bus.emit('decision', d)` (and `JEV.bus.emit('tick', {price, dp})` after setting `JEV.market.price`); the tail updates unchanged.
