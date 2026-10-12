#!/usr/bin/env node
// Structure signature of a built page, to compare two builds without caring about live values.
// usage: node jev/tools/dom-sig.mjs --a base.html --b new.html [--wait 9000]   (hard checks: ids, canvas count, module list, errors, height)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const wait = +arg('wait', 9000);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
async function sig(file, w, h) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + path.resolve(file), { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(wait);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(150); }
  const r = await p.evaluate(() => {
    const set = new Set(), ids = new Set(); let canvases = 0;
    document.querySelectorAll('body *').forEach((e) => { if (e.closest('.fx-toast,#fx-boot,[data-dyn]')) return; set.add(e.tagName.toLowerCase() + '.' + [...e.classList].filter((c) => !/^(in|on|is-|hr-on|dk-)/.test(c) || true).sort().join('.')); if (e.id) ids.add(e.id); if (e.tagName === 'CANVAS') canvases++; });
    return { sigs: [...set].sort(), ids: [...ids].sort(), canvases, mods: (window.JEV && window.JEV.bootLog || []).map((x) => x.split(' ')[0]).filter((x) => x !== 'fx-gl').sort(), height: document.documentElement.scrollHeight };
  });
  await p.close(); return { ...r, errs };
}
const A = await sig(arg('a'), 1440, 900), B = await sig(arg('b'), 1440, 900);
const diff = (x, y) => x.filter((v) => !y.includes(v));
const out = { sameIds: JSON.stringify(A.ids) === JSON.stringify(B.ids), missingSigs: diff(A.sigs, B.sigs), extraSigs: diff(B.sigs, A.sigs), missingIds: diff(A.ids, B.ids), extraIds: diff(B.ids, A.ids), canvases: [A.canvases, B.canvases], mods: [A.mods.join(','), B.mods.join(',')], height: [A.height, B.height], errsA: A.errs.length, errsB: B.errs };
console.log(JSON.stringify(out, null, 1)); await b.close();
// class signatures differ between runs because of animation state (on/live/typing...), so they are informational only
const hardFail = !out.sameIds || A.canvases !== B.canvases || A.mods.join() !== B.mods.join() || out.errsB.length || Math.abs(A.height - B.height) > 80;
console.error(hardFail ? 'STRUCTURE DIFFERS' : 'structure equal (ids, canvases, modules, no errors, height within 80px)');
process.exit(hardFail ? 1 : 0);
