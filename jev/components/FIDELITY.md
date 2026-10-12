# Component fidelity report

Automated comparison of every component with the main page source (src/). Columns: **css rules** = share of the component's CSS rules (selector + declarations) found identically in src/css; **css sel** = share whose selector exists in src/css; **js idents** = share of the component's JS identifiers (7+ chars) that exist in src/js; **text** = share of visible words that exist in src/html or src/js.

Reading: high js/text = the logic and copy come from the page. Low css rules/sel = the component uses its own class names or demo scaffolding (hero/*, fx/*, hud/* demos); visual parity for those was checked by eye on desktop and 390px contact sheets, and side by side with the page for candle-tape, arithmetic-dial, honest-bars and tile-latency. This report is not a pixel diff.

## Visual comparison with the main page (all 184)

Each component was paired with the element of `jev/dist/jev.html` it was extracted from, both were captured in headless Chromium (1280x900, same warm-up), and compared by normalised Sobel edge-map correlation, hue/saturation histogram intersection and size, plus a side-by-side read of the pair. **Live simulated values, typing animations and the page's global overlays (scanlines, HUD) differ between the two captures, so edge correlation understates fidelity for live components; the verdicts rest mainly on the side-by-side read and the CSS-rule diff above.** Components with no page counterpart are demo kits or atoms built for reuse.

| verdict | before fixes | after fixes |
|---|---|---|
| identical | 61 | 79 |
| close | 94 | 91 |
| divergent | 15 | 0 |
| no-counterpart | 14 | 14 |

Fixed in this pass (divergent -> close/identical): flow-strip, matrix-rain, minimap, action-chip, section-head-stats, six builds tiles, hour-ring, hud-bar, hud/full-section and others listed in the table notes.

| component | page counterpart | edge corr | hue | before | after | note |
|---|---|---|---|---|---|---|
| builds/action-chip | .bld-core-body .bld-pd | 0.56 | 0.41 | close | identical | chip override removed; size now 104x21 = page |
| builds/build-card | #bld-colL .bld-card | 0.58 | 0.93 | close | close | same look; width 237 vs 263 from demo grid; live values |
| builds/build-tooltip | #bld-tip (hover) | 0.77 | 0.76 | identical | identical | same size 196x160 |
| builds/circuit-traces | .bld-tr canvas | 0.13 | 0.42 | close | close | trace style same; demo adds cap and node cards; not changed |
| builds/confidence-sparkline | .bld-sp in build card | 0.04 | 0.84 | close | close | intentionally enlarged 454x39 vs page 169x12; not changed |
| builds/core-card | #bld-core-box | 0.78 | 0.87 | identical | identical | 330x212 both |
| builds/core-halo | #bld-core | 0.05 | 0.64 | close | close | halo shown without card, 760x421 demo vs 330x212; same glow stack |
| builds/decision-cards | #bld-decs | 0.95 | 0.67 | identical | identical | 1060 wide both |
| builds/full-section | #builds | 0.71 | 0.77 | identical | identical | same height 2091 |
| builds/hub | #bld-stage | 0.84 | 0.72 | identical | identical | same height 1027 |
| builds/odometer | #bld-cost-v | 0.08 | 0.79 | close | close | same digits and colour; live digits differ |
| builds/primitive-cards | #bld-prims | 0.41 | 0.76 | close | close | cards same; demo row 900 vs 1216 wide |
| builds/ribbons | #bld-hub (ribbons) | -0.01 | 0.46 | close | close | ribbon particles same; two demo boxes, no 1:1 page counterpart |
| builds/rules-card | #bld-rules | 0.92 | 0.66 | identical | identical | 640x100 both |
| builds/section-head-stats | .bld-head | 0.38 | 0.87 | close | identical | stage width 1216 so stats sit beside headline like page |
| builds/segmented-squares | #bld-run .bld-rr | 0.51 | 0.48 | close | close | same squares; wider demo row, brighter pink |
| builds/tile-code-owns | #bld-t-own | 0.96 | 0.78 | close | identical | width 460 to 398 |
| builds/tile-cost | #bld-t-cost | 0.12 | 0.81 | close | identical | width fixed; low corr is live odometer and the page's glitch overlay |
| builds/tile-decision-stream | #bld-t-stream | 0.45 | 0.80 | close | identical | width fixed; rows are live |
| builds/tile-latency | #bld-t-lat | 0.07 | 0.65 | close | identical | width fixed; live bars differ |
| builds/tile-primitive-mix | #bld-t-mix | 0.96 | 0.61 | close | identical | width fixed |
| builds/tile-where-it-runs | #bld-t-run | 0.93 | 0.80 | close | identical | width fixed |
| builds/tiles-all | .bld-tiles | 0.87 | 0.87 | identical | identical | six tiles, same layout |
| builds/value-bubble | #bld-vt (hover) | 0.51 | 0.11 | identical | identical | same glass bubble; text differs; hue is low because the bubble is mostly dark |
| code/code-window | .code-stage | 0.89 | 0.92 | identical | identical | same markup and CSS; width 1100 vs 1216 |
| code/copy-button | [data-k=desk] .code-ph | 0.72 | 0.56 | close | close | page header has LEDs and meta, demo does not; page scanlines are a global overlay |
| code/flow-strip | .code-flow | 0.60 | 0.34 | divergent | close | fixed: node colours (pink #ff6fa6, green #35e0a8, yellow #ffc53d) and bottom padding; remaining diff is the lit-node animation state (blurre |
| code/full-section | #code | 0.40 | 0.80 | close | close | page shot includes the fixed HUD; headline wraps differently at 1200 vs 1280 px; panes are live |
| code/handoff-packets | .code-status | 0.46 | 0.94 | close | close | demo hides the status text; width differs; comet captured mid-flight on page |
| code/highlighter | none (pane skin vs [data-k=zsh]) | 0.05 | 0.51 | no-counterpart | no-counterpart | demo kit (textarea, skin switch); only the shared pane skin matches the page |
| code/hot-haze | [data-k=state] | 0.30 | 0.71 | close | close | CSS copied faithfully; static sample has no gutter or minimap, so the haze inset is full width |
| code/line-gutter | [data-k=desk] | 0.19 | 0.81 | close | close | gutter, band and active number match; different code excerpt and no minimap |
| code/live-pill | .code-lv | 0.79 | 0.93 | identical | identical | same size, 55x18 |
| code/matrix-rain | [data-k=zsh] .code-rain | -0.01 | 0.61 | divergent | close | fixed: opacity .5 to .17 (tier 3 .21), width; glyph positions are random so edge corr is meaningless; density and brightness now match by ey |
| code/minimap | [data-k=desk] .code-mm | 0.51 | 0.13 | divergent | close | fixed: strip width 54 to 26 px (22 px on mobile); size now identical; page one is light, demo is dark skin so hue differs |
| code/pane-desk-py | [data-k=desk] | 0.33 | 0.94 | close | close | same markup and CSS; typing and scroll state differ; width 640 vs 589 |
| code/pane-questions-py | [data-k=q] | 0.28 | 0.67 | close | close | same markup and CSS; typing state differs |
| code/pane-state-json | [data-k=state] | 0.33 | 0.96 | close | close | same markup and CSS; different decision values; width 560 vs 589 |
| code/phosphor-log | [data-k=zsh] .code-view | 0.29 | 0.73 | close | close | no minimap in demo; log lines differ |
| code/status-bar | .code-status | 0.44 | 0.99 | close | close | same look; narrower (758 vs 1214) and status text differs |
| code/terminal | [data-k=zsh] | 0.37 | 0.39 | close | close | same header, pill, run button and CRT; live stream and rain differ; no minimap |
| code/token-link | none (gate.py snippet, light pane skin only) | 0.16 | 0.69 | no-counterpart | no-counterpart | demo snippet not on the page; judged on its own sheet |
| code/typing-engine | [data-k=zsh] (dark pane skin only) | 0.22 | 0.74 | close | close | demo pane using the page's dark skin; typed content differs |
| code/window-bar | .code-bar | 0.43 | 0.45 | close | close | same dots, tabs and eq glyph; width 718 vs 1214; eq canvas drawn with different bar count |
| desk-a-to-m/activity-log | #dkb-log | 0.13 | 0.41 | close | close | same markup/css; differs in card width (398 vs 560 so message wraps) and live rows |
| desk-a-to-m/activity-row | #dkb-rl .dkb-r | 0.08 | 0.00 | close | close | page capture misframed (measure invalid); markup/css from page dkb-r; judged from source only |
| desk-a-to-m/agent-badges | #dkb-chips .dkb-ch | 0.30 | 0.23 | close | close | chip kit omits live counter that the page chip carries; styling same |
| desk-a-to-m/agent-chip-filter | #dkb-chips | 0.42 | 0.38 | identical | identical | same 3x2 pill grid, colours and counters |
| desk-a-to-m/agent-row | #dkw-ag | 0.28 | 0.51 | identical | identical | same rows; only live state/width differ |
| desk-a-to-m/agent-tabs | #dkw-tabs | 0.94 | 0.55 | identical | identical | pixel-structure match |
| desk-a-to-m/balance-line | #dkt-pnl .dkt-pcw | 0.07 | 0.26 | divergent | close | fixed: added page axis labels, end tag, insets; still seeded dip and no light sweep |
| desk-a-to-m/bayes | #dkb-bayes | 0.12 | 0.26 | identical | identical | same card; live values differ |
| desk-a-to-m/candle-tape | #dkt-tape | 0.34 | 0.52 | identical | identical | same chart, book and chips |
| desk-a-to-m/candles-vwap | #dkt-tc | 0.10 | 0.57 | close | close | page canvas includes order book; comp is chart only by design |
| desk-a-to-m/dotted-globe | #dkw-stage | 0.14 | 0.57 | close | close | same dotted planet; page adds orbs, arcs, rim glow |
| desk-a-to-m/drift-chart | #dkb-drift | 0.16 | 0.40 | identical | identical | same card |
| desk-a-to-m/end-histogram | #dkb-dw (right strip) | 0.05 | 0.20 | close | close | page histogram is a thin edge strip; comp scales it to a full panel, same colours |
| desk-a-to-m/full-bottom | #dkb-bayes,#dkb-log,#dkb-drift | 0.60 | 0.41 | identical | identical | three-card row matches |
| desk-a-to-m/full-top | #dkt-bar,#dkt-pnl,#dkt-tape | 0.22 | 0.87 | identical | identical | matches; page shot cropped slightly |
| desk-a-to-m/globe | #dkw-world | 0.09 | 0.71 | close | close | centre globe stage matches; feeds and ticket columns intentionally absent |
| desk-a-to-m/globe-arcs | #dkw-stage | 0.08 | 0.25 | close | close | not fixed: no land dots by design, but also lacks rim glow, aurora and glowing markers |
| desk-a-to-m/handoff-pulse | .dkt-pu | -0.10 | 0.27 | close | close | same bars; comp taller with label and darker bg |
| desk-a-to-m/kv-strip | .dkt-kvs | 0.29 | 0.35 | close | close | adds a fourth kill-switch cell; style same |
| desk-a-to-m/layer-chips | #dkt-tape .dkt-chips | 0.24 | 0.24 | identical | identical | same chip styling; kit adds volume chip |
| desk-a-to-m/marquee-chips | .dkt-mq | 0.48 | 0.45 | identical | identical | same scrolling pills |
| desk-n-to-z/oracle-card | #dkw-feeds .dkw-or | 0.35 | 0.57 | identical | identical | same markup/css; page tile is narrower (218 vs 320px) |
| desk-n-to-z/orbit-orbs | #dkw-body | 0.06 | 0.42 | identical | identical | orbs/halo/labels match the page stage; page has globe behind |
| desk-n-to-z/order-book | #dkt-tc (right 30%) | 0.02 | 0.58 | close | close | same canvas code; standalone card adds title row and 418px width |
| desk-n-to-z/p-profit-caption | #dkb-drift (header+big) | 0.46 | 0.20 | close | close | comp adds loss/profit key and pooled foot |
| desk-n-to-z/p-up-readout | #dkb-bayes (header+big) | 0.10 | 0.11 | close | close | same big serif readout; comp adds foot, page has ring beside it |
| desk-n-to-z/planet-shade | #dkw-stage (globe canvas) | 0.09 | 0.63 | no-counterpart | no-counterpart | page sphere lives inside the globe canvas; limb/atmosphere look the same |
| desk-n-to-z/pnl-odometer | #dkt-pnl .dkt-pin | -0.01 | 0.22 | identical | identical | balance and pill match; page element also holds chart/bars |
| desk-n-to-z/pnl-panel | #dkt-pnl | 0.38 | 0.35 | close | close | same card; 520 vs 398px wide, live values differ |
| desk-n-to-z/posterior-curve | #dkb-bw | 0.11 | 0.17 | close | close | single posterior curve by design; page canvas also has prior/book + tags |
| desk-n-to-z/posterior-history | none | 0.00 | 0.00 | no-counterpart | no-counterpart | not measured; page strip is a layer inside the bayes card; judged on own sheet |
| desk-n-to-z/precision-ring | #dkb-rg | 0.59 | 0.48 | close | identical | paired with the 66px .dkb-rg-s variant; live variant is a 96px scale-up by design |
| desk-n-to-z/price-header | #dkt-tape (header) | 0.61 | 0.04 | close | identical | FIXED: removed 52px price override and tall padding |
| desk-n-to-z/proportion-bars | #dkt-pnl .dkt-pb | 0.63 | 0.79 | identical | identical | same bars; widths differ |
| desk-n-to-z/random-walk-fan | #dkb-dw | 0.51 | 0.33 | divergent | close | FIXED: ported page drift code (histogram well, mean tag, radar sweep, probes); run phase differs |
| desk-n-to-z/star-field | #dkw-stage (stars) | -0.07 | 0.30 | no-counterpart | no-counterpart | page stars are faint layers behind the globe; judged on own sheet |
| desk-n-to-z/stats-row | #dkt-pnl .dkt-stats | 0.52 | 0.10 | identical | identical | same cells and ring; width differs |
| desk-n-to-z/three-curves | #dkb-bw | 0.12 | 0.28 | close | close | same curves/tags; page card adds history strip (own component) |
| desk-n-to-z/ticker | #dkt-bar | 0.90 | 0.36 | identical | identical | chips are live |
| desk-n-to-z/ticket-in-flight | #dkw-tix | 0.38 | 0.47 | close | close | same ticket/rail/agent rows; 334 vs 269px, live states differ |
| desk-n-to-z/ticket-rail | #dkw-rail | 0.12 | 0.22 | close | close | same rail; different live stage and 300 vs 235px |
| desk-n-to-z/utc-clock | .dkt-clk | 0.23 | 0.01 | close | close | paired with compact variant; large variant is a documented demo scale-up |
| desk-n-to-z/venue-feeds | #dkw-feeds | 0.21 | 0.47 | close | close | same oracle tile + rows; wider so rows are shorter |
| desk-n-to-z/venue-ping | none | 0.00 | 0.00 | no-counterpart | no-counterpart | not measured; CSS-only marker kit, page markers are canvas |
| desk-n-to-z/venue-row | #dkw-vl .dkw-v | 0.56 | 0.26 | close | close | same row styling; reflows at 400px vs 218px page column |
| desk-n-to-z/winloss-strip | #dkt-wl | 0.55 | 0.59 | close | close | FIXED height 72 to 34; still 200 bars without win/loss labels (page 96 + labels) |
| desk-n-to-z/world-card | #dkw-world | 0.56 | 0.70 | identical | identical | same layout; live globe/arcs lower the edge corr |
| fx/ambient-backdrop | #fx-bgf | 0.91 | 0.99 | divergent | identical | gradient alphas were about 1.7x the page's; page values restored (README updated) |
| fx/background-shader | #fx-bg + #fx-bgf (viewport) | 0.33 | 0.93 | identical | identical | shader source byte-identical to src; plasma is time-varying so the edge score is low; page needs about 18 s to start WebGL here |
| fx/boot-log | #fx-boot .fx-bx | 0.17 | 0.90 | close | close | same card; replay button replaces the skip hint and typing phase differs; width now 540 like the page |
| fx/boot-overlay | #fx-boot | 0.97 | 1.00 | identical | identical | captured at 81% on both sides with a fake clock |
| fx/camera-push | #fx-push (html.fx-intro) | 1.00 | 1.00 | identical | identical | streak layer pixel-identical at the same animation phase |
| fx/cursor-ring | #fx-cur | 1.00 | 1.00 | identical | identical | ring and dot pixel-identical; the hover and press states were not captured |
| fx/cursor-spotlight | #fx-spotwrap/#fx-spot | 0.93 | 1.00 | divergent | identical | disc was about 1.8x brighter (also the killed colour); page alphas restored |
| fx/full-section | all fx layers of the page | 0.39 | 0.98 | identical | identical | fx.css and fx.js are verbatim copies of src; plasma is time-varying |
| fx/glitch-rgb-split | #fx-glitch (html.fx-glitch) | 0.98 | 0.99 | identical | identical | bands and flash match at a frozen phase |
| fx/grain-overlay | .fx-grainhost (.fx-grain) | 1.00 | 1.00 | close | identical | demo tile was .06 vs page .05; now .05 |
| fx/light-sweep | #bld-h2 (headSweep on .h2) | 0.40 | 0.48 | divergent | close | demo heading now uses the page .h2 with the same text and typography; box is wider and the sweep phase differs |
| fx/nav-indicator | .nav (hud) | 0.96 | 0.68 | divergent | identical | tabs were oversized with no numerals; page .nav rules and markup copied; page capture shows no pink bar because frames stall |
| fx/scanlines-crt | .fx-scan | -0.08 | 0.98 | close | identical | band alphas doubled and min-height; page values restored; edge score degenerate for 1px lines, native pixel diff 0.19 |
| fx/scroll-progress-and-headings | #desk .sec-head + #fx-prog | 0.42 | 0.70 | close | close | same base.css kit; the page head has longer copy and a wider box (aspect 0.37); #fx-prog css matches src apart from a demo top:0 |
| fx/shockwave-ring | #fx-shock .fx-ring | 1.00 | 1.00 | identical | identical | rings pixel-identical at the same phase |
| fx/toasts | #fx-toasts .fx-toast | 0.82 | 0.45 | close | close | pills identical; page content shows behind the glass on the page side |
| hero/answers-panel | #hero-live right columns (crop) | 0.08 | 0.73 | close | close | same look, standalone layout with extra 'from jev' stub |
| hero/backdrop-fx | .hero-bg + .hero-vig | 0.06 | 0.61 | close | close | same aura, grid and vignette; demo caption in the capture |
| hero/bloom-pass | #heroNet | 0.05 | 0.86 | close | close | simplified mesh plus demo bar |
| hero/bokeh-dust | none | 0.03 | 0.19 | no-counterpart | no-counterpart | canvas layer, not isolatable on the page |
| hero/decision-chip | #hero-chip | 0.43 | 0.05 | close | close | same markup and CSS; page shot clipped and caught mid-roll, live data differs |
| hero/decision-network | #hero | 0.93 | 0.95 | identical | identical | same as full-section |
| hero/depth-fog | #heroNet | 0.17 | 0.87 | close | close | simplified mesh |
| hero/encode-panel | #hero-live encode column (crop) | 0.01 | 0.91 | close | close | wider, 15 ports shown |
| hero/floor-marker | none | -0.03 | 0.44 | no-counterpart | no-counterpart | page draws the floor inside the answers canvas |
| hero/full-section | #hero | 0.87 | 0.93 | identical | identical | same markup and canvas; width 1203 vs 1280 |
| hero/impact-ripples | none | 0.07 | 0.62 | no-counterpart | no-counterpart | effect only; no page element to pair |
| hero/jev-mesh | #hero-live jev panel (crop) | 0.16 | 0.74 | close | close | same 3-layer mesh and cable |
| hero/kill-crt-overlay | #heroNet | 0.18 | 0.83 | close | close | simplified mesh plus kill chip |
| hero/legend-strip | .hero-legend | 0.72 | 0.14 | close | close | component adds tallies; few colour pixels |
| hero/node-tooltip | #heroNet / #hero-tip | 0.18 | 0.81 | close | close | tooltip hidden at rest |
| hero/parallax-layers | #heroNet | 0.17 | 0.86 | close | close | adds demo controls |
| hero/question-nodes | #hero-live typed questions column (crop) | 0.06 | 0.33 | divergent | close | fixed in CSS: bigger glow nodes, pink primitive and answer text; crop aspect mismatch |
| hero/signal-trace | #heroNet | 0.11 | 0.80 | close | close | adds trace readout |
| hero/state-panel | #hero-live state column (crop) | 0.07 | 0.40 | close | close | wider panel and looser rows than the page |
| hero/title-card | .hero-card | 0.97 | 0.86 | identical | identical | same size |
| hour/answer-chip | #hr-last | 0.54 | 0.00 | identical | identical | Same pill style; only the live state colour differed between captures (hueMatch 0). |
| hour/arithmetic-dial | #hr-d | 0.87 | 0.85 | identical | identical | Same card and layout once captured at the page card width; needle value is live. |
| hour/armed-banner | #hr-arm | 0.33 | 0.00 | close | close | Both ARMED and waiting states are styled the same as the page; the two captures were in different states of the cycle, which is why the numb |
| hour/backtest-bars | #hr-c | 0.15 | 0.79 | close | close | Same chart and stats markup and CSS; the page card is stretched by the grid row and shows 2x2 stat tiles from the grid-only @container hrg r |
| hour/build-trio | #hr-a | 0.82 | 0.87 | identical | identical | Same panel and layout; live values differ. |
| hour/candle-replay | .hr-tapebox | 0.43 | 0.84 | close | close | Same tape and legend; the standalone tape is a little taller (inline clamp height) and the seeded candles are at a different scroll position |
| hour/energy-arc | none (partial: arc and orbs inside #hr-stage) | -0.05 | 0.53 | no-counterpart | no-counterpart | The page has three agents; the component is the Dots to Jev duo. Orb, arc and label style match by eye, but there is no exact element to mea |
| hour/fig-panel | none (card shell shared by every hour panel) | - | - | no-counterpart | no-counterpart | A shell demo with no page element; not measured. Its panel shell CSS is the same as the page panels. |
| hour/full-section | #hour | 0.73 | 0.78 | close | close | Same structure; page and component differ in animation phase and live values, and some canvases are paused off-screen in one capture. |
| hour/gantt-rail | #hr-gantt | 0.68 | 0.85 | identical | identical | Same bars and axis; playhead position differs. |
| hour/honest-bars | #hr-e | 0.21 | 0.90 | close | close | Same bars, bin and ribbons; the page card is stretched to the grid row height so its bars are taller. Not changed. |
| hour/hour-ring | .hr-ringbox | 0.61 | 0.89 | close | identical | Fixed: removed its own width override (260px); now 224px against the page's 225px. |
| hour/hour-switches | #hr-b | 0.83 | 0.84 | identical | identical | Same panel; clock and switch states are live. |
| hour/mascots | #hr-stage | 0.81 | 0.85 | close | close | Same robot, orbs and chip; the demo has no conduit arcs, labels or tape. |
| hour/pixel-robot | #hr-av0 | 0.61 | 0.85 | identical | identical | Same robot and glass ring; the demo variant is 97px against the page's 114px. |
| hour/rules-chips | .hr-chip (first chip) | 0.76 | 0.89 | identical | identical | Chip CSS is identical to src; the fourth chip (confidence floor) is an addition. |
| hour/stat-strip | #hr-a-stats | 0.09 | 0.60 | close | close | Same styling; six stats in the component against four on the page, so the strip is wider and taller. |
| hour/switch-row | #hr-b .hr-sw (first) | 0.80 | 0.97 | identical | identical | Single row matches the page. |
| hud/card-spotlight | #bld-t-cost (.card) | 0.18 | 0.10 | close | close | same card chrome; content differs |
| hud/chip-kit | .sec-live | 0.22 | 0.18 | close | close | chips and pills match; page row wraps and has fewer chips |
| hud/footer-marquee | .foot .marq | 0.48 | 0.33 | close | close | same ticker; page has scanline/fx overlay and full width |
| hud/full-section | #hud | 0.87 | 0.79 | divergent | close | same fix as hud-bar; 1-2px height difference |
| hud/glitch-wordmark | #bld-wm (.glitch) | 0.44 | 0.16 | divergent | close | xl variant clipped and sans; now page serif style; page has extra fx halo |
| hud/hud-bar | #hud | 0.96 | 0.81 | divergent | identical | was 1204px wide with floor chip clipped and no active nav; now full width with nav scrollspy |
| hud/kill-switch | #killBtn | 0.65 | 0.61 | divergent | identical | demo size override removed, now 81x32 like the page; lamp phase differs |
| hud/logo-mark | .hud .logo | 0.89 | 0.98 | identical | identical | default 34px logo matches |
| hud/metric-strip | .hud .mets | 0.24 | 0.59 | close | close | chips match; the floor stepper buttons are an intentional extra |
| hud/metric-tooltip | .hud .mets | 0.23 | 0.72 | close | close | same .m chips; demo set differs (last-live chip); the tooltip popup was not compared with a page tooltip |
| hud/nav-scrollspy | .hud .nav | 0.87 | 0.82 | divergent | close | hidden 06 link now hidden; pill, underline, padding match page; 1px height difference |
| hud/odometer | #mDec | -0.01 | 0.15 | close | close | same reels; the metric is noisy at 40px and the page digit was flashing; judged by eye |
| hud/orb-kit | #hr-jev-orb | 0.29 | 0.99 | close | close | same orb; 72px vs 88px, page has scanlines |
| hud/runtime-only | none | - | - | no-counterpart | no-counterpart | JSON tail tool, no page element |
| hud/section-tint | none | - | - | no-counterpart | no-counterpart | body-level wash, judged on its own sheet |
| hud/shortcuts-dialog | #kbDlg (.kb) | 0.94 | 0.91 | identical | identical | same dialog; demo row p instead of r |
| hud/tier-indicator | none | - | - | no-counterpart | no-counterpart | diagnostic demo, looks coherent |
| hud/toggle-kit | .hr-sw.on .tg | 0.57 | 0.89 | close | close | 46x24 base .tg vs page 48x25 hour override |
| lab/action-bars | #lab-qa | 0.67 | 0.74 | identical | identical | same CSS; the page shows a buy win, the component a hold |
| lab/decide-button | #lab-magw | 0.57 | 0.98 | identical | identical | 5 px height difference from capture; same look |
| lab/decision-lab | .lab-grid | 0.75 | 0.64 | identical | identical | 1204 px vs 1216 px wide; same height |
| lab/decision-tape | #lab-tape | 0.28 | 0.18 | close | close | no copy-link button, extra hint box; rows differ live |
| lab/dest-badge | #lab-dest | 0.43 | 0.96 | identical | identical | the page badge stretches in the grid; same glow, font and colours |
| lab/encode-chips | #lab-s1 | 0.66 | 0.58 | identical | identical | CSS identical; the page's coloured borders and dots are a transient chg flash |
| lab/full-section | #lab | 0.35 | 0.64 | close | close | 1204 px vs 1280 px wide; live state differs |
| lab/gate-bar | #lab-s3 | 0.46 | 0.81 | close | close | title and no 03 badge or diff line; track and pin identical |
| lab/handoff-json | .lab-jsw | 0.13 | 0.25 | close | close | inner window identical; the component adds a card and header, and was caught mid-typing |
| lab/hard-rules | .lab-lower .lab-lw:nth-child(2) | -0.04 | 0.43 | close | close | same slider, switch and caps; the component adds subheads and a verdict line |
| lab/mini-verdict | #lab-mini | 0.63 | 0.43 | identical | identical | hidden on the page at 1280 wide, forced visible for capture; same pill |
| lab/pipeline | #lab-pipe | 0.79 | 0.81 | identical | identical | same size and layout; demo state differs |
| lab/pipeline-status | .lab-pph | 0.46 | 0.45 | identical | identical | same pill; progress hairline at a different point in the run |
| lab/queue-tree | #lab-s4 | 0.02 | 0.67 | close | close | no EXECUTE stamp card, so the tree spans the right half; handoff typed mid-way |
| lab/range-slider | .lab-sliders .lab-row | 0.74 | 0.95 | identical | identical | edge_bps row matches exactly |
| lab/risk-dial | #lab-qc | 0.69 | 0.86 | identical | identical | same gauge and chips; values differ |
| lab/scenario-chips | #lab-presets | 0.78 | 0.02 | identical | identical | same chips; the component has trend pressed, hence the low hue match |
| lab/size-columns | #lab-qb | 0.23 | 0.60 | identical | identical | same columns; the component is in the hold-dimmed state and the page card stretches |
| lab/state-controls | #lab-ctl | 0.09 | 0.78 | close | close | controls identical; the component adds a state.json readout and has no verdict strip |
| lab/switch-card | #lab-auto | 0.48 | 0.67 | identical | identical | component is 230 px wide vs 207 px; same toggle and styling |
| lab/typed-questions | #lab-s2 | 0.76 | 0.53 | identical | identical | same layout and size; values and win state differ |

## Not claimed
- Not a pixel diff: live data and animation states make 1:1 pixel equality impossible.
- 'close' means same look with named minor differences (demo width, missing page-only overlay, live values).
- Only the six section components feed the main page; the other 179 are extracted copies (the main page is byte-identical to the build from before this change).
