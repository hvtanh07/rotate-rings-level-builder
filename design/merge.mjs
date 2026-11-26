// Merges design/out/part_*.json (from run.mjs from to name) into levels.json, report.json, labels.json.  node design/merge.mjs a b c ...
import fs from 'fs';
import {serializeFile} from '../src/format.js';
const out = [], rep = [];
for (const p of process.argv.slice(2)) { const j = JSON.parse(fs.readFileSync(new URL(`./out/part_${p}.json`, import.meta.url))); out.push(...j.out); rep.push(...j.rep); }
const o = rep.map((r, i) => [r.n, i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
const O = o.map(i => out[i]), R = o.map(i => rep[i]);
fs.writeFileSync(new URL('./out/levels.json', import.meta.url), serializeFile(O, {}));
fs.writeFileSync(new URL('./out/report.json', import.meta.url), JSON.stringify(R, null, 1));
fs.writeFileSync(new URL('./out/labels.json', import.meta.url), JSON.stringify(Object.fromEntries(R.map(r => [r.id, `${r.name} · d ${r.difficulty}${r.hard ? ' · HARD' : ''}`]))));
console.log('merged', R.length, R.map(r => r.n).join(','));
