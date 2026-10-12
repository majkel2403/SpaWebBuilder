# desk/bayes

Bayesian update card: a real CHUNK of the desk section (module desk-bottom), not a copy. component.html/css/js are consecutive pieces of the section source (the init of the bayes card (initBayes, #dkb-bayes)); the page and this standalone are both built from them (see components/UNITS.md).

Standalone: `compose` = desk/_bottom-head + _bottom-css-ring, _bottom-css-wells, _bottom-stub-log, _bottom-stub-drift, _bottom-beat, _bottom-init-bayes, _bottom-close, _bottom-css-resp (+ itself). The _bottom-stub-* units are empty hidden cards that satisfy the module guard. Needs fx (the .rv reveal).
Reuse: copy this folder + engine/core/base + the units listed in compose.
