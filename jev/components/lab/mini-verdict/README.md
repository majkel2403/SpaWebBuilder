# lab / mini-verdict

The sticky mobile verdict strip of the lab as an atom: action in caps, size, `conf 0.93` and a coloured destination tag in one glass pill whose border and glow take the route's colour (execute green, review amber, skip grey). It pops slightly on each decision. Two static variants show the other routes.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Markup
```html
<div class="lab-mini" data-d="execute"><b class="lab-mi-a">buy</b><span class="lab-mi-s">1%</span><span class="lab-mi-c">0.93</span><i class="lab-mi-d">execute</i></div>
```
`data-d` = `execute` | `review` | `skip`. The original is `position: sticky; bottom: 10px` on phones (it is static here); restore that to pin it to the bottom of a scroll area.

## Data
Bus `decision`: `action`, `size`, `conf`, `dest`.

## Swap in real data
Emit your own decision records, or call `show(record, true)`.
