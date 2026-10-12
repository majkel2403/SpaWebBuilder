/* Glitch wordmark (hud/glitch-wordmark)
   Reuse: copy this folder + engine.js + core.js + base.css; call JEV.boot().
   Optional JS: burst button (#hx-gl-burst) + bus "kill". The base effect is CSS only.
*/
JEV.mod('hud-glitch-wordmark', () => {
  const J = JEV;
  const gl = J.$$('.glitch'); if (!gl.length) return;
  const burst = () => { for (const g of gl) { g.classList.remove('hx-burst'); void g.offsetWidth; g.classList.add('hx-burst'); } clearTimeout(burst.t); burst.t = setTimeout(() => gl.forEach((g) => g.classList.remove('hx-burst')), 620); };
  const b = document.getElementById('hx-gl-burst'); if (b) b.addEventListener('click', burst);
  J.bus.on('kill', burst);
});
