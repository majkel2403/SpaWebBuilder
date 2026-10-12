# desk / venue-ping

A pure CSS venue marker: a glowing coloured dot with a white ring, two expanding ping rings staggered by half a cycle, a city code and a latency tag. Eight markers sit on a faint dot-grid "map" in the demo. No JavaScript.

## Reuse
Copy this folder plus `base.css` (for `--mono`) and paste `component.html`. Marker markup: `<i class="dkx-mk" style="--x:50%;--y:40%;--vc:#hex;--vc-rgb:r,g,b;--d:.3s"><b>code</b><u>ms</u></i>` inside any `position: relative` container. CSS variables: `--x` / `--y` position, `--vc` colour, `--d` animation delay. Under the kill switch (`body.killed`) all markers turn red; reduced motion shows static rings.

## Data consumed
None (static). To drive it, set the text of `<u>` and toggle the animation (e.g. restart by removing / adding the element) when a packet lands.

## Swap in real data
Place markers from real lat/lon (equirectangular: `x = (lon + 180) / 3.6 %`, `y = (90 - lat) / 1.8 %`) and fill `<u>` with measured latency.

Everything shown is simulated.
