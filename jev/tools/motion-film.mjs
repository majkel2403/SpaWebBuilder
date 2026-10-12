#!/usr/bin/env node
// Captures a filmstrip of a component's entrance (exit -> replay -> frames at the given ms) and writes ONE contact image.
// usage: node jev/tools/motion-film.mjs group/name out.png [times=120,350,700,1500]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [,, id, out, times = '120,350,700,1500'] = process.argv;
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 1100, height: 650 } })).newPage();
await p.goto('file://' + path.join(root, 'components', id, 'index.html'), { waitUntil: 'load' }); await p.waitForTimeout(3000);
await p.evaluate(() => window.JEVM && JEVM.out()); await p.waitForTimeout(900); await p.evaluate(() => window.JEVM && JEVM.replay());
const t0 = Date.now(), shots = []; for (const t of times.split(',').map(Number)) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); shots.push((await p.screenshot()).toString('base64')); }
const q = await b.newPage({ viewport: { width: 1500, height: 300 } });
await q.setContent(`<body style="margin:0;background:#111"><div style="display:grid;grid-template-columns:repeat(${shots.length},1fr);gap:4px;padding:4px">${shots.map((s, i) => `<div style="position:relative"><img src="data:image/png;base64,${s}" style="width:100%;display:block;border:1px solid #333"><span style="position:absolute;left:6px;top:4px;font:11px monospace;color:#ff7ab3">${times.split(',')[i]} ms</span></div>`).join('')}</div>`);
await q.waitForTimeout(300); await q.screenshot({ path: out, fullPage: true }); await b.close(); console.log('wrote', out);
