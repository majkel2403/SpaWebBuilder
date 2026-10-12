# lab / switch-card

The lab's switch cards: a glass row with the glowing `.tg` toggle on the left and a two-line label (uppercase title, small caption that changes with the state). Four demo states plus the kill switch, which is bound to the runtime: toggling it calls `JEV.setKilled()` so the HUD, the page tint and every other component follow, and key `K` flips it too.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Markup
```html
<button class="lab-sw" type="button" role="switch" aria-checked="false" data-c="green" data-on="orders logged, not routed" data-off="orders go to the venue">
  <i class="tg"></i><span class="lab-sw-t"><b>dry run</b><small>orders go to the venue</small></span>
</button>
```
`data-c` sets the accent (pink green blue yellow violet orange cyan red gray); `aria-checked` drives the `.on` look; `disabled` greys it out. `.lab-kill` is the full-width red variant, `data-bind="kill"` binds it to the runtime.

## Data
Emits `JEV.bus 'lab-switch' {id, on}`. The kill switch reads `JEV.S.killed` and bus `kill`.

## Swap in real data
Listen to `lab-switch` and call your own API; for the kill switch replace `J.setKilled(on)` with a request to your risk service and call `paint()` when it confirms.
