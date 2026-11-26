// The 40 new levels. Each entry: element, hard (true on 10, 15, ... 40), challenge (the one thing the level asks of the player), make().
import {Lv, C, pol} from './lib.mjs';
const D = (a, b) => a + b + 0.6;                 // center distance of two rings joined by a connector
const at = (b, r, ang, c, o) => { const [x, y] = pol(r, ang, c); return b.ring(x, y, o); };
const ctr = (b, i) => ({x: b.R[i].x, y: b.R[i].y});

export const LEVELS = [];
const L = (o) => LEVELS.push(o);

/* ---------- 1-6: rings, connectors, closed ring ---------- */
L({name: 'First turn', element: 'Ring', challenge: 'Learn to turn: turn the orange ring until its gap reaches the connector.', make() {
  const b = new Lv();
  const top = b.ring(0, 1.3, {c: C.blue, gap: 90}), bot = b.ring(0, -1.3, {c: C.orange, gap: 0});
  b.arm(top, bot); return {b, tutorialRing: bot};
}});
L({name: 'Three hooks', element: 'Ring', challenge: 'One ring holds three: keep turning the middle ring and all four clear in one move.', make() {
  const b = new Lv(), c = b.ring(0, 0, {c: C.yellow});
  for (const [k, a] of [90, 210, 330].entries()) b.arm(at(b, D(1, .85), a, {x: 0, y: 0}, {r: .85, c: [C.blue, C.pink, C.green][k]}), c);
  return {b};
}});
L({name: 'Staircase', element: 'Ring', challenge: 'Order: only the top ring is free. Work down the steps.', make() {
  const b = new Lv(), s = D(1, 1) / Math.SQRT2;
  const a = b.ring(-s, -s, {c: C.green}), m = b.ring(0, 0, {c: C.blue}), t = b.ring(s, s, {c: C.pink});
  b.arm(a, m).arm(m, t); return {b};
}});
L({name: 'Cross', element: 'Ring', challenge: 'Save the center for last: free the two rings it holds, then one turn of the center clears three.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, c = b.ring(0, 0, {c: C.purple});
  const n = at(b, D(1, .8), 90, o, {r: .8, c: C.yellow}), e = at(b, D(1, .8), 0, o, {r: .8, c: C.cyan}),
    s = at(b, D(1, .8), 270, o, {r: .8, c: C.yellow}), w = at(b, D(1, .8), 180, o, {r: .8, c: C.cyan});
  b.arm(c, n).arm(c, s).arm(e, c).arm(w, c); return {b};
}});
L({name: 'No gap', element: 'Closed ring', challenge: 'A closed ring cannot free anything itself. Free it from the rings around it.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, c = b.ring(0, 0, {r: 1.1, c: C.cyan, closed: true});
  [90, 210, 330].forEach((a, k) => {
    const p = at(b, D(1.1, .85), a, o, {r: .85, c: C.orange}); b.arm(c, p);
    const q = at(b, D(1.1, .85) + D(.85, .7), a, o, {r: .7, c: C.pink}); b.arm(q, p);
  });
  return {b};
}});
L({name: 'Snowflake', element: 'Ring', challenge: 'Start from the middle: the center frees the three arms, then each arm frees its tip.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, c = b.ring(0, 0, {c: C.blue});
  [90, 210, 330].forEach(a => {
    const i = at(b, D(1, .8), a, o, {r: .8, c: C.green}); b.arm(i, c);
    const t = at(b, D(1, .8) + D(.8, .7), a, o, {r: .7, c: C.yellow}); b.arm(t, i);
  });
  return {b};
}});

