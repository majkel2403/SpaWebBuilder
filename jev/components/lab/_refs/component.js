  /* ------------------------------------------------------------------ refs ------------------------------------------------------------------ */
  const ctl = $('#lab-ctl'), pipe = $('#lab-pipe');
  const stg = [1, 2, 3, 4].map((i) => $('#lab-s' + i));
  const go = $('#lab-go'), magw = $('#lab-magw'), autoB = $('#lab-auto'), killB = $('#lab-kill'), killS = $('#lab-kill-s');
  const miniEl = $('#lab-mini'), miA = $('#lab-mi-a'), miS = $('#lab-mi-s'), miC = $('#lab-mi-c'), miD = $('#lab-mi-d');
  const statT = $('#lab-stat-t'), prog = $('#lab-prog'), srEl = $('#lab-sr');
  const gt = $('#lab-gt'), fl = $('#lab-fl'), flv = $('#lab-fl-v'), cf = $('#lab-cf'), cfv = $('#lab-cf-v'), tail = $('#lab-gt-tail');
  const verdict = $('#lab-verdict'), why = $('#lab-why');
  const ring = $('#lab-ring'), confEl = $('#lab-conf'), pickEl = $('#lab-pick'), pickS = $('#lab-pick-s'), qb = $('#lab-qb');
  const gva = $('#lab-gva'), gnd = $('#lab-gnd'), yn = $('#lab-yn'), yp = $('#lab-yp'), msEl = $('#lab-ms');
  const jsEl = $('#lab-js'), destEl = $('#lab-dest'), destT = $('#lab-dest-t'), destS = $('#lab-dest-s'), destR = $('.lab-dest-r', destEl);
  const tpEl = $('#lab-tp');

  /* ------------------------------------------------------------------ state ------------------------------------------------------------------ */
  const V = {};
  FIELDS.forEach((f) => (V[f.k] = f.v));
  let cur = null, auto = true, dirty = false, seq = 0, tween = null, ct = 0, timers = [], running = false;
  let lv = false, pv = false, pending = false, committed = false, runT0 = 0;
  const tape = [];
  let lastC = null, base = null, copyT = 0, hashT = 0, restored = false;
  const files = { execute: [], review: [], skip: [] }, fcount = { execute: 0, review: 0, skip: 0 };

