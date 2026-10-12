// Shared resolver for components. A component.json may be:
//   legacy      { html:[...], css:[...], js:[...] }                 -> one block per file (as before)
//   unit        { html, css, js, section:"g/name", compose:["g/_head","self","g/_tail"], hidden?, newScript? }
//               a CHUNK of a section's source. Standalone page = the chunks in `compose` (default ["self"]) joined with '' (one script).
//   section     { units:["g/_head","g/a","g/b",...], order?:{html:[..],css:[..],js:[..]} } -> the page/section = every unit's chunks joined with '' in order
//               (all js chunks go into ONE <script>, except that a unit with "newScript":true starts a new one)
// Invariant that keeps this safe: joining the chunks of a section reproduces the section's original source byte for byte.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const cdir = path.join(root, 'components');
const rd = (p) => fs.readFileSync(p, 'utf8');
export const jsonOf = (id) => JSON.parse(rd(path.join(cdir, id, 'component.json')));
export const own = (id, kind) => { const d = path.join(cdir, id); return (jsonOf(id)[kind] || []).map((f) => ({ file: f, text: rd(path.join(d, f)) })); };
export const joinOwn = (id, kind) => own(id, kind).map((x) => x.text).join('');
export const concatUnits = (ids, kind) => ids.map((u) => joinOwn(u, kind)).join('');

/** blocks of one component for one kind ('html' | 'css' | 'js'): [{name, text}] (js: one entry per <script>) */
export function blocks(id, kind) {
  const j = jsonOf(id);
  if (j.units || j.order) {
    const out = []; let cur = null;
    for (const u of ((j.order && j.order[kind]) || j.units || [])) {
      const uj = jsonOf(u), txt = joinOwn(u, kind);
      if (!txt) continue;
      if (!cur || (kind === 'js' && uj.newScript)) { cur = { name: out.length ? `${id}#${out.length}` : id, text: '' }; out.push(cur); }
      cur.text += txt;
    }
    return out;
  }
  if (j.compose) {
    const text = j.compose.map((x) => (x === 'self' ? joinOwn(id, kind) : joinOwn(x, kind))).join('');
    return text ? [{ name: id, text }] : [];
  }
  return own(id, kind).map((x) => ({ name: `${id}/${x.file}`, text: x.text }));
}