/* ---------- 7-11: Pin (unlocks at 7) ---------- */
L({name: 'Pin', element: 'Pin (new)', challenge: 'Meet the pin: it holds the green ring. Keep turning until the gap passes it.', make() {
  const b = new Lv(), p = b.ring(0, 0, {c: C.green, gap: 90});
  b.arm(b.ring(-D(1, 1), 0, {c: C.blue}), p).arm(b.ring(D(1, 1), 0, {c: C.blue}), p).pin(p, 270); return {b, tutorialRing: p};
}});
L({name: 'Pinned hub', element: 'Pin', challenge: 'A pinned ring with arms cannot turn yet: free its arms first, then turn it past the pin.', make() {
  const b = new Lv(), d = D(1, 1), p = b.ring(0, 0, {c: C.yellow});
  b.arm(p, b.ring(-d, 0, {c: C.purple})).arm(p, b.ring(d, 0, {c: C.purple})).arm(b.ring(0, -d, {c: C.cyan}), p).pin(p, 90); return {b};
}});
L({name: 'Square', element: 'Pin', challenge: 'Two pins on the center: free its two arms, then one long turn of the center, then the corners free their tips.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, q = b.ring(0, 0, {r: 1.1, c: C.orange}), d = D(1.1, .85);
  const tl = at(b, d, 135, o, {r: .85, c: C.blue}), tr = at(b, d, 45, o, {r: .85, c: C.green}),
    bl = at(b, d, 225, o, {r: .85, c: C.green}), br = at(b, d, 315, o, {r: .85, c: C.blue});
  b.arm(tl, q).arm(br, q).arm(q, tr).arm(q, bl).pin(q, 0).pin(q, 180);
  [[tl, 135], [tr, 45], [bl, 225], [br, 315]].forEach(([c, a]) => b.arm(at(b, d + D(.85, .65), a, o, {r: .65, c: C.pink}), c));
  return {b};
}});
L({name: 'Crystal', element: 'Pin', hard: true, challenge: 'Find the one free ring among 13, then follow two chains around the crystal to the last ring.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, c = b.ring(0, 0, {c: C.yellow}), I = [], O = [];
  for (let k = 0; k < 6; k++) I.push(at(b, D(1, .8) + .2, 90 + 60 * k, o, {r: .8, c: k % 2 ? C.cyan : C.blue}));
  for (let k = 0; k < 6; k++) { O.push(at(b, D(1, .8) + .2 + D(.8, .65), 90 + 60 * k, o, {r: .65, c: C.pink})); b.arm(O[k], I[k]); }
  b.arm(I[1], I[0]).arm(I[5], I[0]).arm(I[2], I[1]).arm(I[4], I[5]).arm(I[3], I[2]).arm(I[3], I[4]).arm(c, I[3]);
  b.pin(I[2], 90 + 120 + 60).pin(I[4], 90 + 240 - 60);
  return {b};
}});
L({name: 'Heart', element: 'Pin', challenge: 'Breather: one turn of the heart tip frees both lobes, then the lobes free their buds.', make() {
  const b = new Lv(), l = b.ring(-1.25, 1, {c: C.pink}), r = b.ring(1.25, 1, {c: C.pink}), m = b.ring(0, -1.3, {c: C.red, r: 1});
  b.arm(l, m).arm(r, m).pin(m, 270);
  b.arm(at(b, D(1, .65), 150, ctr(b, l), {r: .65, c: C.purple}), l).arm(at(b, D(1, .65), 30, ctr(b, r), {r: .65, c: C.purple}), r);
  return {b};
}});

