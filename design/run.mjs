// Builds the 40 levels, playtests each one, writes design/out/*.  node design/run.mjs [from] [to]
import fs from 'fs';
import {LEVELS} from './levels40.mjs';
import {playtest} from './lib.mjs';
import {serializeFile} from '../src/format.js';

const from = +(process.argv[2] || 1), to = +(process.argv[3] || LEVELS.length);
fs.mkdirSync(new URL('./out/', import.meta.url), {recursive: true});
const out = [], rep = [];
// Difficulty: pieces to read, moves to make, how hidden the first move is, and how many moves leave you stuck.
export const score = t => +(2 * t.rings + 2.5 * t.botMoves + 40 * t.stuckRate).toFixed(1);
LEVELS.forEach((L, k) => {
  const n = k + 1; if (n < from || n > to) return;
  const {b, tutorialRing} = L.make();
  const id = `level_${String(n).padStart(3, '0')}`;
  const lv = b.build({id, tier: Math.floor((n - 1) / 10), seed: 4000 + n, tutorialRing});
  const t = playtest(lv);
  lv.difficulty = score(t);
  out.push(lv); rep.push({n, id, name: L.name, element: L.element, hard: !!L.hard, challenge: L.challenge, ...t, difficulty: lv.difficulty});
  console.log(String(n).padStart(2), (L.hard ? 'H' : ' '), L.name.padEnd(16), 'd', String(lv.difficulty).padStart(5), '| rings', t.rings, 'bot', t.botWon ? 'win' : 'STUCK', t.botMoves, 'min', t.minMoves, 'free', t.startFree,
    'traps', t.traps + '/' + t.choices, 'stuck%', Math.round(t.stuckRate * 100), 'combo', t.maxCombo, 'boom', t.booms, t.needsBomb ? 'needsBomb' : '', t.canWin ? '' : 'UNWINNABLE', t.probs.join(' / '));
});
fs.writeFileSync(new URL('./out/levels.json', import.meta.url), serializeFile(out, {}));
fs.writeFileSync(new URL('./out/report.json', import.meta.url), JSON.stringify(rep, null, 1));
fs.writeFileSync(new URL('./out/labels.json', import.meta.url), JSON.stringify(Object.fromEntries(rep.map(r => [r.id, `${r.name} · d ${r.difficulty}${r.hard ? ' · HARD' : ''}`]))));
