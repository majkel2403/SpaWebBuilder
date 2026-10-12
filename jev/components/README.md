# JEV components

Every section, chart, widget and effect of the JEV Desk as a standalone page: **184 components** (builds 24, code 20, desk 47, fx 16, hero 20, hour 18, hud 18, lab 21). Open `components/index.html` for the live gallery.

**Use one elsewhere:** copy its folder (`component.html`, `component.css`, `component.js`, `component.json`) plus the shared runtime `src/js/engine.js`, `src/js/core.js`, `src/css/base.css`, put the markup in a container and call `JEV.boot()` after loading the scripts. Each folder's own `README.md` lists the data it consumes (bus events `decision`, `tick`, `kill`, `floor`, `JEV.market`) and how to feed it real data.
**Rebuild pages:** `node jev/build-components.mjs` (all) or `--only group/name`. Each `index.html` is generated and fully self-contained.
Note: components are extracted copies of the main page's modules; the main page (`node jev/build.mjs`) is still built from `src/`. All data is simulated.

| component | title | description |
|---|---|---|
| `builds/action-chip` | Action chip + dots | The pill that shows the last action (buy, sell, hold, close, flatten) with an arrow glyph, three pulsing primitive dots and a one-line last-answer capsule, plus all five states side by side. |
| `builds/build-card` | Build card | A reusable build card with a typed-question tag, live answer, confidence sparkline against the floor line and a hover-tilt glass look, shown as a grid of four accent variants. |
| `builds/build-tooltip` | Build tooltip card | The glass tooltip card of a build: accent header with name and primitive, plus last answer, confidence, typed-answer latency and gate result; hover, focus or tap one of four build chips. |
| `builds/circuit-traces` | Circuit traces | A canvas of circuit traces: one trunk drops from a cap into a twin-hairline bus with a stub into the top of every card, with bits travelling the wires, a bright pulse per decision and a red switch under the kill switch. |
| `builds/confidence-sparkline` | Confidence sparkline | A 24-point SVG sparkline atom with a dashed floor line, soft area fill and a glowing head dot that turns amber under the floor, shown as four live variants. |
| `builds/core-card` | JEV core card | The glass JEV system-one card: a spinning pink rim, pulsing halo and rings, a holographic JEV wordmark that tilts with the pointer, a live action chip and last-answer line. |
| `builds/core-halo` | Core halo + conic sweep | The glow stack behind the JEV core: a breathing radial halo that swells with confidence, a slow conic-gradient sweep, two orbiting dashed rings and a flash on every answer, red under the kill switch. |
| `builds/decision-cards` | Answer cards (enter, size, route, exit, flatten) | Five answer cards that code acts on (enter, size, route, exit, flatten); the ones a decision actually uses light up, the route card shows the gate result. |
| `builds/full-section` | Builds full section | The whole "ten builds, one decision layer" section: head with live stats, the particle hub, the circuit traces and all six live dashboard tiles. |
| `builds/hub` | Builds hub | The full decision hub: a glass JEV core card fed by ten build cards through particle ribbons, then three typed questions, five answers and the hard-rules row, all live from the simulated decision stream. |
| `builds/odometer` | Odometer digits | A rolling-digit odometer atom (reel per digit, forward roll on 9 to 0, digit flash) shown as four variants: decisions count, running cost, median latency and a manual stepper. |
| `builds/primitive-cards` | Typed-question cards | The three primitive cards (which one? how much? yes or no?) with live answer, confidence below the floor in amber and a glowing confidence bar. |
| `builds/ribbons` | Particle ribbons | Glowing particle ribbon streams flowing between two boxes: additive particles with trails, comets and bursts that fire on each decision, boost on hover and freeze red under the kill switch. |
| `builds/rules-card` | Thresholds + hard rules card | The yellow "thresholds + hard rules" card: floor, daily loss cap, max position and kill switch held by code, the rule that blocked a decision flashes. |
| `builds/section-head-stats` | Section header with live stats | The builds section header: eyebrow, serif headline, lede and a glass stat strip with a decisions odometer, median latency, token count and a live lamp. |
| `builds/segmented-squares` | Segmented squares bar | A ten-square glowing segmented bar atom (n of 10) in four colours: a pinging live row, two static rows and one you can click or arrow-key. |
| `builds/tile-code-owns` | What code owns tile | Five bars for the things plain code holds (the menu, thresholds, orders, the stop, the log); the stop turns red under the kill switch. |
| `builds/tile-cost` | Cost this run tile | A serif odometer showing the simulated running cost of all typed answers, with decisions count, cost each and a zero-token line. |
| `builds/tile-decision-stream` | Decision stream tile | A live list of the newest decisions from every build with primitive tag, action, confidence and the gate result (execute, review or skip). |
| `builds/tile-latency` | Latency by build tile | Ten animated latency bars, one per build, coloured by typed question, with the row of the build that just answered lighting up. |
| `builds/tile-primitive-mix` | Primitive mix tile | How many of the answers were choices, flags or scores, as odometer counters with proportional glowing bars. |
| `builds/tile-where-it-runs` | Where it runs tile | Three rows of ten squares show how many builds run on the api, on a laptop and on a gpu box; the api squares ping on every decision. |
| `builds/tiles-all` | Dashboard tiles | The six live dashboard tiles together: decision stream, latency by build, cost this run, primitive mix, where it runs and what code owns. |
| `builds/value-bubble` | Value-on-hover bubble | A one-element hover bubble that follows the pointer (and taps on touch) over any element with a data-vt attribute and shows its live value, demoed on five action-share bars. |
| `code/code-window` | jev-starter window | The whole jev-starter editor window: desk.py, a live hot-pink state.json, questions.py and a streaming zsh terminal with queue counters, handoff packets, ripples and pointer tilt. |
| `code/copy-button` | Copy button morph | A copy button whose clipboard glyph morphs into an animated check mark, shown in a light, a hot-pink and a dark header, with the copied text and a status line. |
| `code/flow-strip` | Flow strip: hermes > jev > code > queue | A four-node pipeline strip (hermes intent, jev ask(), code gate(), queue/ destination) joined by dashed wires with travelling light; nodes light up in sequence for each decision and the last one takes the destination colour. |
| `code/full-section` | code section | The complete code section: headline with the hermes > jev > code > queue flow strip, followed by the four-pane jev-starter window. |
| `code/handoff-packets` | Handoff packets into queue counters | Every "Saved handoff" line fires a comet burst of additive glow sprites that arcs into its queue/ counter (execute pink, review amber, skip grey), which bumps and flares on arrival. |
| `code/highlighter` | Syntax highlighter | The tiny regex highlighter behind the editor panes: edit python or json in a textarea and see it coloured live in a dark, light or hot-pink skin. |
| `code/hot-haze` | Hot-pink pane with heat haze | A CSS-only hot-pink code pane: a diagonal sheen sweeping across, warm haze plumes rising through the text over a heat floor, and a shift to orange-red under the kill switch. |
| `code/line-gutter` | Line gutter and active-line band | A line-number gutter with a glowing active number and a spring-eased current-line band that hops to the lines a decision touches; click a line or use the arrow keys to move it. |
| `code/live-pill` | Terminal live / pause pill | The sticky LIVE pill of the terminal: it freezes the stream when you hover the log or pin it, counts the decisions held back as "+N new", and resumes on click, Enter or Escape. |
| `code/matrix-rain` | Matrix rain layer | A canvas layer of falling hex and symbol glyphs with fading trails (pre-rendered glyph atlas, 20 Hz fade) that speeds up on every decision and turns red under the kill switch. |
| `code/minimap` | Code minimap | A scrolling code view with a canvas minimap of coloured line stubs, a draggable viewport window and a cursor tick that jumps to the gate lines on every decision. |
| `code/pane-desk-py` | desk.py pane | A light editor pane that types out the python desk() gate with line numbers, a moving current-line band, minimap, scanner beam and status LEDs. |
| `code/pane-questions-py` | questions.py pane | A light editor pane showing the typed questions and the hard rules (floor, loss cap, max position, kill file) that plain code enforces, with a kill-switch line that turns red. |
| `code/pane-state-json` | state.json pane | A hot-pink editor pane that re-types the latest simulated decision as live JSON, underlining every value that changed. |
| `code/phosphor-log` | Phosphor afterglow log | A dark zsh log where each new line lands with a hot phosphor afterglow that cools to normal, under a CRT vignette, scanlines and a slow rolling band. |
| `code/status-bar` | Status bar with queue counters | The hot-pink editor status bar: a build lamp and status text, floor and kill-switch readout, and live queue/ execute, review and skip counters with a proportional bar. |
| `code/terminal` | jev terminal | A dark zsh terminal that streams every simulated decision (choice, size, risk flag, saved handoff) with matrix rain, CRT glow, a live/pause pill, a run button and scroll-back. |
| `code/token-link` | Token hover-link | Hover or tap an identifier (FLOOR, conf, "execute", risk_ok) in one snippet and every other use lights up across both panes, with a live "N refs in M panes" readout. |
| `code/typing-engine` | Typing engine | A code pane that types itself token by token with a caret that follows the text, a speed control and replay, and appends a typed line for every simulated decision. |
| `code/window-bar` | Window title bar | The editor window title bar: traffic-light dots, file tabs that glow as a decision hops across them, a travelling hairline and a 16-bar audio glyph that jumps on every decision. |
| `desk/activity-log` | Activity log | Six-agent activity log with per-agent mute/solo filters, live/pause, full-message card and a data-rain backdrop. |
| `desk/activity-row` | Activity log row | One activity-log row (dot, agent tag, verb, value, message) shown as a live row that animates in on every step plus four static variants: gain, loss, JEV choice and kill switch. |
| `desk/agent-badges` | Agent badge kit | The agent badge atoms in the six agent colours: glowing dot, row tag, filter chip and pill, plus the JEV and kill-switch variants; the badge of the agent that just acted flashes. |
| `desk/agent-chip-filter` | Agent filter chips | A row of six agent chips with live step counters; click mutes an agent, double-click solos it, and the filter is broadcast on the bus. |
| `desk/agent-row` | Agent rows | Six agent rows with orb, role and a live value chip; each row lights up and fills a progress bar when its step runs on a decision, click to pin one. |
| `desk/agent-tabs` | Agent tabs | A strip of six agent tabs with orbs and live idle / working / done / halted state; click one to pin it. |
| `desk/balance-line` | Balance history chart | A live balance-history area chart split at the session open (green above, red below) with a glowing head, dashed open line and hover or touch scrub tooltip. |
| `desk/bayes` | Bayesian update | Prior x book likelihood = posterior: three live gaussian densities re-centred on every decision, with a draggable prior and book mean. |
| `desk/candle-tape` | The tape (candles + book) | Live BTC-perp candlestick chart with VWAP and +/-1 sigma bands, volume, fired-ticket markers, a crosshair tooltip and a live depth ladder beside it. |
| `desk/candles-vwap` | Candle chart (no book) | A live BTC-perp candlestick canvas on its own: VWAP line with +/-1 sigma band, volume bars, fired-ticket markers, last-price tag and a crosshair OHLC tooltip. |
| `desk/dotted-globe` | Dotted globe only | Just the dotted planet: 4,000 hand-projected points forming noise continents with a shelf and sparse ocean, graticule, night-side city lights, drag to spin with inertia; no orbs, arcs or markers. |
| `desk/drift-chart` | Drift vs noise | 140 random-walk equity curves with a small positive drift fanning out, a live end-value histogram and hover probes. |
| `desk/end-histogram` | End-value histogram | A live histogram of where 140 simulated paths stand, bars coloured loss to profit from pink to amber, with a mean tag, a zero line and a pointer probe that reads the share above a level. |
| `desk/full-bottom` | Desk bottom row | Bayesian update, six-agent activity log and drift-vs-noise charts side by side, exactly as in the desk section. |
| `desk/full-top` | Desk top (ticker, P&L, tape) | The whole top of the desk: status ticker, SWARM P&L card and THE TAPE candlestick chart with order book, laid out like the page. |
| `desk/globe-arcs` | Great-circle arcs | A graticule sphere with eight venue markers that ping, great-circle arcs lifted above the surface and glowing data packets that fly along them; every decision launches a pink packet. |
| `desk/globe` | Dotted globe | A draggable 3D dotted globe with eight venue markers, data packets on great-circle arcs, aurora, rings and six agent orbs in orbit. |
| `desk/handoff-pulse` | Handoff pulse | A 60-second heartbeat of decisions as thin bars scrolling left: green executed, amber to review, grey skipped, height by confidence. |
| `desk/kv-strip` | Desk KPI readouts | A row of tiny letter-spaced KPI readouts (desk NAV, session P&L, confidence floor, kill state) in tabular mono that follow the simulated book live. |
| `desk/layer-chips` | Layer chips | Pill chip atoms: static status chips, toggle chips with a glowing dot and aria-pressed state, and the whole accent palette, with a live readout of which layers are on. |
| `desk/marquee-chips` | Marquee chips | An endless scrolling strip of live status chips (agents, holder, handoffs per minute, fair vs market, edge, tickets, spend, last ticket, floor, kill switch) with edge fade, hover pause and a travelling light. |
| `desk/oracle-card` | Oracle price card | The blue oracle tile: serif price with a decimal, change pill and a live glowing sparkline of the simulated mid price. |
| `desk/orbit-orbs` | Orbiting agent orbs | Six agent orbs circling a central white Jev orb on a tilted dashed ellipse, scaling and fading with depth; the orb whose step runs on a decision lights up with a halo. |
| `desk/order-book` | Order book ladder | The live 10 x 10 depth ladder as a standalone canvas card: size bars with flashes and sparks, cumulative depth, spread row, imbalance meter and depth heat. |
| `desk/p-profit-caption` | P(profit) caption | The big amber P(profit) odometer of the drift card with drift and noise per step, the trade count, a loss-to-profit colour key and a pooled result over runs. |
| `desk/p-up-readout` | P(up) big readout | The big serif P(up 5m) odometer that turns red below 50 percent, with live deltas versus a coin flip and versus the prior and an updates counter. |
| `desk/planet-shade` | Planet shading | A dark glass sphere with layered atmosphere glow, fresnel limb, a nested day-night terminator and a warm sun bloom that drifts; turns red under the kill switch. |
| `desk/pnl-odometer` | P&L odometer | A big serif balance whose digits roll like an odometer with neon glow, a +/- pill vs the session open and floating P&L pops on each executed ticket. |
| `desk/pnl-panel` | Swarm P&L panel | The SWARM P&L card: serif odometer balance with neon glow, balance-history line with a live head, win/loss strip, route/size bars and lifetime stats. |
| `desk/posterior-curve` | Posterior density curve | A single glowing posterior density for P(up 5m) that re-centres on every decision, with ember particles, a travelling highlight and a pointer probe that lights the upper tail. |
| `desk/posterior-history` | Posterior sparkline history | A 30 second sparkline of the posterior P(up) with a dotted 50 percent line, a glowing live head and min, max and now readouts; red under the kill switch. |
| `desk/precision-ring` | Precision-weight ring | A conic-gradient donut ring that splits amber (prior) and blue (book) by a weight, animated through a registered CSS property, shown live plus a row of static variants. |
| `desk/price-header` | Live price header | The tape header readout: a big tabular BTC-perp price with a small decimal, an up/down percent pill, and hi / lo / volume figures that update on every tick. |
| `desk/proportion-bars` | Proportion bars | Three stacked proportion bars with glowing segments and tabular readouts: result up vs down, route go / review / skip and size .5 / 1 / 2 / 4 percent, animating as decisions arrive. |
| `desk/random-walk-fan` | Random-walk fan | One hundred and forty random-walk equity curves with a small positive drift fanning out coloured by where they end, with a bright sample-mean spine, a dotted two-sigma noise cone and a hover trace. |
| `desk/star-field` | Star field | A twinkling canvas star field with depth parallax that follows the pointer, cross flares on the brightest stars and a shooting star on every decision. |
| `desk/stats-row` | Lifetime stats row | A four-cell stats row (tickets, win rate with a conic ring, average edge, max drawdown) with tabular mono values that flash when they change. |
| `desk/three-curves` | Prior x book = posterior curves | Three tagged density curves (amber prior, blue book likelihood, green posterior) with gliding mean tags that never collide, a peak ripple on every decision and a three-item legend. |
| `desk/ticker` | Status ticker | The desk status ticker card: wordmark, 60 s handoff pulse, nav / session p&l / floor, UTC clock and a marquee of live chips (agents, edge, tickets, spend, kill switch). |
| `desk/ticket-in-flight` | Ticket in flight | The ticket being worked: side, symbol, notional, edge, size, price, confidence, a six-step rail, countdown and six agent rows that take turns. |
| `desk/ticket-rail` | Ticket stage rail | A six-stage rail (scan, research, price, size, fill, close) with ignition dots, a gradient fill, a glowing marker and the agent now working, advancing on every decision. |
| `desk/utc-clock` | UTC clock | A glowing mono UTC clock with a utc label and simulated pill, shown in a large and a compact variant with date and session uptime. |
| `desk/venue-feeds` | Venue feeds | Global feeds: an oracle price tile with sparkline and eight simulated venue rows with price, latency, bps versus oracle and deviation heat. |
| `desk/venue-ping` | Venue marker pings | CSS-only venue markers: a glowing dot with two staggered expanding ping rings, a city code and a latency tag, in eight venue colours on a faint dot grid. |
| `desk/venue-row` | Venue feed rows | Single venue feed rows with a price that rolls on every tick, 12 spark bars, latency, bps versus the oracle and a deviation heat glow. |
| `desk/winloss-strip` | Win/loss strip | The last 200 executed tickets as glowing up/down bars around a centre line, with the newest bar flashing and a live win/loss readout. |
| `desk/world-card` | World card | Eight venues on a draggable dotted globe, global feeds, a ticket in flight and six agents in orbit — the full desk-world section. |
| `fx/ambient-backdrop` | Ambient backdrop | The layered violet, magenta and indigo gradient wash with a dark vignette that flips to red under the kill switch. |
| `fx/background-shader` | Background shader | A WebGL plasma, aurora and god-ray background rendered in a worker, reacting to the pointer, kill switch, decisions and price ticks. |
| `fx/boot-log` | Boot log terminal | An inline terminal card that types five check lines with scrambling glyphs, resolves each with a green status and fills a tick-by-tick progress bar. |
| `fx/boot-overlay` | Boot overlay | A terminal-style boot sequence that types its checklist, fills a progress bar, then splits open like a shutter; replayable with a button. |
| `fx/camera-push` | Camera push intro | A one-shot zoom-blur streak burst with a chromatic text split that settles, as when the boot overlay lifts. |
| `fx/cursor-ring` | Cursor ring and magnets | A custom ring-and-dot cursor that eases toward the pointer, grows over interactive elements and shrinks on press, plus magnetic buttons that drift toward the pointer. |
| `fx/cursor-spotlight` | Cursor spotlight | A soft pink light disc that eases after the pointer inside a panel, turning red under the kill switch. |
| `fx/full-section` | FX layer (full) | The whole fx module together: boot overlay, plasma background, grain, scanlines, cursor ring, scroll progress, split headings, toasts and the kill-switch theatre. |
| `fx/glitch-rgb-split` | Glitch RGB split | A 350 ms glitch burst: red/cyan RGB text split, sliced scanline bands, a red vignette flash and section jitter, fired by the kill switch. |
| `fx/grain-overlay` | Film grain overlay | A sparse hopping film-grain layer from an inline SVG turbulence tile, shown at four strengths over glass tiles. |
| `fx/light-sweep` | Light sweep | A skewed highlight band that sweeps once across a heading or any box, on view, on hover or on demand. |
| `fx/nav-indicator` | Nav glow indicator | A sliding pink underline with glow that follows the active item of a nav strip, with the active label lit. |
| `fx/scanlines-crt` | CRT scanlines | Fine CRT scanlines with a slow rolling light band that turns red when the kill switch is thrown. |
| `fx/scroll-progress-and-headings` | Scroll progress and headings | A pink scroll-progress hairline with a tick per section, split-letter heading reveals with a one-shot light sweep, and staggered blur-in section reveals. |
| `fx/shockwave-ring` | Shockwave ring | An expanding radial shockwave ring fired from any point: red on a kill, green on re-arm, with a trailing second wave. |
| `fx/toasts` | Toasts | Glass toast pills with icon, countdown bar, hover-to-hold and tap or swipe to dismiss; info, ok and kill variants, max two stacked. |
| `hero/answers-panel` | Typed answers panel | The right half of the hero diagram: three typed questions, eleven probability answers with the 0.85 floor and a confidence tick, and the code acts (execute, review, skip) with odometer counters, fed live by decisions. |
| `hero/backdrop-fx` | Hero backdrop effects | A CSS-only hero backdrop: spinning conic aura, dot grid, scanning bar, vignette and a glowing hot-pink rule. |
| `hero/bloom-pass` | Bloom pass | The hero's additive bloom composite: the live canvas is downsampled to 1/3 and 1/9 copies and added back over itself, over animated beams, with an on/off toggle and the two buffers shown. |
| `hero/bokeh-dust` | Bokeh dust layer | A drifting canvas layer of soft pink, violet and amber bokeh sprites with depth parallax that follows the pointer. |
| `hero/decision-chip` | Latest decision chip | A glass readout chip that shows the newest simulated decision (symbol, action, confidence, size, risk, destination badge, latency) with odometer digit rolls. |
| `hero/decision-network` | Jev decides network | A luminous neural-network diagram where every simulated decision flows from state through encode and Jev system one into typed questions, answers and code acts, with a live readout chip and title card. |
| `hero/depth-fog` | Depth fog | The hero's depth-of-field darkening: one pre-rendered fog ramp whose clear centre follows the layer the active wave is in, over a full layered mesh, with a fog on/off toggle. |
| `hero/encode-panel` | Encode panel | The narrow ENCODE column that folds the fifteen state ports into twelve zig-zag vector nodes, with pink beams running through on every decision. |
| `hero/floor-marker` | Confidence floor marker | The 0.85 confidence floor as a spring-loaded marker on a probability track with a live confidence tick and floor step buttons. |
| `hero/full-section` | Hero full section | The complete JEV DECIDES hero section: decision network canvas, readout chip, legend and title card. |
| `hero/impact-ripples` | Impact ripples and flare | Three destination ports (execute, review, skip) that throw expanding ripple rings and a lens-flare streak whenever a decision lands there. |
| `hero/jev-mesh` | Jev system one mesh | The glowing JEV SYSTEM ONE panel: three layers of dense additive mesh woven with a bright cable, with white-hot beams hopping layer to layer on each decision. |
| `hero/kill-crt-overlay` | Kill switch CRT overlay | The hero's kill-switch look: red flash and flicker, beam stutter, CRT scanlines and the power-down and power-up collapse of the plane when the kill switch is toggled. |
| `hero/legend-strip` | Destination legend | The execute, review and skip legend dots with live tallies and a pulsing idle hint to fire a decision. |
| `hero/node-tooltip` | Node tooltip | The hero's hover and tap tooltip on nodes and state rows: field name, current value, a 20-point sparkline and which question the field drives most with its salience, over a live mesh fed by decisions. |
| `hero/parallax-layers` | Parallax layers | The hero's pointer and scroll parallax: grid, aura, network plane, floating labels and glass cards move at different depths, translate-only, with a scroll slider and live offsets. |
| `hero/question-nodes` | Typed question nodes | The three typed-question nodes (choice, score, flag) with ring pulses and the live answer written beside each. |
| `hero/signal-trace` | Signal trace | The glowing polyline that traces the latest decision through the real graph edges (strongest field to encode, jev layers, three questions, chosen answers, code act) and fades over 2 seconds. |
| `hero/state-panel` | State panel | The STATE input column: fifteen ports with live values and 20-decision sparklines, lighting up whichever field changed. |
| `hero/title-card` | JEV DECIDES title card | The glass JEV DECIDES title card with a hot-pink spine, spinning conic border, pointer-following holographic sheen and a letter-by-letter neon ignition you can replay. |
| `hour/answer-chip` | Last-answer chip | The small live pill that shows the last typed answer (action, symbol, confidence and gate result) with execute, review and skip colours and a pulse on every decision. |
| `hour/arithmetic-dial` | The arithmetic: capital dial | A draggable log gauge from 5% to 480% a year that shows the capital needed to earn $1.2M a year, with magnets, presets and a spring needle. |
| `hour/armed-banner` | ARMED banner with burst | The six-cell progress banner that waits on six switches, then flips to a glowing ARMED slab with a white flash, shine sweep, confetti burst and shockwave ring; HALTED under the kill switch. |
| `hour/backtest-bars` | The backtest: 1,840 trades | Every backtest trade as a thin up/down bar with the running total above, a pulsing drawdown block and a scrubbable crosshair. |
| `hour/build-trio` | The build: three agents | Three mascot agents (pixel robot + two orbs) joined by dotted arcs with live decision packets, a candle replay with entries and stops, and the hard-rule chips. |
| `hour/candle-replay` | Candle replay strip | A seeded endless candlestick strip with green buy arrows, dashed red stops and exit markers scrolling under a glowing playhead; it slows when the kill switch is thrown. |
| `hour/energy-arc` | Energy arc with comet packets | A dotted glowing arc between two orb mascots with ambient light beads, and a comet packet that rides it for every simulated decision, bursts on arrival and flashes the receiving orb. |
| `hour/fig-panel` | FIG panel shell | The glass figure-panel shell used by every hour card: accent edge, tag, subtitle, badge, headline, note chips, dashed footer and the giant FIG.n watermark, in four accents. |
| `hour/full-section` | The hour: full section | The whole "three agents, sixty minutes, one bot" section: the build, the hour, the backtest, the arithmetic dial and the honest part together. |
| `hour/gantt-rail` | Phase gantt rail | Six colour-coded phase bars on a sixty-minute rail with a glowing playhead and a lit axis, replaying the six phases of the hour in a loop. |
| `hour/honest-bars` | The honest part: backtest vs reality | Two bars from one strategy, backtest versus what reaches you, with red leak ribbons falling into the venue bin. |
| `hour/hour-ring` | 60:00 ring | The amber sixty-tick ring with a glowing head and a serif 60:00 clock that fills over twelve seconds, colours every tick by phase and flashes when the hour is up. |
| `hour/hour-switches` | The hour: six switches | An amber 60:00 ring, six spring switches and a gantt rail that flip one after another until the ARMED banner fires with a particle burst. |
| `hour/mascots` | Mascots: pixel robot and orbs | The character kit: a pixel-art robot and two glass orbs with breathing, squash-and-stretch hops, orbiting sparks and a live answer chip. |
| `hour/pixel-robot` | Pixel robot (Hermes) | The pixel-art Hermes robot on its own: glass ring, blinking eyes, blinking antenna, scan line, squash-and-stretch hop on tap, in four sizes and a halted variant. |
| `hour/rules-chips` | Hard-rule chips | A row of hard-rule chips held by code: daily loss cap, max position, confidence floor and a live kill-switch chip that mirrors and toggles the global kill switch. |
| `hour/stat-strip` | Six-stat strip | A strip of six serif count-up stats that settle with a glow: four illustrative backtest numbers plus two live counters fed by the decision stream; tap to replay. |
| `hour/switch-row` | Switch row (spring toggle) | The spring toggle row used by the hour: label, minute range, glowing knob with squash press, ripple, on/off word and progress bar, in four variants including a live kill-switch row. |
| `hud/card-spotlight` | Card spotlight border | Glass cards whose border and surface are lit by a pointer-following radial spotlight (idle drift on touch screens), each showing the latest live decision for its destination. |
| `hud/chip-kit` | Lamp, pill and chip kit | Status atoms: pulsing lamps, outlined pills, accent-coloured chips and a live counter chip row, with a state pill that follows the kill switch. |
| `hud/footer-marquee` | Footer marquee | A seamless looping status ticker of hard rules (floor, loss cap, kill switch) that stays in sync with the live floor and kill state, plus a live tape of the latest decisions. |
| `hud/full-section` | HUD section | The whole HUD as on the page: sticky bar with odometers, nav, shortcuts button and kill switch over a placeholder page. |
| `hud/glitch-wordmark` | Glitch wordmark | A CSS-only chromatic glitch wordmark: cyan and pink slices flicker across the text every few seconds, with a manual burst and a burst on every kill-switch toggle. |
| `hud/hud-bar` | HUD bar | The sticky trading HUD: live decision, cost, median-latency and floor odometers, section nav, shortcuts button and the kill switch. |
| `hud/kill-switch` | Kill switch | The pill-shaped kill switch: one click halts every simulated order into human review and tints the whole page red, shown with a live execute / review / skip tally. |
| `hud/logo-mark` | Logo mark | The JEV logo mark: a pink gradient J tile with glow, in four sizes with and without wordmark, that pulses on every decision and turns red when halted. |
| `hud/metric-strip` | Metric chip strip | The HUD metric chips on their own: model, agent, decisions and cost odometers, live median latency and a confidence-floor chip with plus/minus steppers. |
| `hud/metric-tooltip` | Metric tooltip | One shared fixed tooltip for any [data-tip] element: opens on hover or keyboard focus, flips above near the viewport bottom, auto-hides on touch, scroll and Escape. |
| `hud/nav-scrollspy` | Nav with scrollspy | A sticky section nav whose active link follows the scroll position with a sliding underline, numbered links, and smooth anchor jumps. |
| `hud/odometer` | Odometer digit reels | Mechanical digit-reel counters: each digit is a 0-9 reel that rolls with a small overshoot, fed live by decisions, cost and price. |
| `hud/orb-kit` | Orb mascot kit | The glass Jev orb in nine colours and any size, with blinking eyes that follow the pointer (or wander when idle) and widen when a decision for that colour lands. |
| `hud/runtime-only` | Runtime tail | A blank stage that tails the live JEV state, simulated market and the recent decision stream as JSON, for testing the data bus. |
| `hud/section-tint` | Section tint wash | The page colour temperature: a fixed two-corner radial wash that eases to a new colour as each section crosses the viewport middle, with a live readout of the tint value. |
| `hud/shortcuts-dialog` | Shortcuts dialog | The keyboard-shortcuts dialog (? key or button): focus-trapped modal that lists every registered single-key shortcut, with a demo trigger. |
| `hud/tier-indicator` | Quality tier indicator | A three-bar quality-tier gauge showing the auto-detected performance tier (1 low, 2 medium, 3 high), with buttons to pin a tier and a live card/glitch preview of what each tier changes. |
| `hud/toggle-kit` | Toggle switch kit | The glowing .tg toggle switch in every accent colour, keyboard and touch accessible, with two live switches bound to the kill switch and the confidence floor. |
| `lab/action-bars` | Action probability bars | Jev's "which action?" choice question: five probability bars (buy, sell, hold, close, flatten) with the winner glowing, plus a confidence ring and the picked action. |
| `lab/decide-button` | Decide button | The magnetic hot-pink DECIDE button with sweeping light, pointer-follow glow, click ripple, Enter-key shortcut and a pulsing dirty state, wired to fire a simulated decision. |
| `lab/decision-lab` | Decision lab | The whole interactive lab: nine state sliders, scenario presets, confidence floor and kill switch driving the live engine, replayed stage by stage through encode, typed questions, gate and code acts. |
| `lab/decision-tape` | Decision tape | A five-row tape of the latest decisions (id, action, size, confidence, destination dot, reason) where new rows slide in with a pink flash, rows are clickable and a button copies the tape as JSON. |
| `lab/dest-badge` | Destination badge | The big EXECUTE / REVIEW / SKIP verdict badge that scrambles in with a 3D flip, a ring pulse, a particle burst on execute, a shimmer, a shake on kill and a live tally of all three routes. |
| `lab/encode-chips` | Encode feature chips | Ten feature chips (nine state inputs plus net edge) each with a value and a centred or left-anchored glowing bar; risky values turn red and every decision pops the chips in. |
| `lab/full-section` | Lab full section | The complete lab section as on the page: heading, state controls, decision tape and the four-stage animated pipeline. |
| `lab/gate-bar` | Confidence gate bar | A tiny reusable 0-1 confidence gate with a draggable floor marker, live confidence pin and pass / below-floor / halt verdict. |
| `lab/handoff-json` | Handoff JSON viewer | A mini editor window that types out the typed handoff from Jev to code (action, size, venue, conf, risk_ok, reason, dest) as syntax-coloured JSON on every decision, with a copy-json button. |
| `lab/hard-rules` | Hard rules | The rules held by code, not the model: a draggable confidence-floor slider, the kill switch and the loss-cap and max-position chips, with a live line showing what the gate does to the latest decision. |
| `lab/mini-verdict` | Verdict strip | A one-line glass verdict pill (action, size, confidence and a coloured execute / review / skip tag) that follows the live decision stream and tints its border to the route. |
| `lab/pipeline-status` | Pipeline status pill | The pipeline header: a status pill with a pulsing lamp that walks encode, typed questions, the gate and code acts while a four-colour progress hairline fills, replayed on every decision. |
| `lab/pipeline` | Decision pipeline | The four-stage decision pipeline (encode, typed questions, gate, code acts) with ribbons, comet and particle bursts, fed by a built-in demo state that cycles through scenarios. |
| `lab/queue-tree` | Queue tree and handoff | The code-acts queue: a typed handoff.json that types itself out and an execute / review / skip file tree where each new decision lands as a file. |
| `lab/range-slider` | Glowing range slider | A single neon range slider with value bubble, glowing trail, tick sparks, zero mark and a red risk band, shown in five accents with one row that follows the live net edge. |
| `lab/risk-dial` | Risk meter dial | The "risk ok?" flag question: a half-circle gradient gauge with a spring needle, a serif YES or NO and seven reason chips (spread, latency, age, loss, drawdown, vol, kill) that turn red when tripped. |
| `lab/scenario-chips` | Scenario chip row | A wrapping row of icon preset chips (trend, mean-revert, wide book, stale feed, reversal, stress, random) that runs the engine on the picked scenario and prints its verdict. |
| `lab/size-columns` | Size bucket columns | Jev's "how much?" score question: four columns for 0.5%, 1%, 2% and 4% of capital that spring to their probability, with the chosen bucket lit pink. |
| `lab/state-controls` | State controls | A glass control card with nine input sliders, scenario presets, floor and kill switch that emits a simulated market state and shows it as live JSON. |
| `lab/switch-card` | Switch cards | Glass switch cards with a glowing toggle and a two-line label (auto, kill switch bound to the runtime, dry run, a disabled one), each with its own accent and on/off caption. |
| `lab/typed-questions` | Typed questions | Jev's three typed questions side by side: which action (choice bars and confidence ring), how much (size columns) and risk ok (gauge with check chips). |

