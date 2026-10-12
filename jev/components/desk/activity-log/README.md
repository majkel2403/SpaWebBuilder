# desk/activity-log — Activity log card

Six-agent log, newest on top, per-agent mute/solo chips, live/pause, '+N' catch-up pill, full-message card.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` (from `jev/src`); inline them with the component's `component.html/css/js` and call `JEV.boot()` (the shared `main.js` does it). `node jev/build-components.mjs --only desk/activity-log` builds a standalone `index.html`.

**Data consumed:** bus `agentstep` ({agent, verb, pnl, text}) when present (otherwise synthesised), bus `decision` (JEV rows), bus `kill`; `JEV.AGENTS`, `JEV.market.price`, `JEV.recent`, `JEV.S.floor`.

**Swap in real data:** emit `JEV.bus.emit('agentstep', {agent:'spotter', verb:'scan', pnl:null, text:'...'})` for each real step; the synthesiser stays quiet while real steps arrive.
