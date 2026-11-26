// Why can't level N be won? Explore reachable states and show the one with the fewest pieces left.  node design/why.mjs N
import {LEVELS} from './levels40.mjs';
import {moves} from './lib.mjs';
import {newGame} from '../src/engine.js';
const n = +process.argv[2], L = LEVELS[n - 1], lv = L.make().b.build({id: 'x', G: L.G});
const key = g => g.alive.map(a => a ? 1 : 0).join('') + '|' + g.locks.map(L => L.on ? 1 : 0).join('') + '|' + g.turn.map(t => Math.round(((t % 360) + 360) % 360)).join(',');
let best = null, seen = new Set(), q = [{g: newGame(lv), path: []}];
while (q.length && seen.size < 8000) {
  const s = q.shift();
  const left = s.g.alive.filter(Boolean).length;
  if (!best || left < best.left) best = {left, s};
  for (const m of moves(s.g)) { const k = key(m.g); if (seen.has(k)) continue; seen.add(k); q.push({g: m.g, path: [...s.path, `${m.ring}:${Math.round(m.delta)}${m.bump ? 'b' : ''}${m.boom ? '!' : ''}`]}); }
}
const g = best.s.g, R = lv.rings;
console.log('states', seen.size, 'best left', best.left, 'path', best.s.path.join(' '));
console.log('left:', R.map((r, i) => g.alive[i] ? `${i}:${r.shape.id}${r.locked && !g.open[i] ? '(locked)' : ''}` : '').filter(Boolean).join(' '));
console.log('locks on:', g.locks.filter(L => L.on).map(L => `${L.kind} ${R[L.piece].shape.id}->${R[L.ring].shape.id}`).join(' | '));
