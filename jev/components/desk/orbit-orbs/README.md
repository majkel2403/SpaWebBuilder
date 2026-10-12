# desk / orbit-orbs

The six agents (spotter, prior, edge, kelly, taker, closer) as glossy orbs with eyes, orbiting a white Jev orb on a tilted dashed ellipse. Orbs in front are larger and brighter, orbs behind are smaller and dimmer; the eyes glance along the path. On every decision the orbs light up one after another with a pulsing halo and a coloured name pill.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, paste `component.html`, call `JEV.boot()`. Each orb is `<button class="dkw-ob" style="--ac:#hex;--ac-rgb:r,g,b"><span class="orb green">...</span><em>name</em></button>` (orb colour classes: green amber pink violet blue orange cyan red white). The orbit radius / tilt come from `layout()` and `OB_ROT`; speed is `dt * 0.28`. Add more orbs by changing `6` and the `TAU / 6` spacing.

## Data consumed
Bus `decision` (sequential highlight), `kill` (freeze + dim). Hover or focus pauses the spin.

## Swap in real data
Call the `light(i)` logic from your agent runtime events (agent `i` started) instead of the decision handler.

Everything shown is simulated.
