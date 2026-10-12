# JEV motion (preset package)

Premium motion for any element, and a ready choreography for each component page.

**Use it anywhere**: copy `motion.css` + `motion.js`, then
```html
<div data-m="rise" data-m-delay="120">...</div>          <!-- entrance: fade rise drop slide-l slide-r scale zoom pop blur flip tilt wipe-x wipe-y iris glow spring -->
<ul data-m-stagger><li>..</li><li>..</li></ul>           <!-- or JEVM.apply({items:[{sel:'li',enter:'rise',stagger:70}]}) -->
<span data-m-loop="pulse"></span>                          <!-- ambient: breathe float pulse glow shimmer sweep flicker sway orbit ring -->
<h2 id="t"></h2><script>JEVM.split(document.getElementById('t'))</script>   <!-- letter-by-letter -->
```
Tokens (CSS variables): `--m-ease-out/in/io/back/spring`, `--m-dur-xs..xl`, `--m-stagger`, `--m-dist`, `--m-speed`. API: `JEVM.apply(cfg) play(root) out(root) replay(root) split(el) count(el,to) spring(k,c) speed(x)`.
Safety: without JS everything is visible; `prefers-reduced-motion` shows the final state and stops loops; `html[data-tier="1"]` drops blur/glow; hidden tabs pause loops; after the entrance finishes the element is released (`.m-done`) so it never fights a component's own transitions.

**Per component**: `components/<g>/<name>/component.json` has a `"motion"` block, e.g.
```json
"motion": { "config": { "root": {"enter":"fade","dur":500},
  "items": [{"sel":".card","enter":"rise","stagger":80,"dur":700}],
  "loops": [{"sel":".lamp","loop":"pulse"}] }, "css": ["motion.css"] }
```
`node jev/build-components.mjs --only <g>/<name>` bakes it into that component's `index.html`, which gets a control bar (replay / exit / 0.5x / loops). The main page is unchanged (no motion block, byte-identical build).
Tools: `node jev/tools/motion-check.mjs --all` (verifies final visibility, errors), `node jev/tools/motion-film.mjs <g>/<name> out.png` (filmstrip).
