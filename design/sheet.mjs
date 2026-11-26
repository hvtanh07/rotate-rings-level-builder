// Contact sheet of levels as one HTML page: node design/sheet.mjs levels.json out.html [labels.json]
import fs from 'fs';
import {drawLevel, bounds} from '../src/render.js';
import {analyze} from '../src/format.js';
const [, , src, out, lab] = process.argv;
const data = JSON.parse(fs.readFileSync(src, 'utf8'));
const labels = lab ? JSON.parse(fs.readFileSync(lab, 'utf8')) : {};
const levels = data.levels || data;
const cells = levels.map((lv, n) => {
  const b = bounds(lv), {owner, host} = analyze(lv);
  const svg = drawLevel(lv, {owner, host});
  return `<figure><svg viewBox="${b.x} ${-b.y - b.h} ${b.w} ${b.h}"><g id="view"><g transform="scale(1 -1)">${svg}</g></g></svg><figcaption><b>${n + 1}</b> ${labels[lv.id] || ''}</figcaption></figure>`;
}).join('');
fs.writeFileSync(out, `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#FFF6E6;font:13px system-ui}main{display:grid;grid-template-columns:repeat(5,240px);gap:8px;padding:8px}
figure{margin:0;background:#FFFBF2;border-radius:10px;padding:4px}svg{width:232px;height:232px}figcaption{padding:2px 4px;color:#555}
.tube,.shine,.arm,.bar,.hook,.teeth{fill:none;stroke-linecap:round}.shine{opacity:.55}.hit{fill:transparent;stroke:none}
</style><main>${cells}</main>`);
