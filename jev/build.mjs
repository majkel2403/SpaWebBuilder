#!/usr/bin/env node
// Builds ONE self-contained html file from the page manifest (page.json).
// Sections (hero, code, builds, hour, desk, lab) are SOURCE-OF-TRUTH COMPONENTS in components/<group>/<name>/;
// the shared runtime (engine.js, core.js, base.css, fx layer, HUD and footer fragments, shell) lives in src/.
// usage: node jev/build.mjs [--out path/to/file.html]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const out = path.resolve(arg('out', path.join(root, 'dist', 'jev.html')));
const man = JSON.parse(fs.readFileSync(path.join(root, 'page.json'), 'utf8'));
const rd = (p) => fs.readFileSync(p, 'utf8');

// "src:css/base.css" -> [{name, text}] ; "cmp:hero/full-section:css" -> every css file listed in that component.json
function resolve(ref) {
  const [kind, a, b] = ref.split(':');
  if (kind === 'src') return [{ name: path.basename(a), text: rd(path.join(root, 'src', a)) }];
  if (kind === 'cmp') {
    const dir = path.join(root, 'components', a), j = JSON.parse(rd(path.join(dir, 'component.json')));
    return (j[b] || []).map((f) => ({ name: a + '/' + f, text: rd(path.join(dir, f)) }));
  }
  throw new Error('bad ref ' + ref);
}
const all = (list) => list.flatMap(resolve);
const css = all(man.css).map((f) => `/* ---- ${f.name} ---- */\n` + f.text).join('\n');
const html = all(man.html).map((f) => `<!-- ${f.name} -->\n` + f.text).join('\n');
const js = all(man.js).map((f) => `<script>/* ---- ${f.name} ---- */\n${f.text.replace(/<\/script/gi, '<\\/script')}\n</script>`).join('\n');

const page = rd(path.join(root, man.shell)).replace('/*@css*/', () => css).replace('<!--@html-->', () => html).replace('<!--@js-->', () => js);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log(`built ${path.relative(process.cwd(), out)}  ${(page.length / 1024).toFixed(1)} KB  (${all(man.html).length} html · ${all(man.css).length} css · ${all(man.js).length} js)`);
