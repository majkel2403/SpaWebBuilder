# JEV components

Every section and chart of the JEV Desk as a standalone page (59 components). Open `components/index.html` for the gallery.

**Use one elsewhere:** copy its folder (`component.html`, `component.css`, `component.js`, `component.json`) plus the shared runtime `src/js/engine.js`, `src/js/core.js`, `src/css/base.css`, put the markup in a container and call `JEV.boot()` after loading the scripts. Each folder's own `README.md` lists the data it consumes (bus events `decision`, `tick`, `kill`, `floor`, `JEV.market`) and how to feed it real data.
**Rebuild pages:** `node jev/build-components.mjs` (all) or `--only group/name`. Standalone `index.html` files are generated and fully self-contained.
Note: components are extracted copies of the main page's modules; the main page (`node jev/build.mjs`) is still built from `src/`. All data is simulated.

| component | title | description |
|---|---|---|
| `builds/build-card` | Build card | A reusable build card with a typed-question tag, live answer, confidence sparkline against the floor line and a hover-tilt glass look, shown as a grid of four accent variants. |
| `builds/core-card` | JEV core card | The glass JEV system-one card: a spinning pink rim, pulsing halo and rings, a holographic JEV wordmark that tilts with the pointer, a live action chip and last-answer line. |
| `builds/full-section` | Builds full section | The whole "ten builds, one decision layer" section: head with live stats, the particle hub, the circuit traces and all six live dashboard tiles. |
| `builds/hub` | Builds hub | The full decision hub: a glass JEV core card fed by ten build cards through particle ribbons, then three typed questions, five answers and the hard-rules row, all live from the simulated decision stream. |
| `builds/ribbons` | Particle ribbons | Glowing particle ribbon streams flowing between two boxes: additive particles with trails, comets and bursts that fire on each decision, boost on hover and freeze red under the kill switch. |
| `builds/tile-code-owns` | What code owns tile | Five bars for the things plain code holds (the menu, thresholds, orders, the stop, the log); the stop turns red under the kill switch. |
| `builds/tile-cost` | Cost this run tile | A serif odometer showing the simulated running cost of all typed answers, with decisions count, cost each and a zero-token line. |
| `builds/tile-decision-stream` | Decision stream tile | A live list of the newest decisions from every build with primitive tag, action, confidence and the gate result (execute, review or skip). |
| `builds/tile-latency` | Latency by build tile | Ten animated latency bars, one per build, coloured by typed question, with the row of the build that just answered lighting up. |
| `builds/tile-primitive-mix` | Primitive mix tile | How many of the answers were choices, flags or scores, as odometer counters with proportional glowing bars. |
| `builds/tile-where-it-runs` | Where it runs tile | Three rows of ten squares show how many builds run on the api, on a laptop and on a gpu box; the api squares ping on every decision. |
| `builds/tiles-all` | Dashboard tiles | The six live dashboard tiles together: decision stream, latency by build, cost this run, primitive mix, where it runs and what code owns. |
| `code/code-window` | jev-starter window | The whole jev-starter editor window: desk.py, a live hot-pink state.json, questions.py and a streaming zsh terminal with queue counters, handoff packets, ripples and pointer tilt. |
| `code/full-section` | code section | The complete code section: headline with the hermes > jev > code > queue flow strip, followed by the four-pane jev-starter window. |
| `code/pane-desk-py` | desk.py pane | A light editor pane that types out the python desk() gate with line numbers, a moving current-line band, minimap, scanner beam and status LEDs. |
| `code/pane-questions-py` | questions.py pane | A light editor pane showing the typed questions and the hard rules (floor, loss cap, max position, kill file) that plain code enforces, with a kill-switch line that turns red. |
| `code/pane-state-json` | state.json pane | A hot-pink editor pane that re-types the latest simulated decision as live JSON, underlining every value that changed. |
| `code/terminal` | jev terminal | A dark zsh terminal that streams every simulated decision (choice, size, risk flag, saved handoff) with matrix rain, CRT glow, a live/pause pill, a run button and scroll-back. |
| `desk/activity-log` | Activity log | Six-agent activity log with per-agent mute/solo filters, live/pause, full-message card and a data-rain backdrop. |
| `desk/agent-tabs` | Agent tabs | A strip of six agent tabs with orbs and live idle / working / done / halted state; click one to pin it. |
| `desk/bayes` | Bayesian update | Prior x book likelihood = posterior: three live gaussian densities re-centred on every decision, with a draggable prior and book mean. |
| `desk/candle-tape` | The tape (candles + book) | Live BTC-perp candlestick chart with VWAP and +/-1 sigma bands, volume, fired-ticket markers, a crosshair tooltip and a live depth ladder beside it. |
| `desk/drift-chart` | Drift vs noise | 140 random-walk equity curves with a small positive drift fanning out, a live end-value histogram and hover probes. |
| `desk/full-bottom` | Desk bottom row | Bayesian update, six-agent activity log and drift-vs-noise charts side by side, exactly as in the desk section. |
| `desk/full-top` | Desk top (ticker, P&L, tape) | The whole top of the desk: status ticker, SWARM P&L card and THE TAPE candlestick chart with order book, laid out like the page. |
| `desk/globe` | Dotted globe | A draggable 3D dotted globe with eight venue markers, data packets on great-circle arcs, aurora, rings and six agent orbs in orbit. |
| `desk/order-book` | Order book ladder | The live 10 x 10 depth ladder as a standalone canvas card: size bars with flashes and sparks, cumulative depth, spread row, imbalance meter and depth heat. |
| `desk/pnl-panel` | Swarm P&L panel | The SWARM P&L card: serif odometer balance with neon glow, balance-history line with a live head, win/loss strip, route/size bars and lifetime stats. |
| `desk/ticker` | Status ticker | The desk status ticker card: wordmark, 60 s handoff pulse, nav / session p&l / floor, UTC clock and a marquee of live chips (agents, edge, tickets, spend, kill switch). |
| `desk/ticket-in-flight` | Ticket in flight | The ticket being worked: side, symbol, notional, edge, size, price, confidence, a six-step rail, countdown and six agent rows that take turns. |
| `desk/venue-feeds` | Venue feeds | Global feeds: an oracle price tile with sparkline and eight simulated venue rows with price, latency, bps versus oracle and deviation heat. |
| `desk/world-card` | World card | Eight venues on a draggable dotted globe, global feeds, a ticket in flight and six agents in orbit — the full desk-world section. |
| `fx/background-shader` | Background shader | A WebGL plasma, aurora and god-ray background rendered in a worker, reacting to the pointer, kill switch, decisions and price ticks. |
| `fx/boot-overlay` | Boot overlay | A terminal-style boot sequence that types its checklist, fills a progress bar, then splits open like a shutter; replayable with a button. |
| `fx/cursor-ring` | Cursor ring and magnets | A custom ring-and-dot cursor that eases toward the pointer, grows over interactive elements and shrinks on press, plus magnetic buttons that drift toward the pointer. |
| `fx/full-section` | FX layer (full) | The whole fx module together: boot overlay, plasma background, grain, scanlines, cursor ring, scroll progress, split headings, toasts and the kill-switch theatre. |
| `fx/scroll-progress-and-headings` | Scroll progress and headings | A pink scroll-progress hairline with a tick per section, split-letter heading reveals with a one-shot light sweep, and staggered blur-in section reveals. |
| `fx/toasts` | Toasts | Glass toast pills with icon, countdown bar, hover-to-hold and tap or swipe to dismiss; info, ok and kill variants, max two stacked. |
| `hero/decision-network` | Jev decides network | A luminous neural-network diagram where every simulated decision flows from state through encode and Jev system one into typed questions, answers and code acts, with a live readout chip and title card. |
| `hero/full-section` | Hero full section | The complete JEV DECIDES hero section: decision network canvas, readout chip, legend and title card. |
| `hour/arithmetic-dial` | The arithmetic: capital dial | A draggable log gauge from 5% to 480% a year that shows the capital needed to earn $1.2M a year, with magnets, presets and a spring needle. |
| `hour/backtest-bars` | The backtest: 1,840 trades | Every backtest trade as a thin up/down bar with the running total above, a pulsing drawdown block and a scrubbable crosshair. |
| `hour/build-trio` | The build: three agents | Three mascot agents (pixel robot + two orbs) joined by dotted arcs with live decision packets, a candle replay with entries and stops, and the hard-rule chips. |
| `hour/full-section` | The hour: full section | The whole "three agents, sixty minutes, one bot" section: the build, the hour, the backtest, the arithmetic dial and the honest part together. |
| `hour/honest-bars` | The honest part: backtest vs reality | Two bars from one strategy, backtest versus what reaches you, with red leak ribbons falling into the venue bin. |
| `hour/hour-switches` | The hour: six switches | An amber 60:00 ring, six spring switches and a gantt rail that flip one after another until the ARMED banner fires with a particle burst. |
| `hour/mascots` | Mascots: pixel robot and orbs | The character kit: a pixel-art robot and two glass orbs with breathing, squash-and-stretch hops, orbiting sparks and a live answer chip. |
| `hud/full-section` | HUD section | The whole HUD as on the page: sticky bar with odometers, nav, shortcuts button and kill switch over a placeholder page. |
| `hud/hud-bar` | HUD bar | The sticky trading HUD: live decision, cost, median-latency and floor odometers, section nav, shortcuts button and the kill switch. |
| `hud/kill-switch` | Kill switch | The pill-shaped kill switch: one click halts every simulated order into human review and tints the whole page red, shown with a live execute / review / skip tally. |
| `hud/runtime-only` | Runtime tail | A blank stage that tails the live JEV state, simulated market and the recent decision stream as JSON, for testing the data bus. |
| `hud/shortcuts-dialog` | Shortcuts dialog | The keyboard-shortcuts dialog (? key or button): focus-trapped modal that lists every registered single-key shortcut, with a demo trigger. |
| `lab/decision-lab` | Decision lab | The whole interactive lab: nine state sliders, scenario presets, confidence floor and kill switch driving the live engine, replayed stage by stage through encode, typed questions, gate and code acts. |
| `lab/full-section` | Lab full section | The complete lab section as on the page: heading, state controls, decision tape and the four-stage animated pipeline. |
| `lab/gate-bar` | Confidence gate bar | A tiny reusable 0-1 confidence gate with a draggable floor marker, live confidence pin and pass / below-floor / halt verdict. |
| `lab/pipeline` | Decision pipeline | The four-stage decision pipeline (encode, typed questions, gate, code acts) with ribbons, comet and particle bursts, fed by a built-in demo state that cycles through scenarios. |
| `lab/queue-tree` | Queue tree and handoff | The code-acts queue: a typed handoff.json that types itself out and an execute / review / skip file tree where each new decision lands as a file. |
| `lab/state-controls` | State controls | A glass control card with nine input sliders, scenario presets, floor and kill switch that emits a simulated market state and shows it as live JSON. |
| `lab/typed-questions` | Typed questions | Jev's three typed questions side by side: which action (choice bars and confidence ring), how much (size columns) and risk ok (gauge with check chips). |
