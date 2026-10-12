# desk/drift-chart

Drift vs noise card: a real CHUNK of the desk section (module desk-bottom), not a copy. component.html/css/js are consecutive pieces of the section source (initDrift (#dkb-drift)); the page and this standalone are both built from them (see components/UNITS.md).

Standalone: `compose` = desk/_bottom-head + _bottom-css-wells, _bottom-stub-bayes, _bottom-stub-log, _bottom-beat, _bottom-init-drift, _bottom-close, _bottom-css-resp (+ itself). The _bottom-stub-* units are empty hidden cards that satisfy the module guard. Needs fx (the .rv reveal).
Reuse: copy this folder + engine/core/base + the units listed in compose.
