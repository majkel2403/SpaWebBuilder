# lab / range-slider

One glowing range slider as a reusable atom. A `.lab-row` is a label, a value readout and a track with: neon fill (bipolar from a zero mark, or from the left), a value bubble that pops above the thumb while dragging or focused, a light trail behind the thumb, tick sparks on every step, an optional hatched red risk band (the readout and fill turn red inside it) and a keyboard model (arrows, shift = x10, double-click resets). The demo shows five variants; the last one follows the live net edge of the decision stream until you grab it.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Markup
```html
<div class="lab-row" data-c="yellow" data-label="spread_bps" data-min="0.2" data-max="20" data-step="0.1" data-value="1.8" data-dec="1" data-dz="8,20"></div>
```
Attributes: `data-c` accent (pink green blue yellow violet orange cyan red gray), `data-label`, `data-min/max/step/value`, `data-dec` decimals, `data-unit`, `data-sign` (always show +/-), `data-usd`, `data-bi` + `data-mark` (fill grows from the mark), `data-dz="a,b"` (red band), `data-follow="net"`. CSS variables on `.lab-rng`: `--rh` track height, `--tw` thumb width. Put rows in `.lab-sliders`; on narrow containers they stack label/readout over the track.

## Data
Emits `JEV.bus 'lab-slider' {key, value}` on every input. Rows with `data-follow="net"` consume bus `decision` (`d.net`).

## Swap in real data
Listen with `JEV.bus.on('lab-slider', e => ...)`, or read `input.value` of any row. To drive a row from a feed, call `setVal(row, value)` in `component.js` (or set `goal` on a follow row) instead of the decision handler.
