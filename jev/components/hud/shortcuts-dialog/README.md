# Shortcuts dialog
The `?` keyboard-shortcuts modal. Built lazily by core.js, styled by base.css (`.kb`, `.kb-back`), with focus trap, Esc / backdrop close and focus restore. Rows are generated from `JEV.shortcut(key, fn, label)` registrations.

**Reuse:** copy this folder + `engine.js`, `core.js`, `base.css`; call `JEV.boot()`. Add any trigger button and call `JEV.help()` on click (core only binds `#helpBtn` when `#hud` exists). Register your own keys with `JEV.shortcut('p', fn, 'label shown in the dialog')`.

**Consumes:** no market data. The demo chips use bus `decision` and the built-in `f` shortcut (`JEV.fire()`).

**Real data:** not data driven. Replace the built-in `k`/`f` rows by editing the `J.shortcut(...)` calls in core.js if your page has other actions.
