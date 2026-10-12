# desk / activity-row

A single row of the six-agent activity log: status dot, agent tag, verb, a coloured value and a one-line message. The live row at the top replaces itself on every step with the log's entrance (blur slide, agent-coloured edge flash, scan sweep, chromatic text; JEV rows add a neon underline). Four static variants below show a gain, a loss, a JEV choice that went to review, and the red kill-switch row. Below 400px the row folds into two lines. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`. Row markup: `li.dkb-r` > `i.dkb-d` + `b.dkb-ag` + `span.dkb-vb` + `span.dkb-v` (`.up` green, `.dn` red, `.am` amber, `.gy` grey, `.pk` pink) + `span.dkb-ms`. Set `--a` (agent colour, hex) and `--ar` (same colour as `r,g,b`) on the `li`. Modifiers: `.dkb-j` JEV row, `.dkb-rk` kill row (red), `.mute` dimmed, `.new` plays the entrance once. Put rows in an `ol.dkb-rl` inside any container (the row layout switches with the container width, `container: dkb / inline-size` on the card).

## Data consumed
Bus `agentstep` (`{agent, verb, pnl, text}`), `decision`, `kill`; falls back to simulated agent steps when no `agentstep` arrives.

## Swap in real data
`show(step(META.taker, 'fill', 12.4, 'filled on okx'))` for any agent event, or build the `<li>` yourself from your fills; keep one `li.dkb-r` per event and prepend to your list.
