#!/usr/bin/env node
// Proves that chunks reproduce the original source byte for byte.
// usage: node jev/tools/check-units.mjs --kind html|css|js --orig <file> --units g/a,g/b,g/c
import fs from 'node:fs';
import { concatUnits } from '../lib/units.mjs';
const arg = (n) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const kind = arg('kind'), orig = fs.readFileSync(arg('orig'), 'utf8'), units = arg('units').split(',');
const got = concatUnits(units, kind);
if (got === orig) { console.log(`OK  ${kind}: ${units.length} units reproduce ${orig.length} chars exactly`); process.exit(0); }
let i = 0; while (i < got.length && i < orig.length && got[i] === orig[i]) i++;
console.log(`DIFF ${kind}: chunks ${got.length} chars vs original ${orig.length}; first difference at ${i}`);
console.log(' original:', JSON.stringify(orig.slice(Math.max(0, i - 60), i + 60)));
console.log(' chunks  :', JSON.stringify(got.slice(Math.max(0, i - 60), i + 60)));
process.exit(1);
