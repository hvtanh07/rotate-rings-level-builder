// The designer's screenshot: cyan hooks yellow; yellow carries two free arms. Yellow must not reach the hook.
import {normalize, makePiece, TYPE, placeArm} from '../src/format.js';
import {newGame, turnRing, solve} from '../src/engine.js';
const lv = normalize({id: 't', rings: []});
const Y = makePiece(lv, TYPE.RING, {position: {x: 0, y: 2.6}, colorIndex: 3}); Y.shape.gaps = [{centerDegrees: -20, widthDegrees: 47}]; lv.rings.push(Y);
const C = makePiece(lv, TYPE.RING, {position: {x: 0, y: 0}, colorIndex: 7}); C.shape.gaps = [{centerDegrees: 0, widthDegrees: 47}]; lv.rings.push(C);
const k = makePiece(lv, TYPE.CONNECTOR); lv.rings.push(k); placeArm(lv, 2, 1, 0);
for (const a of [120, -60]) {   // free yellow arms pointing out
  const r = makePiece(lv, TYPE.CONNECTOR, {colorIndex: 3}); const d = a * Math.PI / 180, L = .5;
  r.position = {x: Math.cos(d) * (1 + L / 2), y: 2.6 + Math.sin(d) * (1 + L / 2), z: 0}; r.eulerAngles.z = a; r.shape.legLength = L; r.shape.hook = true; lv.rings.push(r);
}
for (const dir of [1, -1]) {
  const g = newGame(JSON.parse(JSON.stringify(lv)));
  turnRing(g, 0, dir * 360);
  console.log('turn yellow', dir > 0 ? 'ccw' : 'cw', '-> stopped at', g.turn[0].toFixed(0), g.events.filter(e => e.type !== 'shatter').map(e => e.type + (e.by !== undefined ? ' by ' + e.by : '')).join(','), 'hook on:', g.locks.find(L => L.kind === 'arm' && L.owner === 1)?.on);
}
console.log('solvable:', solve(lv).won);
