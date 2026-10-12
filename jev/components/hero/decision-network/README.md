# hero / decision-network
Unit of the section hero/full-section: the whole hero section (decision network canvas, chip, legend, title card, backdrop) assembled from its units. It is a chunk of the real source (derived), not a copy; edits here change the main page.

## Reuse
Copy this folder plus engine/core/base (and fx) from src/; the standalone page is the section built from every hero unit (html/css/js orders in component.json). JS lives in the hidden unit hero/_js (one closure, not splittable without rewriting).

Everything shown is simulated; no orders are placed.
