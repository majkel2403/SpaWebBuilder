# desk/activity-log

Activity log card: a real CHUNK of the desk section (module desk-bottom), not a copy. component.html/css/js are consecutive pieces of the section source (initLog (#dkb-log)); the page and this standalone are both built from them (see components/UNITS.md).

Standalone: `compose` = desk/_bottom-head + _bottom-stub-bayes, _bottom-stub-drift, _bottom-beat, _bottom-init-log, _bottom-close, _bottom-css-resp (+ itself). The _bottom-stub-* units are empty hidden cards that satisfy the module guard. Needs fx (the .rv reveal).
Reuse: copy this folder + engine/core/base + the units listed in compose.
