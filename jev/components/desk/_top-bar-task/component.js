  let acB = 0;
  J.task(bar, (t, dt) => { drawPulse(); acB += dt; if (acB < 0.25) return; acB = 0; flushBar(); });

