# hour / gantt-rail

Six phase bars on a sixty-minute rail. Each bar's position comes from two custom properties (`--s` start minute, `--e` end minute) and its fill from `--f` (0..1); a white playhead with a comet tail sweeps across, the axis labels light up as it passes and a clock badge counts the minutes. Loops every 16 s; tap or press Enter to restart.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; add the html, call `JEV.boot()`. Standalone page: `node jev/build-components.mjs --only hour/gantt-rail`.

```html
<div class="hr-g-rows"> <i class="hr-g-r" data-c="green" style="--s:41;--e:52"><s></s></i> ... <b class="hr-g-ph"></b> </div>
```
Add rows freely (the range is 0..60; change `/ 60` in the CSS and script for another span). Colour: `data-c`. The playhead is positioned by `transform: translateX(px)` from script.

## Data it consumes
Nothing external; it is a timer. `PLAY` / `REST` are seconds in `component.js`.

## Swapping in real data
Set `m` (elapsed minutes, 0..60) from your pipeline and call `render()`; set `--s` / `--e` from the real start and end of each stage.

Everything shown is a simulation.