/* ---------- 12-16: Bomb (unlocks at 12) ---------- */
const NEAR = 2.15; // center distance at which a bomb on one ring touches the next ring
L({name: 'Boom', element: 'Bomb (new)', challenge: 'Meet the bomb: two pinned closed rings can never be freed by turning. Turn the bomb into the other ring.', make() {
  const b = new Lv(), x = b.ring(0, NEAR / 2, {c: C.blue, closed: true}), h = b.ring(0, -NEAR / 2, {c: C.orange, closed: true});
  b.pin(x, 90).pin(h, 270).bomb(h, 0); return {b, tutorialRing: h};
}});
L({name: 'Aim', element: 'Bomb', challenge: 'Aim: the bomb can reach the stuck blue ring or the free green ring. Hit the green one and blue stays stuck.', make() {
  const b = new Lv(), h = b.ring(0, 0, {c: C.orange, closed: true}), x = b.ring(NEAR, 0, {c: C.blue, closed: true}), y = b.ring(-NEAR, 0, {c: C.green, gap: 180});
  b.pin(h, 270).pin(x, 0).pin(y, 90).bomb(h, 90);
  b.arm(at(b, D(1, .7), 135, ctr(b, y), {r: .7, c: C.yellow}), y).arm(at(b, D(1, .7), 225, ctr(b, y), {r: .7, c: C.yellow}), y);
  return {b};
}});
L({name: 'Free the bomber', element: 'Bomb', challenge: 'The bomb ring is held by its own arm. Free it, then turn it the right way: the wrong way frees the pin first and the bomb is lost.', make() {
  const b = new Lv(), h = b.ring(0, 0, {c: C.orange, gap: 300}), x = b.ring(0, NEAR, {c: C.blue, closed: true}), s = b.ring(0, -D(1, 1), {c: C.green});
  b.arm(h, s).pin(h, 180).pin(x, 90).bomb(h, 0);
  b.arm(b.ring(-D(1, 1), -D(1, 1), {c: C.yellow}), s).arm(b.ring(D(1, 1), -D(1, 1), {c: C.yellow}), s);
  return {b};
}});
L({name: 'Butterfly', element: 'Bomb', hard: true, challenge: 'Two knots, two bombs, mirrored wings: each bomb must turn the opposite way, or clear the middle ring first so neither can miss.', make() {
  const b = new Lv(), m = b.ring(0, 0, {c: C.yellow});
  const h1 = b.ring(-NEAR, 0, {c: C.orange, gap: 330}), h2 = b.ring(NEAR, 0, {c: C.orange, gap: 210});
  const x1 = b.ring(-2 * NEAR, 0, {c: C.purple, closed: true}), x2 = b.ring(2 * NEAR, 0, {c: C.purple, closed: true});
  const a1 = at(b, D(1, .75), 60, ctr(b, h1), {r: .75, c: C.cyan}), a2 = at(b, D(1, .75), 120, ctr(b, h2), {r: .75, c: C.cyan});
  b.arm(h1, a1).arm(h2, a2);
  b.pin(m, 90).pin(h1, 270).pin(h2, 270).pin(x1, 180).pin(x2, 0).bomb(h1, 120).bomb(h2, 60);
  return {b};
}});
L({name: 'Necklace', element: 'Ring', challenge: 'Breather: every other bead is free. Each turn frees two neighbours halfway; the last turns clear the whole necklace.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, R = D(.85, .85) / (2 * Math.sin(Math.PI / 6)), B = [];
  for (let k = 0; k < 6; k++) B.push(at(b, R, 90 + 60 * k, o, {r: .85, c: k % 2 ? C.cyan : C.pink}));
  for (let k = 0; k < 6; k += 2) b.arm(B[k], B[(k + 1) % 6]).arm(B[k], B[(k + 5) % 6]);
  return {b};
}});

