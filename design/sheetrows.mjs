// Sheet rows (Id, Level) for the Level Config tab: one compact JSON per cell, floats cut to 6 significant digits.
import fs from 'fs';
import {compact} from '../src/format.js';
const d = JSON.parse(fs.readFileSync(new URL('./out/levels.json', import.meta.url)));
const cut = v => typeof v === 'number' && !Number.isInteger(v) ? +v.toPrecision(6) : Array.isArray(v) ? v.map(cut) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cut(x)])) : v;
const rows = d.levels.map((lv, i) => [String(i + 1), JSON.stringify(cut(JSON.parse(compact(lv))))]);
fs.writeFileSync(new URL('./out/sheet_rows.json', import.meta.url), JSON.stringify(rows));
console.log(rows.map(r => r[1].length).join(' '), 'total', rows.reduce((s, r) => s + r[1].length, 0));
