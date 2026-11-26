// The 40 levels, v2 (designer notes 2026-11-26): solid parts, Straight Bar + Pin, a new rule each level in 1-10, varied layouts.
// Each entry: element, hard (true on 10, 15, ... 40), challenge (the one thing the level asks of the player), make().
import {Lv, C, pol} from './lib.mjs';
const S = 0.35;                                    // arm length between two tubes
const D = (a, b) => a + b + S;                     // center distance of two rings joined by an arm
const at = (b, r, ang, c, o) => { const [x, y] = pol(r, ang, c); return b.ring(x, y, o); };
const ctr = (b, i) => ({x: b.R[i].x, y: b.R[i].y});
const nb = (b, i, ang, o = {}) => at(b, D(b.R[i].r, o.r || 1), ang, ctr(b, i), o); // new ring next to ring i, at angle ang

export const LEVELS = [];
const L = (o) => LEVELS.push(o);

/* ---------- 1-6: one new rule per level ---------- */
L({name: 'First turn', element: 'Ring', rule: 'A gap passing a hook frees it',
  challenge: 'Turn the orange ring until its gap reaches the hook. A ring with nothing left to hold shatters.', make() {
  const b = new Lv(), top = b.ring(0, 1.175, {c: C.blue, gap: 90}), bot = b.ring(0, -1.175, {c: C.orange, gap: 0});
  b.arm(top, bot); return {b, tutorialRing: bot};
}});
L({name: 'Held', element: 'Ring', rule: 'A ring whose arm hooks another cannot turn',
  challenge: 'Only the last ring turns: the others are held by their own arms. Start at the end of the chain.', make() {
  const b = new Lv(), a = b.ring(-1.88, 1.41, {c: C.green, gap: 135}), m = nb(b, a, -36.87, {c: C.blue, gap: 230}), e = nb(b, m, -36.87, {c: C.pink, gap: 300});
  b.arm(a, m).arm(m, e); return {b, tutorialRing: e};
}});
L({name: 'Flower', element: 'Ring', rule: 'One turn can free many hooks',
  challenge: 'Four petals hook the center. One long turn of the center frees them all at once.', make() {
  const b = new Lv(), c = b.ring(0, 0, {c: C.yellow, gap: 45});
  [[90, C.pink], [0, C.purple], [270, C.pink], [180, C.purple]].forEach(([a, col]) => b.arm(nb(b, c, a, {r: .8, c: col}), c));
  return {b};
}});
L({name: 'Swing', element: 'Ring', rule: 'Parts are solid: a free arm swings with its ring and bumps',
  challenge: 'Free the small ring, then the middle ring carries its arm. One way the arm hits the hook above; turn the other way.', make() {
  const b = new Lv(), m = b.ring(0, 0, {c: C.cyan, gap: 300}), h = nb(b, m, 90, {c: C.orange, gap: 30}), q = nb(b, m, 0, {r: .75, c: C.yellow, gap: 90});
  b.arm(h, m).arm(m, q); return {b};
}});
L({name: 'Bridge', element: 'Closed ring', rule: 'A closed ring has no gap: free it from its neighbours',
  challenge: 'The middle ring is closed and cannot let go of anything. Free both sides; it shatters when nothing holds it.', make() {
  const b = new Lv(), c = b.ring(0, 0, {c: C.red, closed: true}), l = nb(b, c, 180, {r: .85, c: C.blue}), r = nb(b, c, 0, {r: .85, c: C.blue});
  b.arm(c, l).arm(c, r);
  b.arm(nb(b, l, 225, {r: .7, c: C.green}), l).arm(nb(b, r, 315, {r: .7, c: C.green}), r);
  return {b};
}});
L({name: 'Make way', element: 'Ring', rule: 'Move one arm out of the way of another',
  challenge: 'The right ring cannot finish: its arm runs into the arm of the left ring. Turn the left ring first to clear the path.', make() {
  const b = new Lv(), A = b.ring(-1.175, 0, {c: C.purple, gap: 0}), B = b.ring(1.175, 0, {c: C.green, gap: 270});
  const ha = nb(b, A, 90, {r: .85, c: C.yellow, gap: 300}), hb = nb(b, B, 60, {r: .85, c: C.yellow, gap: 240}), s = nb(b, B, 0, {r: .7, c: C.pink, gap: 90});
  b.arm(ha, A).arm(hb, B).arm(A, B).arm(B, s); return {b};
}});
