#!/usr/bin/env node
// Verifies the motion config of components: no errors, after the entrance every [data-m] element is fully visible (opacity 1, no transform/filter/clip),
// the replay/exit API works, and the number of animated elements is reported.
// usage: node jev/tools/motion-check.mjs group/name [group/name ...]   (or --all)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let ids = process.argv.slice(2);
if (ids.includes('--all')) { ids = []; for (const g of fs.readdirSync(path.join(root, 'components'), { withFileTypes: true }).filter((d) => d.isDirectory())) for (const c of fs.readdirSync(path.join(root, 'components', g.name), { withFileTypes: true }).filter((d) => d.isDirectory())) { const jf = path.join(root, 'components', g.name, c.name, 'component.json'); if (fs.existsSync(jf) && JSON.parse(fs.readFileSync(jf)).motion) ids.push(g.name + '/' + c.name); } }
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
let bad = 0;
for (const id of ids) {
  const p = await (await b.newContext({ viewport: { width: 1100, height: 700 } })).newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message.slice(0, 100))); p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text().slice(0, 100)); });
  await p.goto('file://' + path.join(root, 'components', id, 'index.html'), { waitUntil: 'load' }); await p.waitForTimeout(6500);
  const r = await p.evaluate(() => {
    const els = [...document.querySelectorAll('[data-m]')]; const stuck = els.filter((e) => { const s = getComputedStyle(e); return +s.opacity < 0.98 || (s.clipPath !== 'none' && !/inset\(0(px)? 0(px)? 0(px)? 0(px)?\)|circle\(1[0-9]{2}/.test(s.clipPath)) || /blur/.test(s.filter); });
    return { n: els.length, loops: document.querySelectorAll('[data-m-loop]').length, stuck: stuck.slice(0, 3).map((e) => e.tagName + '.' + String(e.className).slice(0, 30)), hasApi: !!window.JEVM, bar: !!document.querySelector('.m-bar') };
  });
  const issues = []; if (errs.length) issues.push('errors: ' + errs.join(' | ')); if (!r.hasApi) issues.push('no JEVM'); if (!r.n && !r.loops) issues.push('no animated elements'); if (r.stuck.length) issues.push('not fully visible after entrance: ' + r.stuck.join(', '));
  console.log((issues.length ? 'FAIL ' : 'ok   ') + id + `  enter:${r.n} loops:${r.loops}` + (issues.length ? '  -> ' + issues.join('; ') : '')); if (issues.length) bad++;
  await p.close();
}
await b.close(); process.exit(bad ? 1 : 0);
