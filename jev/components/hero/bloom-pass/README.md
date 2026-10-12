# hero / bloom-pass
The bloom of the main hero's live canvas. Every 2nd frame (quality tier 3) or 3rd (tier 2) the canvas, with everything drawn so far, is copied into an offscreen canvas at 1/3 size, that into a second one at 1/9 size (the bilinear down-sampling is the blur), and the 1/9 copy is drawn back over the full canvas with `lighter` compositing at alpha 0.46 (0.62 on tier 3). No filters, no shadowBlur: two small `drawImage` calls per capture and one per frame. The button turns the pass on and off; the two thumbnails show the actual buffers.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (about 1100px wide), include component.css and component.js, and call `JEV.boot()`. To bloom your own canvas keep `bA`, `bB`, the size lines in `onLayout` and the `if (bB.width > 1) {...}` block of `draw()`, and run it as the last step of your frame.

## Data
JEV.bus `decision` (a wave of beams to bloom) and `kill` (red beams). Click or tap the stage, or key `f`, fires a simulated decision.

## Swap in real data
Emit `decision` records from your model service; the pass bloom is data-independent. Everything shown is simulated; no orders are placed.
