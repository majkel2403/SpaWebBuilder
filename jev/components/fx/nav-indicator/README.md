# fx / nav-indicator
A sliding pink underline with glow that follows the active item of a nav strip, with the active label lit.

The HUD nav's active-section marker: an absolutely positioned 2px gradient bar with glow that transitions `left`/`width` to the `.on` link (`offsetLeft/offsetWidth`). `JEV.navBar(nav)` measures and moves it; call again on resize. In the page a scroll-spy sets `.on`; here clicks and every 6th decision do. Swap the `decision` listener for your own state (router, tabs).

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
