# hero / floor-marker
The confidence floor (default 0.85) as a spring-loaded dashed marker on a 0..1 probability track: amber review zone below, pink execute zone above, a green tick for the latest decision confidence that turns amber under the floor, and step buttons to move the floor by 0.05.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (width about 760px), include component.css and component.js, and call `JEV.boot()`. Markup in component.html (`#hfmTrack`, `#hfmFlag`, zones, tick, buttons). The marker is moved with `transform` from a damped spring in `JEV.task`. Floor is written with `JEV.setFloor(v)`.

## Data
`JEV.S.floor`, bus `floor` (number) and `decision` (`d.p[d.action]`, `d.reason`, `d.floor`).

## Swap in real data
Call `JEV.setFloor(x)` when your risk service changes the threshold; emit `decision` for the confidence tick.
Everything shown is simulated; no orders are placed.
