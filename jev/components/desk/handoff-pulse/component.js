  /* handoff pulse: last 60 s of decisions */
  const pu = $('#dkt-pu'), puS = { g: null, W: 0, H: 0 };
  if (pu) {
    J.watch(pu, () => { const r = J.fit(pu); puS.g = r.g; puS.W = r.W; puS.H = r.H; });
    const t = nowMs(), dests = ['execute', 'execute', 'execute', 'review', 'review', 'skip', 'skip', 'skip'];
    for (let i = 0; i < 44; i++) pulseEv.push({ t: t - rgs() * 58000, dest: dests[(rgs() * dests.length) | 0], conf: 0.5 + rgs() * 0.48 });
    pulseEv.sort((a, b) => a.t - b.t);
  }
  const PD = { execute: [GRN, '#2ee6a6'], review: [AMB, '#ffc13d'], skip: ['125,117,144', '#7d7590'] };
  function drawPulse() {
    const g = puS.g; if (!g) return;
    const W = puS.W, H = puS.H, t = nowMs();
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, H - 1, W, 1);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < pulseEv.length; i++) {
      const e = pulseEv[i], age = (t - e.t) / 60000; if (age > 1) continue;
      const x = Math.round(W - 3 - age * (W - 4)), h = 4 + e.conf * (H - 8), c = PD[e.dest];
      g.globalAlpha = 1 - age * 0.7; g.fillStyle = c[1]; g.fillRect(x, H - 1 - h, 2, h);
      if (e.dest === 'execute' && age < 0.5) { g.globalAlpha = 0.14 * (1 - age * 2); g.fillRect(x - 2, H - 1 - h, 6, h); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
