# desk / marquee-chips
The desk's scrolling chip marquee on its own: pill chips with a coloured pulsing dot, lowercase tracked labels and glowing values, looping seamlessly under an edge fade mask with a soft travelling light. Pauses on hover or keyboard focus; on touch a tap holds it ("held . tap to resume"). With reduced motion it becomes a scrollable strip. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. Markup: `.dkt-mq > .dkt-mt > .dkt-ms` holding `<span class="dkt-c" data-c="green|blue|violet|pink|cyan|yellow|orange|red|gray">label <b data-k="key">value</b></span>` (the `data-c` accent comes from base.css and sets `--cc`/`--cc-rgb`). The script duplicates the `.dkt-ms` set and sets the loop duration `--mqd` from its width (about 46 px/s). Add `data-ck="name"` to a chip you want to recolour live.

## Data consumed
Bus `decision` (last ticket, holder agent, handoff rate, review queue, edge), `JEV.market.price`, `JEV.S` (cost, floor, killed).

## Swap in real data
Edit the `K('key', text)` calls in `flush()`, one per `data-k`, and call `chipC('key', 'green'|'red'|...)` to recolour; add chips in the HTML by repeating the pattern.
