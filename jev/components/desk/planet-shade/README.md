# desk / planet-shade

The body of the globe without any dots: two pre-rendered layers (a cyan to violet atmosphere glow, a dark blue sphere with a fresnel rim, a hairline limb and a faint far halo), six nested translucent crescents for the day / night terminator and a warm sun bloom + sunlit hairline that drift slowly around the limb. A second red layer cross-fades in under the kill switch.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, paste `component.html`, call `JEV.boot()`. Sphere centre / radius are `cx, cy, R` in `layout()`; draw your own content (dots, arcs) on top of the same canvas, between the layer draw and the terminator for the best look. Layers are DPR-capped at 1.5x and rebuilt only on resize.

## Data consumed
Bus `kill`. The sun direction `(sxv, syv)` is a sine drift; set it from the real sub-solar point for a true terminator.

## Swap in real data
Compute the sun vector from the current UTC time and the globe's yaw, and assign `sxv`, `syv` each frame.

Everything shown is simulated.
