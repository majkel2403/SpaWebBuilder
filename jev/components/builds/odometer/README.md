# builds / odometer
A rolling-digit odometer atom (reel per digit, forward roll on 9 to 0, digit flash) shown as four variants: decisions count, running cost, median latency and a manual stepper.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
Any element becomes an odometer: `const o = odo(el, '1,892'); o.set('1,893')`. It writes a visually-hidden `.sr-only` copy (screen readers) and an `aria-hidden` `.bld-odo` made of `.bld-od` reels (one per digit) and `.bld-op` literals (`,` `$` `.` letters). Size it with font props on the host and the CSS variable `--oh` (reel height, e.g. `1.12em`; must equal the line-height). Digits roll forward only (a spare 0 reel makes 9 -> 0 keep rolling), changed digits flash white.

Options on `set(text, {quiet, stagger})`: `quiet` = no flash, `stagger` = digits roll with a 70 ms delay each (nice for first reveal). When the string length changes the odometer rebuilds.

## Data
Live demos read `JEV.S.count`, `JEV.S.cost`, median of `JEV.S.ms`; the fourth is driven by buttons. To use real data call `.set()` with your own formatted string. The function is also published as `JEV.odo` when this component loads.