## Verification (2026-10-12)
All 184 pages were built, loaded in headless Chromium at 1100x650 (desktop) and 390x700 (touch phone), screenshotted and reviewed on contact sheets: each renders its own content with live simulated data, no empty scene, no console errors, no horizontal overflow (see `node build-components.mjs` + the audit used during development).

## Known limits (by design)
- Components are extracted copies; the main page is still built from `src/`.
- `hero/*` pieces are compact re-implementations of the diagram parts; the full-page extras (node hover tooltip, depth fog, bloom, parallax, CRT kill overlay, signal trace) are also available as their own components (`hero/node-tooltip`, `depth-fog`, `bloom-pass`, `parallax-layers`, `kill-crt-overlay`, `signal-trace`).
- Pieces that only make sense inside the full page chrome (HUD metrics, section tint) are demoed with small stand-in layouts.

## Fidelity check (page vs component)
Side-by-side captures of the main page and the standalone component were compared for: `desk/candle-tape`, `hour/arithmetic-dial`, `hour/honest-bars`, `builds/tile-latency` (identical layout, copy, colours and live behaviour; values differ only by simulation noise). The six hero effect components (`node-tooltip`, `depth-fog`, `bloom-pass`, `parallax-layers`, `kill-crt-overlay`, `signal-trace`) were reviewed at desktop and 390px. All 184 pages were reviewed on contact sheets at both sizes.
