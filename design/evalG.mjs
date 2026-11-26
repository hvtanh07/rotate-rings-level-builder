// Playtest level N with each gap set listed in a tune output file: node design/evalG.mjs N design/out/tN.txt
import fs from 'fs';
import {LEVELS} from './levels40.mjs';
import {playtest, score} from './lib.mjs';
const n = +process.argv[2], L = LEVELS[n - 1];
const Gs = fs.readFileSync(process.argv[3], 'utf8').split('\n').filter(l => l.startsWith('{') || l.startsWith('median')).map(l => JSON.parse(l.replace(/^median /, '')).G);
for (const G0 of Gs) {
  const G = {...(L.G || {}), ...G0}, lv = L.make().b.build({id: 'x', G}), t = playtest(lv);
  console.log(JSON.stringify(G0), 'd', score(t), 'min', t.minMoves, 'stuck', t.stuckRate, t.canWin ? '' : 'UNWINNABLE');
}
