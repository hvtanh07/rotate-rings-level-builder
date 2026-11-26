// node design/dbg.mjs N "ring:delta,ring:delta" : play moves, then list the next moves and whether each can still win
import {LEVELS} from './levels40.mjs';
import {moves, winnable} from './lib.mjs';
import {newGame, turnRing, canTurn} from '../src/engine.js';
const n = +process.argv[2], L = LEVELS[n - 1], lv = L.make().b.build({id: 'x'});
let g = newGame(lv);
for (const m of (process.argv[3] || '').split(',').filter(Boolean)) { const [i, d] = m.split(':').map(Number); turnRing(g, i, d); console.log('turn', i, d, g.events.map(e => e.type + ':' + (e.piece ?? '') + (e.hit !== undefined ? '>' + e.hit : '')).join(' ')); }
console.log('alive', g.alive.map((a, i) => a ? i : '').filter(x => x !== '').join(','));
for (const m of moves(g)) console.log('move', m.ring, Math.round(m.delta), m.bump ? 'BUMP' : '', 'boom', m.boom, 'cleared', m.cleared, 'win?', winnable(m.g), 'alive', m.g.alive.map((a, i) => a ? i : '').filter(x => x !== '').join(','));
