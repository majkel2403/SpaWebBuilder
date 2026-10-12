# fx / full-section
The whole fx module on one demo page: boot overlay, plasma background, grain, scanlines, cursor spotlight and ring, scroll progress, split headings, reveals, toasts, kill-switch shockwave and glitch, with a small bar to fire a decision, raise a toast and throw the kill switch.

Reuse: `fx.css` and `fx.js` are unmodified copies of `src/css/fx.css` and `src/js/fx.js`; the fx markup is at the top of component.html. Copy this folder plus `engine.js`, `core.js`, `base.css`, inline them (base, fx.css, component.css, engine, core, fx.js, component.js) and call `JEV.boot()`. For single effects use the sibling components.

**Data it consumes:** bus `kill`, `decision`, `tick`, `floor`, `tint`, `tier`; optional DOM `#hud`, `#killBtn`, `.nav`, `.orb`. Swap in real data by emitting those events.
