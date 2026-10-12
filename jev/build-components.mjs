#!/usr/bin/env node
// Builds every components/<group>/<name>/component.json into a standalone index.html next to it, plus components/index.html (gallery).
// usage: node jev/build-components.mjs [--only group/name]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const cdir = path.join(root, 'components');
const src = (...p) => path.join(root, 'src', ...p);
const rd = (p) => fs.readFileSync(p, 'utf8');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const esc = (s) => s.replace(/<\/script/gi, '<\\/script');

const base = rd(src('css', 'base.css'));
const engine = rd(src('js', 'engine.js'));
const core = rd(src('js', 'core.js'));
const main = rd(src('js', 'main.js'));
const fxCss = rd(src('css', 'fx.css')), fxJs = rd(src('js', 'fx.js')), fxHtml = rd(src('html', '00-fx.html'));
const hudHtml = rd(src('html', '05-hud.html'));

const stageCss = `
body.cmp{min-height:100vh;display:flex;justify-content:center;align-items:flex-start;padding:clamp(12px,3vw,40px)}
.cmp-stage{width:100%;max-width:var(--cmp-w,1200px);position:relative}
.cmp-note{position:fixed;left:10px;bottom:8px;z-index:5;font:10px/1.4 var(--mono);color:var(--dim);letter-spacing:.08em;pointer-events:none}
`;
const comps = [];
for (const g of fs.readdirSync(cdir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const c of fs.readdirSync(path.join(cdir, g.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const dir = path.join(cdir, g.name, c.name), jf = path.join(dir, 'component.json');
    if (!fs.existsSync(jf)) continue;
    const m = JSON.parse(rd(jf));
    comps.push({ group: g.name, name: c.name, ...m });
    if (only && only !== g.name + '/' + c.name) continue;
    const files = (list) => (list || []).map((f) => rd(path.join(dir, f)));
    const needs = m.needs || {};
    const css = [base, needs.fx ? fxCss : '', ...files(m.css), stageCss].join('\n');
    const html = [needs.fx ? fxHtml : '', needs.hud ? hudHtml : '', `<div class="cmp-stage"${m.width ? ` style="--cmp-w:${m.width}"` : ''}>`, ...files(m.html), '</div>', `<div class="cmp-note">jev / ${g.name} / ${c.name}</div>`].join('\n');
    const js = [engine, core, needs.fx ? fxJs : '', ...files(m.js), main].filter(Boolean)
      .map((s) => `<script>\n${esc(s)}\n</script>`).join('\n');
    const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${m.title || c.name} · JEV component</title><meta name="theme-color" content="#05030a">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Space+Grotesk:wght@500;600;700&family=Fraunces:opsz,wght@9..144,700;9..144,900&display=swap" media="print" onload="this.media='all'">
<style>${css}</style></head><body class="cmp">
${html}
${js}
</body></html>`;
    fs.writeFileSync(path.join(dir, 'index.html'), page);
    console.log(`built ${g.name}/${c.name}  ${(page.length / 1024).toFixed(0)} KB`);
  }
}
// gallery
const groups = [...new Set(comps.map((c) => c.group))];
const card = (c) => `<a class="g-card" href="./${c.group}/${c.name}/index.html"><div class="g-prev"><iframe data-src="./${c.group}/${c.name}/index.html" title="${c.title || c.name}" tabindex="-1"></iframe></div><div class="g-meta"><b>${c.title || c.name}</b><span>${c.group} / ${c.name}</span><p>${c.description || ''}</p></div></a>`;
const gallery = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JEV components</title>
<style>
:root{color-scheme:dark}body{margin:0;background:#05030a;color:#f4eef6;font:12.5px/1.5 ui-monospace,'JetBrains Mono',Menlo,monospace;padding:clamp(14px,3vw,40px)}
h1{font:700 clamp(26px,4vw,48px)/1 system-ui,sans-serif;margin:0 0 6px}h1 em{font-style:normal;color:#ff2e6e}.sub{color:#8d8499;max-width:70ch;margin:0 0 28px}
h2{font:600 11px/1 ui-monospace,monospace;letter-spacing:.24em;text-transform:uppercase;color:#ff2e6e;margin:34px 0 14px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.g-card{display:block;border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;background:rgba(255,255,255,.03);color:inherit;text-decoration:none;transition:.25s}
.g-card:hover{border-color:#ff2e6e;transform:translateY(-2px);box-shadow:0 0 30px rgba(255,46,110,.25)}
.g-prev{height:200px;position:relative;overflow:hidden;background:#05030a}.g-prev iframe{position:absolute;left:0;top:0;width:1200px;height:800px;border:0;transform:scale(.27);transform-origin:0 0;pointer-events:none}
.g-meta{padding:12px 14px}.g-meta b{display:block;font-size:13px}.g-meta span{color:#ff7ab3;font-size:10px;letter-spacing:.1em}.g-meta p{color:#8d8499;margin:6px 0 0;font-size:11.5px}
</style></head><body><h1>JEV <em>components</em></h1>
<p class="sub">Every section and chart of the JEV Desk as a standalone page. Open one, or copy its folder: <code>component.html</code> + <code>component.css</code> + <code>component.js</code> + <code>component.json</code> and the shared runtime (engine.js, core.js, base.css). All data is simulated.</p>
${groups.map((g) => `<h2>${g}</h2><div class="g">${comps.filter((c) => c.group === g).map(card).join('')}</div>`).join('\n')}
<script>
/* live previews: load an iframe only while its card is on screen (max ~6 at once), unload when it leaves */
const io=new IntersectionObserver(es=>es.forEach(e=>{const f=e.target.querySelector('iframe');if(!f)return;
 if(e.isIntersecting){if(!f.src)f.src=f.dataset.src}else if(f.src){f.removeAttribute('src');f.src='about:blank';f.removeAttribute('src')}}),{rootMargin:'-10% 0px'});
document.querySelectorAll('.g-prev').forEach(el=>io.observe(el));
</script></body></html>`;
if (!only) fs.writeFileSync(path.join(cdir, 'index.html'), gallery);
console.log(`${comps.length} components${only ? ' (partial build)' : ' + gallery'}`);
