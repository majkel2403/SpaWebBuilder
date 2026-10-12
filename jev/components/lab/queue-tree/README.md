# lab / queue-tree

The "code acts" end of the pipeline: a typed `handoff.json` that types itself out for every decision, and a `queue/` file tree with `execute/`, `review/` and `skip/` folders where each decision lands as a new file (counter badge per folder, newest two files listed).

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data it consumes
Bus `decision` records: `action, size, venue, conf, riskOk, reason, dest`. Folders are chosen by `dest` (`execute | review | skip`). On start it seeds itself from `JEV.recent`.

## Swap in real data
Emit your own decisions with `JEV.bus.emit('decision', {...})`, or call `take(decision, true)` from `component.js`. Rename the folders by editing the `['execute','review','skip']` lists and the `DC` colour map; the handoff fields live in `showJson()`.