/* ---------- 17-21: Locked Ring (unlocks at 17) ---------- */
L({name: 'Key', element: 'Locked Ring (new)', challenge: 'Meet the lock: the blue ring only shakes. Break the yellow ring that holds its key first.', make() {
  const b = new Lv(), lk = b.ring(0, 0, {c: C.blue}), k = b.ring(D(1, 1), 0, {c: C.yellow}), t = b.ring(-D(1, 1), 0, {c: C.pink});
  b.arm(lk, k).arm(t, lk).lock(lk, k); return {b, tutorialRing: k};
}});
L({name: 'Totem', element: 'Locked Ring', challenge: 'The key sits two steps down the totem. Work from the bottom up to reach it.', make() {
  const b = new Lv(), d = D(1, 1), s = b.ring(0, -d, {c: C.green}), k = b.ring(0, 0, {c: C.yellow}), lk = b.ring(0, d, {c: C.blue}), t = b.ring(0, 2 * d, {c: C.pink, r: .8});
  b.arm(k, s).pin(s, 270).arm(t, lk).lock(lk, k);
  b.arm(b.ring(-d, 0, {c: C.orange, r: .85}), k).arm(b.ring(d, 0, {c: C.orange, r: .85}), k);
  b.arm(at(b, D(1, .7), 160, ctr(b, lk), {r: .7, c: C.purple}), lk).arm(at(b, D(1, .7), 20, ctr(b, lk), {r: .7, c: C.purple}), lk);
  return {b};
}});
L({name: 'Two locks', element: 'Locked Ring', challenge: 'A key opens a lock that holds the next key: open the locks in the right order.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, R = D(1, 1) / Math.sqrt(3), T = [];
  for (const a of [270, 150, 30]) T.push(at(b, R, a, o, {c: [C.yellow, C.blue, C.cyan][T.length]}));
  const [k, l2, l1] = T;
  T.forEach((t, j) => { const q = at(b, R + D(1, .75), [270, 150, 30][j], o, {r: .75, c: C.pink}); if (j) b.arm(q, t); else b.arm(t, q).pin(q, 270); });
  b.pin(k, 330).lock(l2, k).lock(l1, l2);
  return {b};
}});
L({name: 'Vault', element: 'Lock + Bomb', hard: true, challenge: 'The bomb ring is locked: dig out its key on the left, then aim up at the stuck ring, not down at the free one.', make() {
  const b = new Lv(), d = D(1, 1);
  const h = b.ring(0, 0, {c: C.orange, closed: true}), x = b.ring(0, NEAR, {c: C.purple, closed: true}), y = b.ring(0, -NEAR, {c: C.green, gap: 225});
  const k = b.ring(-d, 0, {c: C.yellow}), s = b.ring(-d, d, {c: C.cyan, r: .85}), p = b.ring(-d, -d, {c: C.cyan, r: .85});
  const e = b.ring(d, 0, {c: C.blue}), f = b.ring(d, d, {c: C.pink, r: .85}), g = b.ring(d, -d, {c: C.pink, r: .85});
  b.pin(h, 0).pin(x, 135).pin(y, 270).bomb(h, 180).lock(h, k);
  b.arm(k, s).arm(p, k).arm(e, f).arm(g, e).arm(y, g).pin(f, 90).pin(s, 90);
  b.arm(at(b, D(.85, .7), 270, ctr(b, p), {r: .7, c: C.blue}), p);
  b.arm(at(b, D(.85, .7), 270, ctr(b, g), {r: .7, c: C.pink}), g);
  b.arm(at(b, D(1, .7), 90, ctr(b, x), {r: .7, c: C.red}), x);
  return {b};
}});
L({name: 'Clover', element: 'Pin', challenge: 'Breather: four leaves, each pinned. Turn each leaf past its pin.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, c = b.ring(0, 0, {c: C.green, r: .8});
  [45, 135, 225, 315].forEach(a => { const l = at(b, D(.8, 1), a, o, {c: C.green}); b.arm(c, l).pin(l, a); });
  return {b};
}});

