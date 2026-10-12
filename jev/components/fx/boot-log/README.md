# fx / boot-log
An inline terminal card that types five check lines with scrambling glyphs, resolves each with a green status and fills a tick-by-tick progress bar.

The boot overlay's terminal card as an inline widget. A wall-clock timeline (`starts`/`durs` per line, eased overall progress) types each line with 3 scrambled glyphs ahead of the caret, then flashes a green status word (`ok`, `ARMED`, `online`) and ticks the progress bar. Edit `LINES` to show your own checklist; to drive it from real checks, set `row.b.textContent` and the `done` state when each promise resolves instead of using the timeline. Replay button included. Reduced motion shows the final state.

Reuse: copy this folder plus `engine.js`, `core.js` and `base.css` (from `jev/src`); inline them with the folder files (see `build-components.mjs`: base.css + component.css, engine.js, core.js, component.js) and call `JEV.boot()` last.
