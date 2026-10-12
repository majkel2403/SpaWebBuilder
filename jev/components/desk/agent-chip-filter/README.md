# desk / agent-chip-filter

The filter row of the activity log as its own control: six pill chips (one per agent, in the agent's colour, with a glowing dot and a live step counter). Click mutes an agent (dashed, struck-through, dimmed), double-click solos it (double-click again resets), and every change is broadcast as `JEV.bus.emit('agentfilter', { muted: [...keys], on: [...keys] })` so any list, chart or table can listen and filter itself. Counters pop on each step. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; load the component files and call `JEV.boot()`. Chip markup (also usable standalone): `<button class="dkb-ch" aria-pressed="true" style="--a:#2ee6a6;--ar:46,230,166"><i></i><b>SPOTTER</b><u>12</u></button>`; `--a` is the agent colour, `--ar` its r,g,b. Use `class="dkb-ch off"` for a static muted look. Container is a 3-column grid (2 columns when narrower than 300px). Touch: chips grow to 40px.

## Data consumed
Bus `agentstep` (`{agent, verb, pnl, text}`, emitted by the world module; `agent` is `spotter|prior|edge|kelly|taker|closer`) and bus `decision`. With no `agentstep` source it plays its own simulated steps.

## Swap in real data
Emit `JEV.bus.emit('agentstep', { agent: 'taker', verb: 'fill', pnl: 12.4, text: '...' })` from your own agent runtime; listen for `agentfilter` elsewhere to dim or hide the muted agents' rows.