/* ---------- 22-26: Gear Ring (unlocks at 22) ---------- */
L({name: 'Gears', element: 'Gear Ring (new)', challenge: 'Meet the gears: turn one and the other turns the opposite way. One turn frees both pins and the ring below.', make() {
  const b = new Lv(), a = b.ring(-D(1, 1) / 2, 0, {c: C.orange, gap: 90}), g = b.ring(D(1, 1) / 2, 0, {c: C.green, gap: 90});
  b.gear(a, g).pin(a, 180).pin(g, 0);
  const u = b.ring(0, -2.45, {c: C.blue, r: .8}); b.arm(u, a).arm(u, g);
  return {b, tutorialRing: a};
}});
L({name: 'Partner', element: 'Gear Ring', challenge: 'The orange gear looks free but will not turn: its partner still has an arm out. Free the partner first.', make() {
  const b = new Lv(), d = D(1, 1), a = b.ring(-d / 2, 0, {c: C.orange}), g = b.ring(d / 2, 0, {c: C.green}), s = b.ring(d / 2 + d, 0, {c: C.yellow});
  b.gear(a, g).pin(a, 180).pin(g, 270).arm(g, s);
  b.arm(at(b, D(1, .75), 100, ctr(b, a), {r: .75, c: C.pink}), a).arm(at(b, D(1, .75), 80, ctr(b, s), {r: .75, c: C.pink}), s);
  return {b};
}});
L({name: 'Gear train', element: 'Gear Ring', challenge: 'Three gears: the middle one turns the other way. Free the top rings, then pick the direction that frees all three pins in one turn.', make() {
  const b = new Lv(), d = D(1, 1), A = b.ring(-d, 0, {c: C.cyan, gap: 90}), B = b.ring(0, 0, {c: C.purple, gap: 270}), Cc = b.ring(d, 0, {c: C.cyan, gap: 90});
  b.gear(A, B).gear(B, Cc).pin(A, 180).pin(B, 0 + 180 + 180).pin(Cc, 0);
  const t = b.ring(0, d, {c: C.yellow}), t2 = b.ring(0, d + D(1, .8), {c: C.red, r: .8}); b.arm(B, t).arm(t, t2).pin(t, 0).pin(t2, 90);
  b.arm(at(b, D(1, .75), 240, ctr(b, A), {r: .75, c: C.pink}), A).arm(at(b, D(1, .75), 300, ctr(b, Cc), {r: .75, c: C.pink}), Cc);
  return {b};
}});
L({name: 'Mirror bomb', element: 'Gear + Bomb + Lock', hard: true, challenge: 'The bomb rides the green gear, which turns opposite to the gear you drag. Unlock the gears, then aim the bomb right at the stuck ring, not left or down.', make() {
  const b = new Lv(), d = D(1, 1);
  const a = b.ring(-d / 2, 0, {c: C.orange, gap: 315}), g = b.ring(d / 2, 0, {c: C.green, gap: 225});
  const x = b.ring(d / 2 + NEAR, 0, {c: C.purple, closed: true}), y = b.ring(d / 2, -NEAR, {c: C.blue, gap: 300});
  const k = b.ring(-d / 2 - d, 0, {c: C.yellow}), s = b.ring(-d / 2 - d, d, {c: C.cyan, r: .85}), p = b.ring(-d / 2 - d, -d, {c: C.cyan, r: .85});
  const z = b.ring(d / 2 + d, -NEAR - .2, {c: C.pink, r: .85});
  b.gear(a, g).lock(a, k).pin(a, 90).pin(g, 270 + 30).pin(x, 0).bomb(g, 90);
  b.arm(k, s).arm(p, k).pin(s, 90).arm(y, z).pin(z, 0).arm(at(b, D(1, .75), 270, ctr(b, p), {r: .75, c: C.pink}), p).arm(at(b, D(1, .75), 90, ctr(b, s), {r: .75, c: C.pink}), s);
  return {b};
}});
L({name: 'Sun', element: 'Ring', challenge: 'Breather: eight rays hook the sun. One long turn clears all nine.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, c = b.ring(0, 0, {c: C.yellow, r: 1.2, gap: 0, gw: 18});
  for (let k = 0; k < 8; k++) b.arm(at(b, D(1.2, .6), 22.5 + 45 * k, o, {r: .6, c: k % 2 ? C.orange : C.red}), c);
  return {b};
}});

