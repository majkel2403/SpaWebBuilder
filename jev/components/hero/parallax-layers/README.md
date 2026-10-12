# hero / parallax-layers
The layered parallax of the main hero. Far layer: the dot grid (moves with the pointer, most) and the spinning aura; mid layer: the network plane (static mesh, panels and live beams share one element); near layer: the cached label canvas and the glass cards, which move against the plane. Pointer offsets are eased (`ax`, `ay`, up to 16 x 10 px) and mapped to translations of 0.9 / -0.3 / -0.12 (labels) / -0.5, -0.35, -0.25 (cards); scroll adds 60 / 22 / -14, -10, -8 px. Everything is written through the individual `translate` and `scale` CSS properties, only when the quarter-pixel value changes, so there is no layout and no repaint of the canvases. Phones (< 700px) keep the scroll part only. At tier 3 the plane gets a 0.6% scale punch when a decision executes. The slider adds a simulated scroll so the effect can be seen without a long page.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (about 1100px wide), include component.css and component.js, and call `JEV.boot()`. To parallax your own layers keep `PRL`, `setPar`, `parReset` and `parallax()` and list your elements in `PRL` with their depth factors.

## Data
`JEV.pointer` and `JEV.scroll.y` (both maintained by core), `JEV.bus` `decision` (beams, scale punch) and `kill`. Reduced motion and quality tier 1 turn the parallax off.

## Swap in real data
Emit `decision` records from your model service; the parallax is purely visual. Everything shown is simulated; no orders are placed.
