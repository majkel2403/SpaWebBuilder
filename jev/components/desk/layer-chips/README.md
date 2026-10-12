# desk / layer-chips
Pill-chip atoms from THE TAPE header: static status chips (`.dkt-chip.dkt-st`), toggle chips (`button.dkt-chip`, `.on` = active, glowing dot, `aria-pressed`) and the full accent palette. The demo page toggles four layers and prints which ones are on; one status chip is live (colour and text follow the latest decision gate).

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`, load the three component files and call `JEV.boot()`. Markup: `<span class="dkt-chip dkt-st" data-c="pink">label</span>` for status, `<button type="button" class="dkt-chip on" data-c="yellow" data-l="vwap" aria-pressed="true">vwap</button>` for a toggle. `data-c` (pink gray green blue yellow violet orange cyan red, from base.css) sets `--cc` / `--cc-rgb`, which drive border, fill and glow. Touch targets grow to 40 px on coarse pointers.

## Data consumed
Bus `decision` (`dest`, `conf`) for the live status chip only. Toggles are local.

## Swap in real data
Listen to the bubbling `dkt-layer` CustomEvent (`detail: {layer, on}`) on the component root to show or hide your layers; set `data-c` / text of status chips from your own state.