/* ---------- 27-31 ---------- */
L({name: 'Locked necklace', element: 'Locked Ring', challenge: 'The locked bead hides its key across the necklace: clear the far side first.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, R = D(.85, .85) / (2 * Math.sin(Math.PI / 6)), B = [];
  for (let k = 0; k < 6; k++) B.push(at(b, R, 90 + 60 * k, o, {r: .85, c: k % 2 ? C.yellow : C.blue}));
  for (let k = 0; k < 6; k += 2) b.arm(B[k], B[k + 1]).arm(B[k], B[(k + 5) % 6]);
  b.pin(B[1], 150).pin(B[5], 30).lock(B[3], B[0]);
  return {b};
}});
L({name: 'Hooked knot', element: 'Bomb', challenge: 'Two rings hook a closed ring and can never let go. Free the bomb ring, then aim up, not down.', make() {
  const b = new Lv(), d = D(1, 1);
  const c = b.ring(0, NEAR, {c: C.purple, closed: true}), a1 = b.ring(-d, NEAR, {c: C.pink}), a2 = b.ring(d, NEAR, {c: C.pink});
  const h = b.ring(0, 0, {c: C.orange, gap: 270}), s = b.ring(d, 0, {c: C.cyan, r: 1}), y = b.ring(0, -NEAR, {c: C.green, gap: 270});
  b.arm(a1, c).arm(a2, c).arm(h, s).pin(h, 180).pin(s, 0).bomb(h, 30).pin(y, 0);
  b.arm(b.ring(-d, -NEAR, {c: C.yellow}), y);
  return {b};
}});
L({name: 'Locked gear', element: 'Gear + Lock', challenge: 'The middle gear is locked, so the whole train is stuck. Get the key from the top, then one turn frees the train.', make() {
  const b = new Lv(), d = D(1, 1), A = b.ring(-d, 0, {c: C.cyan}), B = b.ring(0, 0, {c: C.purple}), Cc = b.ring(d, 0, {c: C.cyan});
  const k = b.ring(0, d, {c: C.yellow}), t = b.ring(0, 2 * d, {c: C.pink, r: .8});
  b.gear(A, B).gear(B, Cc).lock(B, k).arm(k, t).pin(t, 90).pin(A, 180).pin(Cc, 0).pin(B, 270);
  b.arm(at(b, D(1, .75), 250, ctr(b, A), {r: .75, c: C.green}), A).arm(at(b, D(1, .75), 290, ctr(b, Cc), {r: .75, c: C.green}), Cc);
  return {b};
}});
L({name: 'Twin vault', element: 'Bomb + Lock + Gear', hard: true, challenge: 'Two bombs, two knots: one bomb ring is locked, the other rides a gear that turns opposite to your drag. Each has a wrong neighbour to miss.', make() {
  const b = new Lv(), d = D(1, 1);
  const x1 = b.ring(-2 * NEAR, 0, {c: C.purple, closed: true}), h1 = b.ring(-NEAR, 0, {c: C.orange, closed: true}), m = b.ring(0, 0, {c: C.yellow, gap: 270});
  const k1 = b.ring(-NEAR, -d, {c: C.blue}), p1 = b.ring(-NEAR, -2 * d, {c: C.blue, r: .8});
  const g1 = b.ring(d, 0, {c: C.green, gap: 180}), g2 = b.ring(2 * d, 0, {c: C.green, gap: 180});
  const x2 = b.ring(2 * d, NEAR, {c: C.purple, closed: true}), y2 = b.ring(2 * d, -NEAR, {c: C.pink, gap: 0}), z2 = b.ring(d, -NEAR - .3, {c: C.pink, r: .8});
  const t1 = b.ring(d, d, {c: C.cyan, r: .85});
  b.pin(x1, 180).pin(h1, 270).bomb(h1, 90).lock(h1, k1).arm(k1, p1).pin(p1, 270);
  b.pin(m, 90).arm(b.ring(0, d, {c: C.red, r: .8}), m);
  b.gear(g1, g2).arm(g1, t1).pin(t1, 90).pin(g1, 300).pin(g2, 330).bomb(g2, 0).pin(x2, 90).arm(y2, z2).pin(z2, 225);
  return {b};
}});
L({name: 'Pinwheel', element: 'Pin', challenge: 'Breather: four blades hook a pinned hub. One turn clears the whole pinwheel.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, c = b.ring(0, 0, {c: C.orange, gap: 0, gw: 30});
  [0, 90, 180, 270].forEach((a, k) => { const r = at(b, D(1, .85), a + 45, o, {r: .85, c: k % 2 ? C.blue : C.cyan}); b.arm(r, c); });
  b.pin(c, 180 + 45 + 45);
  return {b};
}});

