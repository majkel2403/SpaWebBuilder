/* desk-bottom — bayesian update · activity log · drift vs noise (prefix dkb-). Everything here is SIMULATED.
 * bayes : conjugate-gaussian prior x book likelihood -> posterior, re-centred on every 'decision' (edge_bps nudges the book)
 * log   : DOM list, newest on top, rows slide by transform only; fed by bus 'agentstep' + 'decision' (self-synthesised if absent)
 * drift : 140 random walks with a small positive drift, drawn incrementally on a persistent canvas (+ live end-value histogram) */
JEV.mod('desk-bottom', () => {
  const J = JEV, $ = J.$, C = J.C, S = J.S, clamp = J.clamp, fmt = J.fmt, gauss = J.gauss, TAU = J.TAU;
  const bay = $('#dkb-bayes'), lgc = $('#dkb-log'), drc = $('#dkb-drift');
  if (!bay || !lgc || !drc) return;
  const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Mono', Menlo, Consolas, monospace";
  const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const setT = (el, s) => { if (el && el.textContent !== s) el.textContent = s; };
  /** odometer: per-digit cells; a changed digit rolls in from below (up) or above (down) while the old one leaves — transform/opacity only, no clipping so the glow survives */
  const odo = (el) => {
    let cells = [], cur = '';
    return (s) => {
      if (s === cur) return;
      const up = parseFloat(s) >= parseFloat(cur || s);
      if (s.length !== cur.length) {
        el.textContent = ''; cells = [];
        for (let i = 0; i < s.length; i++) { const c = document.createElement('span'), t = document.createElement('i'); c.className = 'dkb-dg'; c.setAttribute('aria-hidden', 'true'); t.textContent = s[i]; c.appendChild(t); el.appendChild(c); cells.push(c); }
      } else {
        for (let i = 0; i < s.length; i++) {
          if (s[i] === cur[i]) continue;
          const c = cells[i], t = c.firstChild, old = t.textContent; t.textContent = s[i];
          if (J.reduce || s[i] === '.' || old === '.') continue;
          const gh = document.createElement('i'); gh.className = 'dkb-gh'; gh.textContent = old; c.appendChild(gh);
          const d = up ? 1 : -1;
          const a1 = J.animate(gh, [{ transform: 'translateY(0)', opacity: 0.9 }, { transform: 'translateY(' + -0.42 * d + 'em)', opacity: 0 }], { duration: 360, easing: 'cubic-bezier(.3,.7,.2,1)' });
          if (a1) a1.onfinish = () => gh.remove(); else gh.remove();
          J.animate(t, [{ transform: 'translateY(' + 0.42 * d + 'em)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.25,1)' });
        }
      }
      cur = s; el.setAttribute('role', 'img'); el.setAttribute('aria-label', s);
    };
  };
  const sgn = (v, d) => (v >= 0 ? '+' : '-') + Math.abs(v).toFixed(d == null ? 1 : d);
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /** soft additive glow sprite (drawn with 'lighter'; replaces shadowBlur) */
  const sprite = (rgb) => {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const g = c.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(.28, 'rgba(' + rgb + ',.35)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return c;
  };
  /** cards reveal with a small scale/translate (.rv) — JEV.fit measures the transformed rect, so re-fit once the reveal settles */
  const afterReveal = (card, fn) => {
    card.addEventListener('transitionend', (e) => { if (e.target === card && e.propertyName === 'transform') fn(); });
    J.onView(card, () => setTimeout(fn, 1300), { threshold: 0.05 });
  };
  /** bake a pill label to a tiny sprite (text is the costly part of a canvas frame; sprites are re-baked only when the label changes) */
  const bake = (cv, txt, w, h, fill, stroke, color, font) => {
    cv.width = Math.round(w * J.DPR); cv.height = Math.round(h * J.DPR);
    const g = cv.getContext('2d'); g.setTransform(J.DPR, 0, 0, J.DPR, 0, 0);
    rr(g, 0.5, 0.5, w - 1, h - 1, 4); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 1; g.stroke();
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.fillText(txt, w / 2, h / 2 + 3.4);
  };
  const onFonts = []; // canvas text needs the web font loaded; redraw static layers once it is
  try { if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("700 9px 'JetBrains Mono'"), document.fonts.load("9px 'JetBrains Mono'")]).then(() => onFonts.forEach((f) => f())).catch(() => {}); } catch (e) { /* ignore */ }
  /** Abramowitz-Stegun erf, enough for a tail-probability label */
  const erf = (x) => { const sg = x < 0 ? -1 : 1, a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return sg * (1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-a * a)); };
  const TIER = () => (J.tier || 2);
  const FX_ON = () => TIER() >= 2 && !J.reduce;
  /** polyline segment a..b (indices, fractional ok) of ys over XS, used for travelling highlights */
  const seg = (g, xs, ys, np, a, b, w, style) => {
    a = Math.max(0, Math.floor(a)); b = Math.min(np - 1, Math.ceil(b)); if (b <= a) return;
    g.beginPath(); g.moveTo(xs[a], ys[a]); for (let i = a + 1; i <= b; i++) g.lineTo(xs[i], ys[i]);
    g.lineWidth = w; g.strokeStyle = style; g.stroke();
  };
  const DASH = [3, 4], DOT = [1.5, 3.5], NODASH = [], F_TAG = '700 9px ' + MONO, F_HALT = '700 9.5px ' + MONO;

