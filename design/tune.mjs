// Try random gap angles for level N's open rings; print the winnable layouts a random player finds hardest.
// node design/tune.mjs N [tries] [ring,ring,...]   (rings to tune; default: all open rings without a fixed gap)
import {LEVELS} from './levels40.mjs';
import {moves, winnable} from './lib.mjs';
import {newGame, won} from '../src/engine.js';
import {wrap180} from '../src/format.js';
const n = +process.argv[2], tries = +(process.argv[3] || 200), L = LEVELS[n - 1], {b} = L.make();
const pick = process.argv[4] ? process.argv[4].split(',').map(Number) : b.R.map((q, i) => (!q.closed && q.gap === undefined && !q.gaps) ? i : -1).filter(i => i >= 0);
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const res = [];
for (let t = 0; t < tries; t++) {
  const G = {...(L.G || {})};
  for (const i of pick) {
    const hold = [...b.holds(i), ...b.tails(i)];
    let a, ok = false;
    for (let k = 0; k < 40 && !ok; k++) { a = Math.floor(rnd() * 72) * 5; ok = hold.every(h => Math.abs(wrap180(a - h)) > 30); }
    G[i] = a;
  }
  const lv = b.build({id: 'x', G});
  let win; try { win = winnable(newGame(JSON.parse(JSON.stringify(lv))), new Map(), 0, 15000); } catch { continue; }
  if (!win) continue;
  let s2 = 3, tot = 0, bumps = 0, stuck = 0; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 60; run++) {
    let g = newGame(JSON.parse(JSON.stringify(lv))), m = 0;
    while (!won(g) && m < 200) { const ms = moves(g); if (!ms.length) break; const x = ms[Math.floor(r2() * ms.length)]; if (x.bump) bumps++; g = x.g; m++; }
    tot += m; if (!won(g)) stuck++;
  }
  res.push({G: Object.fromEntries(pick.map(i => [i, G[i]])), rand: +(tot / 60).toFixed(1), bump: +(bumps / 60).toFixed(1), stuck: +(stuck / 60).toFixed(2), score: +(tot / 60 + 40 * stuck / 60).toFixed(1)});
}
res.sort((a, b) => b.score - a.score);
console.log('winnable', res.length, '/', tries);
for (const r of res.slice(0, 5)) console.log(JSON.stringify(r));
if (res.length) console.log('median', JSON.stringify(res[Math.floor(res.length / 2)]));