/* ---------- 32-36 ---------- */
L({name: 'Key chain', element: 'Locked Ring', challenge: 'Three locks in a ring: each one you open drops the key for the next. Start in the middle.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, R = D(.9, .9) / (2 * Math.sin(Math.PI / 6)), B = [];
  for (let k = 0; k < 6; k++) B.push(at(b, R, 90 + 60 * k, o, {r: .9, c: k % 2 ? C.blue : C.orange}));
  const c = b.ring(0, 0, {c: C.yellow, r: .8});
  for (let k = 0; k < 6; k += 2) b.arm(B[k], B[k + 1]).arm(B[k], B[(k + 5) % 6]);
  b.pin(c, 90).lock(B[1], c).lock(B[3], B[1]).lock(B[5], B[3]);
  return {b};
}});
L({name: 'Gear loop', element: 'Gear Ring', challenge: 'Four gears in a loop turn as one, but one gear has an arm out. Free it, then one turn frees all four.', make() {
  const b = new Lv(), h = D(1, 1) / 2, G = [[-h, h], [h, h], [h, -h], [-h, -h]].map(([x, y], k) => b.ring(x, y, {c: k % 2 ? C.green : C.orange}));
  b.gear(G[0], G[1]).gear(G[1], G[2]).gear(G[2], G[3]).gear(G[3], G[0]);
  [135, 45, 315, 225].forEach((a, k) => b.pin(G[k], a));
  const s = at(b, D(1, .8), 45, ctr(b, G[1]), {r: .8, c: C.yellow}); b.pin(G[1], 0);
  b.arm(G[1], s).arm(at(b, D(1, .8), 225, ctr(b, G[3]), {r: .8, c: C.pink}), G[3]);
  return {b};
}});
L({name: 'Short fuse', element: 'Bomb', challenge: 'The short way frees the bomb ring before the bomb lands. Go the long way, after clearing the ring in its path.', make() {
  const b = new Lv(), d = D(1, 1);
  const h = b.ring(0, 0, {c: C.orange, gap: 145}), x = b.ring(NEAR, 0, {c: C.purple, closed: true}), y = b.ring(-NEAR, 0, {c: C.green, gap: 180});
  const z = b.ring(-NEAR, -d, {c: C.cyan}), w = b.ring(-NEAR, d, {c: C.cyan});
  b.pin(h, 120).bomb(h, 60).pin(x, 0).arm(y, z).arm(w, y).pin(z, 270);
  return {b};
}});
L({name: 'Clockwork', element: 'Gear + Bomb + Lock', hard: true, challenge: 'Two bombs ride the outer gears, which turn the same way as each other: one turn can only aim one of them. Unlock the train, aim the first, then the second.', make() {
  const b = new Lv(), d = D(1, 1);
  const A = b.ring(-d, 0, {c: C.orange, closed: true}), B = b.ring(0, 0, {c: C.purple, gap: 90}), Cc = b.ring(d, 0, {c: C.orange, closed: true});
  const x1 = b.ring(-d - NEAR, 0, {c: C.blue, closed: true}), x2 = b.ring(d + NEAR, 0, {c: C.blue, closed: true});
  const k = b.ring(0, d, {c: C.yellow}), t = b.ring(0, 2 * d, {c: C.pink, r: .8});
  b.arm(b.ring(-d, d + .4, {c: C.cyan, r: .8}), k).arm(b.ring(d, d + .4, {c: C.cyan, r: .8}), k);
  const y1 = b.ring(-d, -NEAR, {c: C.green}), y2 = b.ring(d, -NEAR, {c: C.green});
  b.gear(A, B).gear(B, Cc).lock(B, k).arm(k, t).pin(t, 90).pin(A, 270 - 40).pin(Cc, 270 + 40).pin(B, 90 + 60);
  b.bomb(A, 90).bomb(Cc, 90).pin(x1, 180).pin(x2, 0).arm(y1, x1).arm(y2, x2);
  b.arm(at(b, D(1, .7), 120, ctr(b, x1), {r: .7, c: C.red}), x1).arm(at(b, D(1, .7), 60, ctr(b, x2), {r: .7, c: C.red}), x2);
  return {b};
}});
L({name: 'Twin flowers', element: 'Ring', challenge: 'Breather: two flowers, each cleared by one turn of its center.', make() {
  const b = new Lv();
  for (const [cx, c1, c2] of [[-2.6, C.pink, C.yellow], [2.6, C.blue, C.cyan]]) {
    const c = b.ring(cx, 0, {c: c1, r: .9});
    [90, 210, 330].forEach(a => b.arm(at(b, D(.9, .7), a + (cx < 0 ? 0 : 60), {x: cx, y: 0}, {r: .7, c: c2}), c));
  }
  return {b};
}});

