#!/usr/bin/env python3
"""Drift check: how much of each component's css/js/text still exists in the sources of truth (the six section components + src runtime).
usage: python3 jev/tools/fidelity.py [--json out.json]   (run from the repo root; stdlib only)"""
import re, glob, json, sys, statistics as st
ROOT = 'jev/'
SOT = ['hero/full-section', 'code/full-section', 'builds/full-section', 'hour/full-section', 'desk/full-desk', 'lab/full-section']
norm = lambda s: re.sub(r'\s+', ' ', s).strip()
def rules(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S); out = []
    def parse(text, ctx):
        j = 0; L = len(text)
        while j < L:
            b = text.find('{', j)
            if b < 0: break
            sel = norm(text[j:b]); d = 1; k = b + 1
            while k < L and d:
                d += (text[k] == '{') - (text[k] == '}'); k += 1
            body = text[b + 1:k - 1]
            if sel.startswith(('@media', '@supports')): parse(body, ctx + sel + '|')
            elif sel.startswith('@'): out.append((ctx + sel, norm(body)))
            else: out.extend((ctx + norm(o), norm(body)) for o in sel.split(","))
            j = k
    parse(css, ''); return out
def read(globs): return [open(f).read() for g in globs for f in glob.glob(g)]
src_dirs = lambda ext: [ROOT + 'src/**/*.' + ext] + [ROOT + 'components/' + c + '/*.' + ext for c in SOT]
main = {}
for t in read(src_dirs('css')):
    for s, b in rules(t): main.setdefault(s, set()).add(b)
mainjs = ''.join(read(src_dirs('js'))); mainhtml = ''.join(read(src_dirs('html')))
res = []
for d in sorted(glob.glob(ROOT + 'components/*/*/')):
    name = '/'.join(d.rstrip('/').split('/')[-2:])
    if name in SOT: continue
    cr = [r for t in read([d + 'component.css']) for r in rules(t)]
    js = ''.join(read([d + 'component.js'])); ht = ''.join(read([d + 'component.html']))
    jt = set(re.findall(r'[A-Za-z_][A-Za-z0-9_]{6,}', js)); tt = set(re.findall(r'[A-Za-z][A-Za-z0-9_%.\-]{3,}', re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>', ' ', ht, flags=re.S)))
    res.append(dict(component=name, css=len(cr), css_exact=round(sum(b in main.get(s, ()) for s, b in cr) / len(cr), 2) if cr else None,
        js=round(sum(t in mainjs for t in jt) / len(jt), 2) if jt else None, text=round(sum(t in mainhtml or t in mainjs for t in tt) / len(tt), 2) if tt else None))
if '--json' in sys.argv: json.dump(res, open(sys.argv[sys.argv.index('--json') + 1], 'w'), indent=1)
avg = lambda k: round(st.mean([r[k] for r in res if r[k] is not None]), 2)
print(len(res), 'copies | mean share still present in the sources of truth: css rules', avg('css_exact'), '| js identifiers', avg('js'), '| text', avg('text'))
for r in sorted(res, key=lambda r: (r['js'] if r['js'] is not None else 1))[:8]: print('  lowest js:', r)
