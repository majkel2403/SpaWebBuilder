# Which components are the source of truth

185 visible components + 237 hidden helper units (shared heads/tails/markup chunks).

| kind | count | meaning |
|---|---|---|
| copy (extracted, focused) | 123 | a standalone, focused version of a part that is too entangled with its section to cut out; it does not feed the page and can drift (see `python3 jev/tools/fidelity.py`) |
| derived: real chunk of a section (feeds the page) | 54 | its folder holds the real code of that part of the section; edit here and both the main page and this component change |
| section (assembled from units, feeds the page) | 8 | the section itself; its html/css/js is the ordered concatenation of its units |

Hidden units (`_name`, `hidden: true`) are the glue chunks of a section (heads, tails, shared markup/css); they have no standalone page.

How it fits together: `jev/page.json` -> section components -> units (`components/UNITS.md`). Byte identity of the assembled page against the previous build was verified (`jev/tools/check-units.mjs`), and every derived component builds a standalone page.

| component | kind | title |
|---|---|---|
| `builds/action-chip` | copy | Action chip + dots |
| `builds/build-card` | copy | Build card |
| `builds/build-tooltip` | copy | Build tooltip card |
| `builds/circuit-traces` | derived | Circuit traces |
| `builds/confidence-sparkline` | copy | Confidence sparkline |
| `builds/core-card` | copy | JEV core card |
| `builds/core-halo` | copy | Core halo + conic sweep |
| `builds/decision-cards` | copy | Answer cards (enter, size, route, exit, flatten) |
| `builds/full-section` | section | Builds full section |
| `builds/hub` | derived | Builds hub |
| `builds/odometer` | derived | Odometer digits |
| `builds/primitive-cards` | copy | Typed-question cards |
| `builds/ribbons` | copy | Particle ribbons |
| `builds/rules-card` | copy | Thresholds + hard rules card |
| `builds/section-head-stats` | derived | Section header with live stats |
| `builds/segmented-squares` | copy | Segmented squares bar |
| `builds/tile-code-owns` | derived | What code owns tile |
| `builds/tile-cost` | derived | Cost this run tile |
| `builds/tile-decision-stream` | derived | Decision stream tile |
| `builds/tile-latency` | derived | Latency by build tile |
| `builds/tile-primitive-mix` | derived | Primitive mix tile |
| `builds/tile-where-it-runs` | derived | Where it runs tile |
| `builds/tiles-all` | derived | Dashboard tiles |
| `builds/value-bubble` | derived | Value-on-hover bubble |
| `code/code-window` | derived | jev-starter window |
| `code/copy-button` | copy | Copy button morph |
| `code/flow-strip` | copy | Flow strip: hermes > jev > code > queue |
| `code/full-section` | section | code section |
| `code/handoff-packets` | copy | Handoff packets into queue counters |
| `code/highlighter` | copy | Syntax highlighter |
| `code/hot-haze` | copy | Hot-pink pane with heat haze |
| `code/line-gutter` | copy | Line gutter and active-line band |
| `code/live-pill` | copy | Terminal live / pause pill |
| `code/matrix-rain` | copy | Matrix rain layer |
| `code/minimap` | copy | Code minimap |
| `code/pane-desk-py` | copy | desk.py pane |
| `code/pane-questions-py` | copy | questions.py pane |
| `code/pane-state-json` | copy | state.json pane |
| `code/phosphor-log` | copy | Phosphor afterglow log |
| `code/status-bar` | copy | Status bar with queue counters |
| `code/terminal` | copy | jev terminal |
| `code/token-link` | copy | Token hover-link |
| `code/typing-engine` | copy | Typing engine |
| `code/window-bar` | copy | Window title bar |
| `desk/activity-log` | derived | Activity log |
| `desk/activity-row` | copy | Activity log row |
| `desk/agent-badges` | copy | Agent badge kit |
| `desk/agent-chip-filter` | copy | Agent filter chips |
| `desk/agent-row` | copy | Agent rows |
| `desk/agent-tabs` | copy | Agent tabs |
| `desk/balance-line` | copy | Balance history chart |
| `desk/bayes` | derived | Bayesian update |
| `desk/candle-tape` | derived | The tape (candles + book) |
| `desk/candles-vwap` | copy | Candle chart (no book) |
| `desk/dotted-globe` | copy | Dotted globe only |
| `desk/drift-chart` | derived | Drift vs noise |
| `desk/end-histogram` | copy | End-value histogram |
| `desk/full-bottom` | derived | Desk bottom row |
| `desk/full-desk` | section | Desk (full section) |
| `desk/full-top` | section | Desk top (ticker, P&L, tape) |
| `desk/globe-arcs` | copy | Great-circle arcs |
| `desk/globe` | copy | Dotted globe |
| `desk/handoff-pulse` | derived | Handoff pulse |
| `desk/kv-strip` | copy | Desk KPI readouts |
| `desk/layer-chips` | copy | Layer chips |
| `desk/marquee-chips` | derived | Marquee chips |
| `desk/oracle-card` | copy | Oracle price card |
| `desk/orbit-orbs` | copy | Orbiting agent orbs |
| `desk/order-book` | copy | Order book ladder |
| `desk/p-profit-caption` | copy | P(profit) caption |
| `desk/p-up-readout` | copy | P(up) big readout |
| `desk/planet-shade` | copy | Planet shading |
| `desk/pnl-odometer` | copy | P&L odometer |
| `desk/pnl-panel` | derived | Swarm P&L panel |
| `desk/posterior-curve` | copy | Posterior density curve |
| `desk/posterior-history` | copy | Posterior sparkline history |
| `desk/precision-ring` | copy | Precision-weight ring |
| `desk/price-header` | copy | Live price header |
| `desk/proportion-bars` | copy | Proportion bars |
| `desk/random-walk-fan` | copy | Random-walk fan |
| `desk/star-field` | copy | Star field |
| `desk/stats-row` | copy | Lifetime stats row |
| `desk/three-curves` | copy | Prior x book = posterior curves |
| `desk/ticker` | derived | Status ticker |
| `desk/ticket-in-flight` | copy | Ticket in flight |
| `desk/ticket-rail` | copy | Ticket stage rail |
| `desk/utc-clock` | copy | UTC clock |
| `desk/venue-feeds` | copy | Venue feeds |
| `desk/venue-ping` | copy | Venue marker pings |
| `desk/venue-row` | copy | Venue feed rows |
| `desk/winloss-strip` | copy | Win/loss strip |
| `desk/world-card` | derived | World card |
| `fx/ambient-backdrop` | copy | Ambient backdrop |
| `fx/background-shader` | copy | Background shader |
| `fx/boot-log` | copy | Boot log terminal |
| `fx/boot-overlay` | copy | Boot overlay |
| `fx/camera-push` | copy | Camera push intro |
| `fx/cursor-ring` | copy | Cursor ring and magnets |
| `fx/cursor-spotlight` | copy | Cursor spotlight |
| `fx/full-section` | copy | FX layer (full) |
| `fx/glitch-rgb-split` | copy | Glitch RGB split |
| `fx/grain-overlay` | copy | Film grain overlay |
| `fx/light-sweep` | copy | Light sweep |
| `fx/nav-indicator` | copy | Nav glow indicator |
| `fx/scanlines-crt` | copy | CRT scanlines |
| `fx/scroll-progress-and-headings` | copy | Scroll progress and headings |
| `fx/shockwave-ring` | copy | Shockwave ring |
| `fx/toasts` | copy | Toasts |
| `hero/answers-panel` | copy | Typed answers panel |
| `hero/backdrop-fx` | derived | Hero backdrop effects |
| `hero/bloom-pass` | copy | Bloom pass |
| `hero/bokeh-dust` | copy | Bokeh dust layer |
| `hero/decision-chip` | derived | Latest decision chip |
| `hero/decision-network` | section | Jev decides network |
| `hero/depth-fog` | copy | Depth fog |
| `hero/encode-panel` | copy | Encode panel |
| `hero/floor-marker` | copy | Confidence floor marker |
| `hero/full-section` | section | Hero full section |
| `hero/impact-ripples` | copy | Impact ripples and flare |
| `hero/jev-mesh` | copy | Jev system one mesh |
| `hero/kill-crt-overlay` | copy | Kill switch CRT overlay |
| `hero/legend-strip` | derived | Destination legend |
| `hero/node-tooltip` | copy | Node tooltip |
| `hero/parallax-layers` | copy | Parallax layers |
| `hero/question-nodes` | copy | Typed question nodes |
| `hero/signal-trace` | copy | Signal trace |
| `hero/state-panel` | copy | State panel |
| `hero/title-card` | derived | JEV DECIDES title card |
| `hour/answer-chip` | copy | Last-answer chip |
| `hour/arithmetic-dial` | derived | The arithmetic: capital dial |
| `hour/armed-banner` | copy | ARMED banner with burst |
| `hour/backtest-bars` | derived | The backtest: 1,840 trades |
| `hour/build-trio` | derived | The build: three agents |
| `hour/candle-replay` | derived | Candle replay strip |
| `hour/energy-arc` | copy | Energy arc with comet packets |
| `hour/fig-panel` | copy | FIG panel shell |
| `hour/full-section` | section | The hour: full section |
| `hour/gantt-rail` | copy | Phase gantt rail |
| `hour/honest-bars` | derived | The honest part: backtest vs reality |
| `hour/hour-ring` | copy | 60:00 ring |
| `hour/hour-switches` | derived | The hour: six switches |
| `hour/mascots` | copy | Mascots: pixel robot and orbs |
| `hour/pixel-robot` | copy | Pixel robot (Hermes) |
| `hour/rules-chips` | derived | Hard-rule chips |
| `hour/stat-strip` | copy | Six-stat strip |
| `hour/switch-row` | copy | Switch row (spring toggle) |
| `hud/card-spotlight` | copy | Card spotlight border |
| `hud/chip-kit` | copy | Lamp, pill and chip kit |
| `hud/footer-marquee` | copy | Footer marquee |
| `hud/full-section` | copy | HUD section |
| `hud/glitch-wordmark` | copy | Glitch wordmark |
| `hud/hud-bar` | copy | HUD bar |
| `hud/kill-switch` | copy | Kill switch |
| `hud/logo-mark` | copy | Logo mark |
| `hud/metric-strip` | copy | Metric chip strip |
| `hud/metric-tooltip` | copy | Metric tooltip |
| `hud/nav-scrollspy` | copy | Nav with scrollspy |
| `hud/odometer` | copy | Odometer digit reels |
| `hud/orb-kit` | copy | Orb mascot kit |
| `hud/runtime-only` | copy | Runtime tail |
| `hud/section-tint` | copy | Section tint wash |
| `hud/shortcuts-dialog` | copy | Shortcuts dialog |
| `hud/tier-indicator` | copy | Quality tier indicator |
| `hud/toggle-kit` | copy | Toggle switch kit |
| `lab/action-bars` | derived | Action probability bars |
| `lab/decide-button` | derived | Decide button |
| `lab/decision-lab` | derived |  |
| `lab/decision-tape` | derived | Decision tape |
| `lab/dest-badge` | derived | Destination badge |
| `lab/encode-chips` | derived | Encode feature chips |
| `lab/full-section` | section | Lab full section |
| `lab/gate-bar` | derived | Confidence gate bar |
| `lab/handoff-json` | derived | Handoff JSON viewer |
| `lab/hard-rules` | derived | Hard rules |
| `lab/mini-verdict` | derived | Verdict strip |
| `lab/pipeline-status` | derived | Pipeline status pill |
| `lab/pipeline` | derived | Decision pipeline |
| `lab/queue-tree` | derived | Queue tree and handoff |
| `lab/range-slider` | derived | Glowing range slider |
| `lab/risk-dial` | derived | Risk meter dial |
| `lab/scenario-chips` | derived | Scenario chip row |
| `lab/size-columns` | derived | Size bucket columns |
| `lab/state-controls` | derived | State controls |
| `lab/switch-card` | derived | Switch cards |
| `lab/typed-questions` | derived | Typed questions |