/* ---------- 37-40 ---------- */
L({name: 'Lantern', element: 'Bomb + Lock', challenge: 'The bomb ring is locked and its fuse is short one way. Get the key from below, then turn it the long, safe way.', make() {
  const b = new Lv(), d = D(1, 1);
  const x = b.ring(0, NEAR, {c: C.purple, closed: true}), h = b.ring(0, 0, {c: C.orange, gap: 35}), k = b.ring(0, -d, {c: C.yellow}), s = b.ring(0, -2 * d, {c: C.pink, r: .8});
  b.pin(x, 90).pin(h, 0).bomb(h, 200).lock(h, k).arm(k, s).pin(s, 270);
  b.arm(b.ring(-d, -d, {c: C.cyan, r: .85}), k).arm(b.ring(d, -d, {c: C.cyan, r: .85}), k);
  b.arm(at(b, D(1, .7), 150, ctr(b, x), {r: .7, c: C.blue}), x).arm(at(b, D(1, .7), 30, ctr(b, x), {r: .7, c: C.blue}), x);
  return {b};
}});
L({name: 'Great snowflake', element: 'Pin', challenge: 'Thirteen rings, the arms point both ways. Read the long chains and follow them to the heart of the snowflake.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, c = b.ring(0, 0, {c: C.blue}), I = [], M = [], T = [];
  const r1 = D(1, .8) + .2, r2 = r1 + D(.8, .7), r3 = r2 + D(.7, .55);
  for (let k = 0; k < 6; k++) I.push(at(b, r1, 90 + 60 * k, o, {r: .8, c: k % 2 ? C.cyan : C.blue}));
  for (let k = 0; k < 6; k++) M.push(at(b, r2, 90 + 60 * k, o, {r: .7, c: C.purple}));
  for (let k = 0; k < 6; k++) { if (k % 2) b.arm(M[k], I[k]); else b.arm(I[k], M[k]); }
  b.arm(I[1], I[0]).arm(I[5], I[0]).arm(I[2], I[1]).arm(I[4], I[5]).arm(I[3], I[2]).arm(I[3], I[4]).arm(c, I[3]);
  b.pin(M[0], 90 + 90).pin(M[3], 270 + 90).pin(c, 90);
  return {b};
}});
L({name: 'Decoy', element: 'Bomb', challenge: 'Two bombs: the easy one blows up the ring that carries the bomb you need. Use the far bomb first, or leave the near one alone.', make() {
  const b = new Lv(), d = D(1, 1);
  const c = b.ring(0, NEAR, {c: C.purple, closed: true}), a = b.ring(-d, NEAR, {c: C.pink});
  const h2 = b.ring(0, 0, {c: C.orange, closed: true}), h1 = b.ring(NEAR, 0, {c: C.red, gap: 0}), s = b.ring(NEAR + d, 0, {c: C.yellow, r: 1});
  const y = b.ring(0, -NEAR, {c: C.green, gap: 225});
  b.arm(a, c).pin(h2, 180).bomb(h2, 0 + 300).bomb(h1, 120).pin(h1, 270).pin(s, 0).arm(h1, s).pin(y, 270);
  b.arm(b.ring(-d, -NEAR, {c: C.cyan}), y).arm(b.ring(d + NEAR, -NEAR, {c: C.cyan}), s);
  return {b};
}});
L({name: 'Mandala', element: 'All', hard: true, challenge: 'Finale: a locked heart, two bombs with a wrong side each, and a gear pair at the bottom. Every element in one picture.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, d1 = D(1.1, 1);
  const z = b.ring(0, 0, {c: C.yellow, r: 1.1}), n = b.ring(0, d1, {c: C.blue}), t = b.ring(0, d1 + D(1, .75), {c: C.blue, r: .75});
  const e = b.ring(d1, 0, {c: C.orange, gap: 120}), w = b.ring(-d1, 0, {c: C.orange, gap: 60});
  const xe = b.ring(d1, NEAR, {c: C.purple, closed: true}), xw = b.ring(-d1, NEAR, {c: C.purple, closed: true});
  const ye = b.ring(d1, -NEAR, {c: C.green, gap: 0}), yw = b.ring(-d1, -NEAR, {c: C.green, gap: 180});
  const s = b.ring(0, -d1, {c: C.cyan}), s2 = b.ring(0, -d1 - D(1, 1), {c: C.cyan});
  b.lock(z, n).arm(n, t).pin(t, 90).arm(z, e).arm(z, w).arm(s, z).gear(s, s2).pin(s, 0).pin(s2, 270).pin(s, 180);
  b.bomb(e, 0).bomb(w, 180).pin(e, 315).pin(w, 225).pin(xe, 0).pin(xw, 180).pin(ye, 270).pin(yw, 270);
  b.arm(at(b, D(1, .7), 330, ctr(b, ye), {r: .7, c: C.pink}), ye).arm(at(b, D(1, .7), 210, ctr(b, yw), {r: .7, c: C.pink}), yw);
  return {b};
}});

// keep the sawtooth: these pairs read better the other way round
const sw = (a, b) => { [LEVELS[a - 1], LEVELS[b - 1]] = [LEVELS[b - 1], LEVELS[a - 1]]; };
sw(18, 19); sw(28, 29); sw(32, 33);
