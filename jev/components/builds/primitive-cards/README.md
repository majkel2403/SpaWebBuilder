# builds / primitive-cards
The three primitive cards (which one? how much? yes or no?) with live answer, confidence below the floor in amber and a glowing confidence bar.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
`article.bld-card.bld-p[data-c="pink|green|blue|yellow|violet|orange|cyan|red"]` > `.bld-ci` > `.bld-hd` (title + tag) and two `.bld-rw` rows (`.bld-v` = the answer, `.bld-c` = the confidence); a `.bld-m > i` bar at the bottom is scaled to the confidence. `data-c` sets the accent (`--cc`).

## Data
Bus `decision`: choice = `d.action` + `d.conf`, score = `d.size` + max of `d.sizes`, flag = `d.riskOk` + `d.pRisk`. A confidence under `JEV.S.floor` turns amber (also on bus `floor`).
To use real data: call `setConf(card, p)` / set `.bld-v` from your own typed answers or emit `JEV.bus.emit('decision', d)`.
