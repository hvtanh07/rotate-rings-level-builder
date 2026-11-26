// Builds the 40 levels, playtests each one, writes design/out/*.  node design/run.mjs [from] [to]
import fs from 'fs';
import {LEVELS} from './levels40.mjs';
import {playtest, score} from './lib.mjs';
import {serializeFile, suggestTime} from '../src/format.js';

const from = +(process.argv[2] || 1), to = +(process.argv[3] || LEVELS.length);
fs.mkdirSync(new URL('./out/', import.meta.url), {recursive: true});
const out = [], rep = [];
LEVELS.forEach((L, k) => {
  const n = k + 1; if (n < from || n > to) return;
  const {b, tutorialRing} = L.make();
  const id = `level_${String(n).padStart(3, '0')}`;
  const lv = b.build({id, tier: Math.floor((n - 1) / 10), seed: 4000 + n, tutorialRing, G: L.G});
  const t = playtest(lv);
  lv.difficulty = score(t); lv.timeLimit = suggestTime(lv.difficulty);
  out.push(lv); rep.push({n, id, name: L.name, element: L.element, hard: !!L.hard, challenge: L.challenge, ...t, difficulty: lv.difficulty});
  console.log(String(n).padStart(2), (L.hard ? 'H' : ' '), L.name.padEnd(16), 'd', String(lv.difficulty).padStart(5), '| rings', t.rings, 'bot', t.botWon ? 'win' : 'STUCK', t.botMoves, 'min', t.minMoves, 'free', t.startFree,
    'traps', t.traps + '/' + t.choices, 'stuck%', Math.round(t.stuckRate * 100), 'combo', t.maxCombo, 'boom', t.booms, t.needsBomb ? 'needsBomb' : '', t.canWin ? '' : 'UNWINNABLE', t.probs.join(' / '));
});
const part = process.argv[4];  // optional: write a part file, merged later by merge.mjs
if (part) { fs.writeFileSync(new URL(`./out/part_${part}.json`, import.meta.url), JSON.stringify({out, rep})); process.exit(0); }
fs.writeFileSync(new URL('./out/levels.json', import.meta.url), serializeFile(out, {}));
fs.writeFileSync(new URL('./out/report.json', import.meta.url), JSON.stringify(rep, null, 1));
fs.writeFileSync(new URL('./out/labels.json', import.meta.url), JSON.stringify(Object.fromEntries(rep.map(r => [r.id, `${r.name} · d ${r.difficulty}${r.hard ? ' · HARD' : ''}`]))));
