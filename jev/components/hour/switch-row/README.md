# hour / switch-row

The spring toggle row from "the hour": a button with a label, a minute range, a glowing knob that squashes under the finger and springs (overshoot curve), a ripple ring, an `on` / `off` word and a bottom progress bar. The demo shows four states: on, off, running (`.act`, animated bar) and a live row wired to the kill switch.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css`, drop `component.html` in your page and call `JEV.boot()`. Build the standalone page with `node jev/build-components.mjs --only hour/switch-row`.

Markup and classes:
```html
<li><button type="button" class="hr-sw on" data-c="orange" aria-pressed="true">
  <b>label</b><i>00-08</i><span class="tg"></span><em>on</em><u><s></s></u>
</button></li>
```
- colour: `data-c` (orange, blue, yellow, green, cyan, pink, red, violet); state: `.on` + `aria-pressed`; running highlight: `.act`; bar: set `transform: scaleX(0..1)` on `u s`.
- layout: put rows in `ul.hr-sws` (2 columns, 1 column in a narrow container); the row itself only needs `.hr-p` (or any `container-type: inline-size` ancestor) for the compact mode.
- pop / ripple: toggle `pop-a`/`pop-b` and `rip-a`/`rip-b` (see `setSw` in `component.js`).

## Data it consumes
- the kill row: `J.S.killed`, bus `kill`, and `J.setKilled(bool)` on click.

## Swapping in real data
Replace the `data-live="kill"` handler with your own flag: call `setSw(button, value, true)` when your state changes and send the new value from the click handler.

Everything shown is a simulation.
