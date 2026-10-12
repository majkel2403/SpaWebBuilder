# desk / agent-row

The six agent rows of the ticket card: orb, name, role line, a value chip (venue, prior p, edge bp, size %, price, action) and a progress hairline along the bottom. Rows take turns on every decision (working, then done); the active one glows in its colour. Click a row to pin it (`aria-pressed`).

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, paste `component.html` and call `JEV.boot()`. A row is `<button class="dkw-ar" data-k style="--ac:#hex;--ac-rgb:r,g,b">` with an `.orb <colour>`, `.dkw-an` (name + role), `.dkw-av` (value) and `.dkw-ab`. State lives in `data-st` (`idle|working|done|halted`) and class `is-on`. Wrap in `.dkx` for the `--dkw-*` variables.

## Data consumed
Bus `decision` (answers are built from `d.venue`, `d.conf`, `d.net`, `d.size`, `d.state.price`, `d.action`) and `kill` (rows show "halted").

## Swap in real data
Replace `answers(d)` with the output of your six agents and call `run()` when a ticket starts.

Everything shown is simulated.
