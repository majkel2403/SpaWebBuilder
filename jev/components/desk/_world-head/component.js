/* ===== desk-world — the world: hand-rolled 3D globe · global feeds · ticket in flight · six-agent strip (prefix dkw-) =====
 * Everything is simulated. One frame task (gated by the card's visibility) draws the globe canvas and moves the orbiting
 * DOM agents; a light timer chain keeps the six-agent state machine (and its 'agentstep' bus event) going, but only
 * touches the DOM while the card / tab strip is on screen and the tab is visible (it repaints from state on return).
 * The globe canvas has a cost governor (see `govern`): 60 fps -> 30 fps -> fewer dots / passes -> smaller backing store. */
JEV.mod('desk-world', () => {
  'use strict';
  const J = JEV, C = J.C, TAU = J.TAU, clamp = J.clamp, lerp = J.lerp, D2R = Math.PI / 180;
  const root = J.$('#dkw-world');
  if (!root) return;
  const body = J.$('#dkw-body'), cv = J.$('#dkw-cv'), stage = J.$('#dkw-stage'), grab = J.$('#dkw-grab');
  const tixEl = J.$('#dkw-tix'), port = J.$('#dkw-port'), feedsEl = J.$('#dkw-feeds'), tabsEl = J.$('#dkw-tabs');
  const txt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const fmt = J.fmt, rnd = J.rnd;
  const MONO = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  /* ================================================================ data ================================================================ */
  const CITIES = [
    { c: 'NYC', lat: 40.7, lon: -74.0 }, { c: 'LON', lat: 51.5, lon: -0.1 }, { c: 'FRA', lat: 50.1, lon: 8.7 }, { c: 'DXB', lat: 25.2, lon: 55.3 },
    { c: 'SGP', lat: 1.35, lon: 103.8 }, { c: 'TYO', lat: 35.7, lon: 139.7 }, { c: 'SYD', lat: -33.9, lon: 151.2 }, { c: 'SFO', lat: 37.8, lon: -122.4 },
  ];
  const CIDX = {}; CITIES.forEach((c, i) => (CIDX[c.c] = i));
  const llv = (lat, lon) => { const a = lat * D2R, b = lon * D2R; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };
  CITIES.forEach((c) => (c.v = llv(c.lat, c.lon)));
  // venues: key · matching-engine region on the globe · colour · standing bias vs the oracle (bps) · base latency (ms)
  const FEEDS = [
    { k: 'coinbase', city: 'SFO', bias: 0.3, lat0: 24 }, { k: 'kraken', city: 'NYC', bias: -0.2, lat0: 31 }, { k: 'binance', city: 'SGP', bias: 0.1, lat0: 18 },
    { k: 'okx', city: 'SYD', bias: -0.1, lat0: 42 }, { k: 'bybit', city: 'DXB', bias: 0.2, lat0: 36 }, { k: 'bitstamp', city: 'LON', bias: -0.4, lat0: 58 },
    { k: 'upbit', city: 'TYO', bias: 0.8, lat0: 71 }, { k: 'deribit', city: 'FRA', bias: 0, lat0: 27 },
  ];
  // packet / beam colours: 0 gold(quote) 1 white(order) 2 pink(jev) 3 cyan(fill) 4 green 5 violet 6 orange 7 red
  const COLS = ['#ffc13d', '#f4eef6', '#ff7ab3', '#3be0ff', '#2ee6a6', '#a66bff', '#ff8a3d', '#ff4d5e'];
  const SPR = COLS.map((hex) => {
    const c = document.createElement('canvas'); c.width = c.height = 48; const q = c.getContext('2d');
    const gr = q.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, J.rgba(hex, 0.95)); gr.addColorStop(0.42, J.rgba(hex, 0.34)); gr.addColorStop(1, J.rgba(hex, 0));
    q.fillStyle = gr; q.fillRect(0, 0, 48, 48); return c;
  });
  const WARM = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'); const gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,214,150,.9)'); gr.addColorStop(0.35, 'rgba(255,170,90,.35)'); gr.addColorStop(1, 'rgba(255,140,70,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); return c; })();
  const ARC_PAIRS = [[0, 1, 0], [1, 3, 3], [2, 3, 2], [3, 4, 0], [4, 5, 1], [5, 7, 2], [7, 0, 3], [6, 4, 0], [6, 5, 2], [0, 2, 1], [1, 4, 3], [3, 5, 0], [7, 6, 1]];
  const AG = J.AGENTS, AGK = AG.map((a) => a.key);
  const AGI = {}; AGK.forEach((k, i) => (AGI[k] = i));
  const VERB = ['SCAN', 'RESEARCH', 'PRICE', 'SIZE', 'FILL', 'CLOSE'];
  const CAP = 527000; // simulated desk capital used to turn "% of capital" into a notional

