# lab / decide-button

The magnetic DECIDE button: hot-pink gradient, a light sweep every few seconds, a spotlight that follows the mouse, a pull toward the pointer (mouse only), a click ripple from the exact click point, an Enter key hint and a pulsing `dirty` state for "inputs changed, press to re-run". Clicking fires a simulated decision with `JEV.fire()`.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Markup
```html
<div class="lab-magw"><button class="lab-go" type="button"><span class="lab-go-t">decide</span><kbd class="lab-kbd">↵</kbd><svg class="lab-go-i">…</svg></button></div>
```
The `.lab-magw` wrapper gives the pointer a larger hit area for the pull. Add `dirty` for the pulsing halo. Variables on the button: `--tx`, `--ty` (pull) and `--mx`, `--my` (spotlight) are set by the script.

## Data
Calls `JEV.fire()` (a normal `decision` on the bus) and `JEV.pulse()` if the fx module is loaded. Emits `JEV.bus 'lab-decide' {n}`. The readout subscribes to `decision`.

## Swap in real data
Replace the `J.fire()` call in `decide()` with your own trigger (post the current inputs to your model, then emit its answer as a `decision` record on `JEV.bus`).
