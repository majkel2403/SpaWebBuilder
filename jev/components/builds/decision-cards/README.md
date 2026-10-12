# builds / decision-cards
Five answer cards that code acts on (enter, size, route, exit, flatten); the ones a decision actually uses light up, the route card shows the gate result.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), paste component.html/css/js into a page (inside a width-limited container) and call `JEV.boot()`. Everything is simulated.

## Markup
Same card as the typed-question cards: `article.bld-card.bld-d[data-c]` > `.bld-ci` > `.bld-hd` + two `.bld-rw` rows (`.bld-v`, `.bld-c`) + `.bld-m` bar. The route card's second value carries `data-d="execute|review|skip"` (green / amber / grey).

## Data
Bus `decision`: enter = action + conf, size = size + max(sizes), route = venue + dest, exit = p(close), flatten = p(flatten). Cards used by the decision (hold -> enter; buy/sell -> enter, size, route; close -> exit, route; flatten -> flatten, route) flash.
To use real data: emit `JEV.bus.emit('decision', d)` in the documented shape, or call `show(d, true)` with your own record.
