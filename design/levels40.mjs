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
  challenge: 'Three petals hook the center. One long turn of the center frees them all at once.', make() {
  const b = new Lv(), c = b.ring(0, 0, {c: C.yellow, gap: 30});
  [[90, C.pink], [330, C.purple], [210, C.cyan]].forEach(([a, col]) => b.arm(nb(b, c, a, {r: .8, c: col}), c));
  return {b};
}});
L({name: 'Swing', element: 'Ring', rule: 'Parts are solid: a free arm swings with its ring and bumps',
  challenge: 'Free the small ring, then the middle ring carries its arm. One way the arm hits the hook above; turn the other way.', make() {
  const b = new Lv(), m = b.ring(0, 0, {c: C.cyan, gap: 300}), h = nb(b, m, 90, {c: C.orange, gap: 30}), q = nb(b, m, 0, {r: .75, c: C.yellow, gap: 90});
  const p = nb(b, h, 90, {r: .7, c: C.pink, gap: 0});
  b.arm(h, m).arm(m, q).arm(h, p).arm(nb(b, m, 225, {r: .7, c: C.green, gap: 180}), m); return {b};
}});
L({name: 'Bridge', element: 'Closed ring', rule: 'A closed ring has no gap: free it from its neighbours',
  challenge: 'The middle ring is closed and cannot let go of anything. Free both sides; it shatters when nothing holds it.', make() {
  const b = new Lv(), c = b.ring(0, 0, {c: C.red, closed: true}), l = nb(b, c, 180, {r: .85, c: C.blue}), r = nb(b, c, 0, {r: .85, c: C.blue});
  b.arm(c, l).arm(c, r);
  b.arm(nb(b, l, 225, {r: .7, c: C.green}), l).arm(nb(b, r, 315, {r: .7, c: C.green}), r).arm(r, nb(b, r, 45, {r: .7, c: C.yellow}));
  return {b};
}});
L({name: 'Make way', element: 'Ring', rule: 'Move one arm out of the way of another',
  challenge: 'The right ring cannot finish: its arm runs into the arm of the left ring. Turn the left ring first to clear the path.', make() {
  const b = new Lv(), A = b.ring(-1.175, 0, {c: C.purple, gap: 0}), B = b.ring(1.175, 0, {c: C.green, gap: 270});
  const ha = nb(b, A, 90, {r: .85, c: C.yellow, gap: 300}), hb = nb(b, B, 60, {r: .85, c: C.yellow, gap: 240}), s = nb(b, B, 0, {r: .7, c: C.pink, gap: 90});
  const t = nb(b, A, 225, {r: .7, c: C.cyan, gap: 200}), u = nb(b, B, 300, {r: .7, c: C.red, gap: 30});
  b.arm(ha, A).arm(hb, B).arm(A, B).arm(B, s).arm(A, t).arm(u, B); return {b};
}});

/* ---------- 7-11: Straight Bar + Pin (unlock 7) ---------- */
L({name: 'Rail', element: 'Straight Bar + Pin (new)', rule: 'A bar comes out when no ring holds its ends; its pins go with it',
  challenge: 'The bar rests on both rings. Turn each ring until its gap passes the end of the bar.', make() {
  const b = new Lv(), l = b.ring(-1.6, -.4, {c: C.blue}), r = b.ring(1.6, -.4, {c: C.orange});
  const h = b.bar([b.on(l, 90), b.on(r, 90)]); b.pinBar(h, .3).pinBar(h, .7);
  return {b, tutorialRing: l};
}});
L({name: 'Detour', element: 'Straight Bar + Pin', rule: 'Bars and pins are solid: a free arm cannot pass the bar end',
  challenge: 'Each pillar ring carries a free arm once its outer ring is gone. The arm cannot pass under the bar: the two pillars turn opposite ways.', make() {
  const b = new Lv(), l = b.ring(-1.5, 0, {c: C.green, gap: 340}), r = b.ring(1.5, 0, {c: C.green, gap: 200});
  b.arm(l, nb(b, l, 180, {r: .75, c: C.pink})).arm(r, nb(b, r, 0, {r: .75, c: C.pink}));
  const h = b.bar([b.on(l, 90), b.on(r, 90)]); b.pinBar(h, .5);
  return {b};
}});
L({name: 'Gate', element: 'Straight Bar + Pin', rule: 'A bar can be bent; it holds until every end is free',
  challenge: 'The gate stands on two posts that also hold the middle ring. A long turn of a post runs its free arm into the gate: free the hook with a short turn one way, then the gate end with a short turn the other way.', make() {
  const b = new Lv(), A = b.ring(-2.35, -1.2, {c: C.purple, gap: 45}), M = b.ring(0, -1.2, {c: C.yellow, gap: 225}), B = b.ring(2.35, -1.2, {c: C.purple, gap: 135});
  b.arm(M, A).arm(M, B);
  b.arm(A, nb(b, A, 180, {r: .75, c: C.cyan})).arm(B, nb(b, B, 0, {r: .75, c: C.cyan}));
  const [ax, ay] = b.on(A, 90), [bx, by] = b.on(B, 90), top = 1.6;
  const h = b.bar([[ax, ay], [ax, top], [bx, top], [bx, by]], {c: C.blue}); b.pinBar(h, .5, 1, 1).pinAt(ax, top - .55, 180).pinAt(bx, top - .55, 0);
  b.arm(nb(b, M, 270, {r: .8, c: C.red}), M);
  return {b};
}});
L({name: 'Frame', element: 'Bar + Pin', hard: true, rule: 'Hard: order, direction and bars together',
  challenge: 'A pinned frame on four corners with a pinwheel inside. Each corner holds two bar ends and a hook: find the turn that frees all three. A pinwheel ring can only let go once the corner it hooks is gone.', make() {
  const b = new Lv(), k = 2.75, d = D(1, .85);
  const mid = [[90, C.blue], [0, C.green], [270, C.blue], [180, C.green]].map(([a, col]) => at(b, d, a, {x: 0, y: 0}, {r: .85, c: col}));
  const cor = [[45, C.yellow], [315, C.orange], [225, C.yellow], [135, C.orange]].map(([a, col]) => at(b, k * Math.SQRT2, a, {x: 0, y: 0}, {r: .85, c: col}));
  mid.forEach((m, i) => b.pin(m, [90, 0, 270, 180][i]));
  mid.forEach((m, i) => b.arm(m, cor[i]));            // pinwheel: N->TR, E->BR, S->BL, W->TL
  const [TR, BR, BL, TL] = cor;
  const sides = [[TL, 0, TR, 180], [TR, 270, BR, 90], [BR, 180, BL, 0], [BL, 90, TL, 270]];
  sides.forEach(([p, pa, q, qa]) => { const h = b.bar([b.on(p, pa), b.on(q, qa)], {c: C.purple}); b.pinBar(h, .5, -1); });
  return {b};
}});
L({name: 'Ladder', element: 'Bar + Pin', rule: 'Bar ends and pins are in the way of free arms',
  challenge: 'Breather: a hanging chain with a pinned rung on each ring. Work up from the bottom; each ring must drop its rung before its free arm swings into it.', make() {
  const b = new Lv(), d = D(.9, .9), r0 = b.ring(0, d, {r: .9, c: C.orange}), r1 = b.ring(0, 0, {r: .9, c: C.yellow}), r2 = b.ring(0, -d, {r: .9, c: C.green});
  b.arm(r0, r1).arm(r1, r2);
  [[r0, 180], [r1, 0], [r2, 180]].forEach(([i, a]) => {
    const [x, y] = b.on(i, a), s = a === 0 ? 1 : -1, h = b.bar([[x, y], [x + s * 1.2, y]], {c: C.blue});
    b.pinAt(x + s * 1.2, y, a);
  });
  b.arm(nb(b, r0, 90, {r: .7, c: C.pink}), r0);
  return {b};
}});

/* ---------- 12-16: Bomb (unlock 12) ---------- */
L({name: 'Knot', element: 'Bomb (new)', rule: 'A Bomb blows up the ring or bar it runs into, and its own ring',
  challenge: 'The blue ring hooks the bar and can never let go. Turn the orange ring the short way so its bomb hits the bar. The long way frees the pin first and the bomb is lost.', make() {
  const b = new Lv(), k = b.ring(1.2, -.8, {c: C.blue, gap: 270}), m = b.ring(-1.4, -.6, {c: C.orange, gap: 300});
  const h = b.bar([[-2.8, .55], [2.8, .55]], {c: C.purple}); b.pinAt(-2.8, .55, 180).pinAt(2.8, .55, 0);
  b.hookBar(k, h, [1.2, .55]).bomb(m, 30).pin(m, 230);
  return {b, tutorialRing: m};
}});
L({name: 'Aim', element: 'Bomb', rule: 'Pick the right target: a bomb spent on a free ring is lost',
  challenge: 'Two rings sit beside the bomb ring. The right one can be freed by turning it; the closed one on the left cannot. Send the bomb left.', make() {
  const b = new Lv(), m = b.ring(0, 0, {c: C.orange, gap: 45}), k = b.ring(-2.2, 0, {c: C.cyan, closed: true}), f = b.ring(2.2, 0, {c: C.cyan, gap: 0});
  b.bomb(m, 90).pin(m, 270).pin(k, 90).pin(f, 90).pin(k, 270);
  return {b};
}});
L({name: 'Long way', element: 'Bomb', rule: 'A bomb is solid: it cannot pass a pin',
  challenge: 'Free the small ring, then turn the bomb ring. The short way runs the bomb into its own pin; go the long way round to the knot.', make() {
  const b = new Lv(), m = b.ring(0, 0, {c: C.yellow, gap: 300}), k = b.ring(-2.2, 0, {c: C.purple, closed: true}), s = nb(b, m, 315, {r: .65, c: C.green, gap: 45});
  b.arm(m, s).bomb(m, 0).pin(m, 90).pin(k, 90).pin(k, 270);
  const t = nb(b, k, 180, {r: .7, c: C.pink}); b.arm(t, k);
  return {b};
}});
L({name: 'Scales', element: 'Bomb', hard: true, rule: 'Hard: two knots, two bombs, one decoy',
  challenge: 'The beam rests on two closed, pinned pans: two knots. Each bomb can hit its pan or the beam. Hitting the beam wastes a bomb and the pans stay stuck. Free the bottom first, then aim each bomb out at its pan before its gap lets go of the hook.', make() {
  const b = new Lv(), y = .45;
  const Lp = b.ring(-3.2, y - 1, {c: C.blue, closed: true}), Rp = b.ring(3.2, y - 1, {c: C.blue, closed: true});
  const BL = b.ring(-1.3, y - 1.05, {r: .9, c: C.orange}), BR = b.ring(1.3, y - 1.05, {r: .9, c: C.orange});
  const ct = b.ring(0, -2.55, {r: .8, c: C.green}), s = nb(b, ct, 270, {r: .6, c: C.pink});
  const h = b.bar([b.on(Lp, 90), b.on(Rp, 90)], {c: C.purple}); b.pinAt(0, y, 90);
  b.pin(Lp, 270).pin(Rp, 270).arm(ct, BL).arm(ct, BR).arm(ct, s).bomb(BL, 135).bomb(BR, 45);
  return {b};
}});
L({name: 'Ring road', element: 'Bomb', G: {0: 40, 1: 225, 2: 200, 3: 200, 4: 275, 5: 130}, rule: 'Two rings hooked onto each other are a knot',
  challenge: 'Breather: around the road, two rings hold each other and neither can turn. Clear the road up to the bomb ring and send its bomb into the pair.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, R = [], cols = [C.red, C.orange, C.yellow, C.green, C.cyan, C.blue];
  for (let k = 0; k < 6; k++) R.push(at(b, D(.85, .85), 90 + 60 * k, o, {r: k === 2 ? 1 : .85, c: cols[k]}));
  b.arm(R[0], R[1]).arm(R[1], R[0]);                  // the knot
  b.arm(R[2], R[3]).arm(R[3], R[4]).arm(R[4], R[5]);  // the road: clear from R5 back
  b.bomb(R[2], 30).pin(R[2], 280);
  return {b};
}});

/* ---------- 17-21: Locked Ring (unlock 17) ---------- */
L({name: 'Key', element: 'Locked Ring (new)', rule: 'A locked ring turns only after the piece with its key is gone',
  challenge: 'The blue ring is locked: a tap only shakes it. Free the yellow ring that carries its key, then the blue ring turns.', make() {
  const b = new Lv(), y = b.ring(-1.3, .6, {c: C.yellow, gap: 0}), x = b.ring(1.3, .6, {c: C.blue, gap: 180});
  const p = nb(b, x, 270, {r: .8, c: C.pink}); b.arm(p, x).pin(y, 180).lock(x, y);
  return {b, tutorialRing: y};
}});
L({name: 'Key bar', element: 'Locked Ring', rule: 'The key can sit on a bar: clear the bar to open the lock',
  challenge: 'The key hangs on the bar. Free both bar ends, the bar comes out and the locked ring opens.', make() {
  const b = new Lv(), A = b.ring(-2.4, .2, {c: C.green}), B = b.ring(2.4, .2, {c: C.green}), X = b.ring(0, -1.4, {c: C.purple});
  b.arm(A, nb(b, A, 180, {r: .7, c: C.orange})).arm(B, nb(b, B, 0, {r: .7, c: C.orange}));
  const h = b.bar([b.on(A, 60), [-1, 1.6], [1, 1.6], b.on(B, 120)], {c: C.blue}); b.pinAt(-1, 1.6, 90).pinAt(1, 1.6, 90);
  b.arm(nb(b, X, 270, {r: .75, c: C.yellow}), X).pin(X, 90).lock(X, h);
  return {b};
}});
L({name: 'Key chain', element: 'Locked Ring', rule: 'Locks in a row: each key opens the next lock',
  challenge: 'Three rings in a triangle: the top one holds the key of the left, the left one the key of the right. Open them in order.', make() {
  const b = new Lv(), o = {x: 0, y: 0}, d = 1.45;
  const t = at(b, d, 90, o, {c: C.yellow}), l = at(b, d, 210, o, {c: C.cyan}), r = at(b, d, 330, o, {c: C.red});
  b.pin(t, 90).arm(nb(b, l, 210, {r: .7, c: C.pink}), l).arm(r, nb(b, r, 330, {r: .7, c: C.green}));
  b.pin(r, 0).lock(l, t).lock(r, l);
  return {b};
}});
L({name: 'Vault', element: 'Locked Ring + Bomb', hard: true, G: {0: 290, 2: 340, 3: 100, 4: 285, 5: 260, 6: 355, 7: 285}, rule: 'Hard: a locked bomb, a key on a bar, a knot',
  challenge: 'The bomb ring is locked; its key sits on the gate bar. Take the gate down first, then aim the bomb at the closed ring and not at the free one beside it.', make() {
  const b = new Lv(), M = b.ring(0, 0, {c: C.orange}), K = b.ring(-2.2, 0, {c: C.blue, closed: true}), F = b.ring(2.2, 0, {c: C.blue});
  const A = b.ring(-2.2, 2.4, {r: .85, c: C.green}), B = b.ring(2.2, 2.4, {r: .85, c: C.green});
  const h = b.bar([b.on(A, 0), b.on(B, 180)], {c: C.purple}); b.pinBar(h, .5, 1);
  b.arm(A, nb(b, A, 135, {r: .65, c: C.pink})).arm(B, nb(b, B, 45, {r: .65, c: C.pink}));
  b.bomb(M, 270).pin(M, 90).pin(K, 270).pin(F, 270).lock(M, h);
  b.arm(nb(b, K, 180, {r: .7, c: C.yellow}), K);
  const f1 = nb(b, F, 0, {r: .7, c: C.yellow}), f2 = nb(b, f1, 300, {r: .55, c: C.pink}); b.arm(F, f1).arm(f1, f2);
  return {b};
}});
L({name: 'Wave', element: 'Bar + Pin', rule: 'Breather: a long bent bar',
  challenge: 'Breather: a wave-shaped bar lies on three rings. Free each of its rest points; the rings below it free themselves.', make() {
  const b = new Lv(), R = [-3, 0, 3].map((x, k) => b.ring(x, -.3, {r: .9, c: [C.cyan, C.blue, C.cyan][k]}));
  const h = b.bar([b.on(R[0], 90), [-1.5, 1.6], b.on(R[1], 90)], {c: C.purple}), h2 = b.bar([b.on(R[1], 90), [1.5, 1.6], b.on(R[2], 90)], {c: C.purple});
  b.pinAt(-1.5, 1.6, 90).pinAt(1.5, 1.6, 90);
  R.forEach((r, k) => b.arm(nb(b, r, 270, {r: .65, c: [C.yellow, C.orange, C.yellow][k]}), r));
  return {b};
}});

/* ---------- 22-26: Gear Ring (unlock 22) ---------- */
L({name: 'Gears', element: 'Gear Ring (new)', rule: 'Meshed gears turn together, the other way',
  challenge: 'Turn one gear and its partner turns the other way. Find the direction where both gaps reach their pins.', make() {
  const b = new Lv(), d = D(1, 1), a = b.ring(-d / 2, 0, {c: C.orange, gap: 90}), g = b.ring(d / 2, 0, {c: C.green, gap: 90});
  b.gear(a, g).pin(a, 180).pin(g, 0);
  b.arm(nb(b, a, 270, {r: .7, c: C.yellow}), a).arm(nb(b, g, 270, {r: .7, c: C.yellow}), g);
  return {b, tutorialRing: a};
}});
L({name: 'Drawbridge', element: 'Gear Ring', G: {0: 75, 1: 255, 2: 135, 3: 210}, rule: 'A bar on two gears: both ends free in one turn',
  challenge: 'The bridge bar rests on two gears. One turn of a gear frees both ends together, if the free arms do not hit the bridge first.', make() {
  const b = new Lv(), d = D(1, 1), a = b.ring(-d / 2, -.3, {c: C.cyan}), g = b.ring(d / 2, -.3, {c: C.cyan});
  b.gear(a, g);
  const h = b.bar([b.on(a, 135), [-d / 2 - .7, 1.9], [d / 2 + .7, 1.9], b.on(g, 45)], {c: C.purple}); b.pinAt(0, 1.9, 90);
  b.arm(a, nb(b, a, 200, {r: .7, c: C.pink})).arm(g, nb(b, g, 340, {r: .7, c: C.pink}));
  return {b};
}});
L({name: 'Partner', element: 'Gear Ring', rule: 'A gear group is held if any gear has an arm out',
  challenge: 'The orange gear looks free but only shakes: its partner still hooks the purple ring. Free purple first, then turn the pair the way that keeps the free arm off the pin.', make() {
  const b = new Lv(), d = D(1, 1), a = b.ring(-d / 2, 0, {c: C.orange}), g = b.ring(d / 2, 0, {c: C.green});
  b.gear(a, g).pin(a, 180).pin(g, 270).arm(g, nb(b, g, 0, {r: .8, c: C.purple}));
  b.arm(nb(b, a, 90, {r: .7, c: C.yellow}), a);
  return {b};
}});
L({name: 'Gear train', element: 'Gear + Lock + Bomb', hard: true, G: {0: 340, 1: 195, 2: 180, 3: 305, 4: 155, 5: 150, 6: 290, 8: 80}, rule: 'Hard: three gears, a lock and free arms',
  challenge: 'Three gears turn as one, the middle one the other way, but the middle gear is locked. Get its key from the top chain. The bomb on the right gear must reach the closed knot below before the gears let go of their pins: one direction does both, the other wastes the bomb.', make() {
  const b = new Lv(), d = D(1, 1), A = b.ring(-d, 0, {c: C.orange}), B = b.ring(0, 0, {c: C.green}), Cc = b.ring(d, 0, {c: C.orange});
  b.gear(A, B).gear(B, Cc);
  const k = nb(b, B, 90, {r: .8, c: C.yellow}), t = nb(b, k, 90, {r: .65, c: C.pink}); b.arm(k, t).pin(t, 90).lock(B, k);
  b.arm(nb(b, A, 180, {r: .7, c: C.blue}), A);
  b.pin(A, 270).pin(Cc, 270).pin(B, 270);
  b.arm(nb(b, B, 270, {r: .7, c: C.purple}), B);
  const kn = b.ring(d + .35, -2.05, {r: .9, c: C.red, closed: true}); b.pin(kn, 270).bomb(Cc, 45);
  const kp = nb(b, kn, 0, {r: .6, c: C.yellow}); b.arm(kp, kn);
  return {b};
}});
L({name: 'Nest', element: 'Ring', rule: 'Breather: rings inside rings',
  challenge: 'Breather: small rings sit inside big ones and hook their inner side. Turn the big rings so their gaps pass the inner hooks.', make() {
  const b = new Lv(), big = [b.ring(-1.6, 0, {r: 1.5, c: C.blue}), b.ring(1.6, 0, {r: 1.5, c: C.purple})];
  big.forEach((B, k) => { const q = b.R[B], sx = k ? .55 : -.55, s = b.ring(q.x + sx, q.y, {r: .6, c: k ? C.yellow : C.orange}); b.armTo(s, [q.x + Math.sign(sx) * 1.5, q.y]); });
  b.arm(big[0], big[1]);
  b.arm(nb(b, big[0], 225, {r: .7, c: C.green}), big[0]).arm(nb(b, big[1], 315, {r: .7, c: C.green}), big[1]);
  return {b};
}});

/* ---------- 27-40: mixing everything ---------- */
L({name: 'Crossfire', element: 'Bomb + Bar', rule: 'Two bombs, each must cross to the far knot',
  challenge: 'Each bomb ring sits next to the wrong knot: the near hit is on a free ring. Clear the bar first so each bomb can reach across.', make() {
  const b = new Lv(), m1 = b.ring(-1.1, 1.1, {c: C.orange}), m2 = b.ring(1.1, -1.1, {c: C.orange});
  const k1 = b.ring(1.1, 1.1, {c: C.blue, closed: true}), k2 = b.ring(-1.1, -1.1, {c: C.blue, closed: true});
  b.pin(k1, 45).pin(k2, 225).bomb(m1, 270).bomb(m2, 90).pin(m1, 135).pin(m2, 315);
  const f1 = nb(b, m1, 180, {r: .7, c: C.green}), f2 = nb(b, m2, 0, {r: .7, c: C.green}); b.arm(f1, m1).arm(f2, m2);
  return {b};
}});
L({name: 'Clock', element: 'Gear + Bar', rule: 'Gears around a hub: hands are bars',
  challenge: 'Four small gears sit around a big gear. The clock hands are bars resting on the gears: one turn of the big gear moves all four the other way.', make() {
  const b = new Lv(), c = b.ring(0, 0, {r: 1.3, c: C.yellow}), G = [];
  [45, 135, 225, 315].forEach((a, k) => { const g = at(b, D(1.3, .8), a, {x: 0, y: 0}, {r: .8, c: k % 2 ? C.cyan : C.blue}); b.gear(c, g); G.push(g); });
  b.bar([b.on(G[0], 135), b.on(G[1], 45)], {c: C.purple}); b.bar([b.on(G[2], 315), b.on(G[3], 225)], {c: C.purple});
  G.forEach((g, k) => b.pin(g, [45, 135, 225, 315][k]));
  b.arm(nb(b, c, 0, {r: .6, c: C.pink}), c);
  return {b};
}});
L({name: 'Lift', element: 'Lock + Gear', rule: 'The key holder is a gear',
  challenge: 'The key sits on a gear pair. Turn the pair to drop it, then the locked cabin ring and its chain can move.', make() {
  const b = new Lv(), d = D(1, 1), a = b.ring(-d / 2, 2, {c: C.green}), g = b.ring(d / 2, 2, {c: C.green});
  b.gear(a, g).pin(a, 90).pin(g, 90);
  const x = b.ring(0, -.6, {r: .9, c: C.red}), y = nb(b, x, 270, {r: .75, c: C.orange}), z = nb(b, y, 270, {r: .6, c: C.yellow});
  b.arm(x, y).arm(y, z).pin(z, 270).lock(x, g);
  b.bar([b.on(a, 270), b.on(x, 135)], {c: C.purple}); b.bar([b.on(g, 270), b.on(x, 45)], {c: C.purple});
  return {b};
}});
L({name: 'Grid', element: 'All so far', hard: true, G: {0: 180, 1: 135, 2: 220, 3: 340, 4: 40, 5: 310, 6: 295, 7: 40, 8: 145}, rule: 'Hard: a 3 x 3 grid',
  challenge: 'Nine rings in a grid, linked like a maze, a locked center and a frame of pinned bars. Find the one corner that starts the chain.', make() {
  const b = new Lv(), d = D(.85, .85), g = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g.push(b.ring((c - 1) * d, (1 - r) * d, {r: .85, c: [C.blue, C.green, C.orange, C.purple, C.red, C.purple, C.orange, C.green, C.blue][r * 3 + c]}));
  // a snake through the grid: 0 -> 1 -> 2 -> 5 -> 8 -> 7 -> 6 -> 3, center 4 locked with key on 3
  [[0, 1], [1, 2], [2, 5], [5, 8], [8, 7], [7, 6], [6, 3]].forEach(([a, c]) => b.arm(a, c));
  b.arm(g[4], g[1]).lock(g[4], g[3]);
  const top = b.bar([b.on(g[0], 135), [-d, d + 1.3], [d, d + 1.3], b.on(g[2], 45)], {c: C.cyan}); b.pinAt(0, d + 1.3, 90);
  b.arm(nb(b, g[3], 180, {r: .65, c: C.yellow}), g[3]).arm(nb(b, g[5], 0, {r: .65, c: C.yellow}), g[5]);
  const bot = b.bar([b.on(g[6], 225), [-d, -d - 1.3], [d, -d - 1.3], b.on(g[8], 315)], {c: C.cyan}); b.pinAt(0, -d - 1.3, 270);
  return {b};
}});
L({name: 'Branches', element: 'Ring', rule: 'Breather: a tree of rings',
  challenge: 'Breather: a branching tree. Every leaf is free; clear the leaves and the branches follow.', make() {
  const b = new Lv(), root = b.ring(0, -2.2, {c: C.green});
  const l = nb(b, root, 120, {r: .85, c: C.yellow}), r = nb(b, root, 60, {r: .85, c: C.orange}); b.arm(root, l).arm(root, r);
  [[l, 150], [l, 90], [r, 90], [r, 30]].forEach(([p, a], k) => { const q = nb(b, p, a, {r: .7, c: [C.pink, C.purple, C.purple, C.pink][k]}); b.arm(p, q); });
  return {b};
}});
L({name: 'Safe', element: 'Lock + Bomb', rule: 'The bomb ring holds the key of the knot cover',
  challenge: 'The bomb ring is also the key holder: when it explodes the lock opens. Unlock the cover first, then blow the knot, then free the cover.', make() {
  const b = new Lv(), m = b.ring(0, 0, {c: C.orange}), k = b.ring(0, -2.2, {c: C.blue, closed: true}), cov = b.ring(2.2, -1.1, {c: C.red});
  b.bomb(m, 0).pin(m, 90).pin(k, 270).arm(cov, k).lock(cov, m);
  b.arm(nb(b, m, 180, {r: .7, c: C.green}), m);
  return {b};
}});
L({name: 'Mirror bomb', element: 'Gear + Bomb', rule: 'A bomb on a gear turns opposite to your drag',
  challenge: 'The bomb rides the right gear, which turns opposite to the gear you drag. Aim it at the closed ring below, not the free ring above.', make() {
  const b = new Lv(), d = D(1, 1), a = b.ring(-d / 2, 0, {c: C.green}), g = b.ring(d / 2, 0, {c: C.green});
  b.gear(a, g).pin(a, 180).bomb(g, 0).pin(g, 180 - 30);
  const k = b.ring(d / 2 + .45, -2.1, {c: C.blue, closed: true}), f = b.ring(d / 2 + .45, 2.1, {c: C.blue});
  b.pin(k, 270).pin(f, 90);
  return {b};
}});
L({name: 'Tower', element: 'All so far', rule: 'A tall build: bars, a lock and gears',
  challenge: 'A tower of gears and bars. The roof bar holds the key of the base. Climb down: roof, gears, base.', make() {
  const b = new Lv(), d = D(.9, .9), a = b.ring(-d / 2, 1.4, {r: .9, c: C.cyan}), g = b.ring(d / 2, 1.4, {r: .9, c: C.cyan});
  b.gear(a, g);
  const roof = b.bar([b.on(a, 150), [0, 3.2], b.on(g, 30)], {c: C.purple}); b.pinAt(0, 3.2, 90);
  const base = b.ring(0, -1.1, {r: 1.1, c: C.red}); b.arm(base, a).arm(base, g).lock(base, roof);
  b.arm(nb(b, base, 225, {r: .7, c: C.yellow}), base).arm(nb(b, base, 315, {r: .7, c: C.yellow}), base);
  return {b};
}});
L({name: 'Fortress', element: 'Lock + Bomb + Gear', hard: true, G: {0: 355, 1: 150, 2: 290, 3: 180, 6: 80, 7: 15, 8: 15}, rule: 'Hard: two locked bombs, two knots',
  challenge: 'Two bomb rings are locked, their keys on the two gate bars. Take each gate down with the gear pair (each gate rests only on its gear), then aim each bomb at its own knot; each has a free decoy on the other side.', make() {
  const b = new Lv(), d = D(1, 1), a = b.ring(-d / 2, 2.4, {c: C.green}), g = b.ring(d / 2, 2.4, {c: C.green}); b.gear(a, g);
  const m1 = b.ring(-2.2, 0, {c: C.orange}), m2 = b.ring(2.2, 0, {c: C.orange});
  const k1 = b.ring(-4.4, 0, {c: C.blue, closed: true}), k2 = b.ring(4.4, 0, {c: C.blue, closed: true}), f = b.ring(0, -.4, {c: C.cyan});
  const h1 = b.bar([b.on(a, 180), [-2.2, 2.4], [-2.2, 1.45]], {c: C.purple}), h2 = b.bar([b.on(g, 0), [2.2, 2.4], [2.2, 1.45]], {c: C.purple});
  b.pinAt(-2.2, 2.4, 90).pinAt(2.2, 2.4, 90).pinAt(-2.2, 1.45, 270).pinAt(2.2, 1.45, 270);
  b.lock(m1, h1).lock(m2, h2).bomb(m1, 270).bomb(m2, 270).pin(m1, 45).pin(m2, 135).pin(k1, 90).pin(k2, 90).pin(f, 270);
  const y1 = nb(b, k1, 270, {r: .7, c: C.yellow}), y2 = nb(b, k2, 270, {r: .7, c: C.yellow}); b.arm(y1, k1).arm(y2, k2);
  b.arm(nb(b, y1, 0, {r: .55, c: C.pink}), y1).arm(nb(b, y2, 180, {r: .55, c: C.pink}), y2);
  return {b};
}});
L({name: 'Snake', element: 'Ring', rule: 'Breather: a long winding chain',
  challenge: 'Breather: a long snake of rings. Start at the tail and follow it to the head.', make() {
  const b = new Lv(), cols = [C.green, C.yellow, C.green, C.yellow, C.green, C.yellow, C.red];
  let prev = b.ring(-3, -1.5, {r: .8, c: cols[0]});
  [60, 0, -60, 0, 60, 0].forEach((a, k) => { const q = nb(b, prev, a, {r: .8, c: cols[k + 1]}); b.arm(q, prev); prev = q; });
  return {b};
}});
L({name: 'Cage', element: 'Ring + Bar', rule: 'Rings inside a ring',
  challenge: 'A big ring cages three small ones. Two hook its inner side and hold it; the third holds a pinned bar. Drop the bar first, then turn the cage past both inner hooks and the hook below.', make() {
  const b = new Lv(), B = b.ring(0, 0, {r: 2.1, c: C.purple}), o = {x: 0, y: 0};
  const s1 = at(b, 1.25, 150, o, {r: .65, c: C.yellow}), s2 = at(b, 1.25, 30, o, {r: .65, c: C.yellow}), k = at(b, 1.15, 270, o, {r: .7, c: C.blue});
  b.armTo(s1, pol(2.1, 150)).armTo(s2, pol(2.1, 30));
  const h = b.bar([b.on(k, 90), [0, .9]], {c: C.cyan}); b.pinAt(0, .9, 90);
  b.arm(nb(b, B, 300, {r: .7, c: C.green}), B);
  return {b};
}});
L({name: 'Gear bridge', element: 'Gear + Bar + Bomb', G: {0: 200, 1: 130, 2: 310, 3: 230, 5: 180}, rule: 'A row of four gears: alternate directions',
  challenge: 'Four gears in a row turn as one, each the other way from its neighbour. Bars rest on gears 1 and 4; a bomb rides gear 3. Choose one direction that frees the bars and sends the bomb into the knot below, not the free ring above.', make() {
  const b = new Lv(), d = D(.9, .9), G = [0, 1, 2, 3].map(k => b.ring((k - 1.5) * d, 0, {r: .9, c: k % 2 ? C.cyan : C.green}));
  for (let k = 0; k < 3; k++) b.gear(G[k], G[k + 1]);
  b.bar([b.on(G[0], 90), [-1.5 * d, 1.9]], {c: C.purple}); b.pinAt(-1.5 * d, 1.9, 90);
  b.bar([b.on(G[3], 90), [1.5 * d, 1.9]], {c: C.purple}); b.pinAt(1.5 * d, 1.9, 90);
  const k = b.ring(.5 * d, -2.05, {r: .9, c: C.blue, closed: true}), f = b.ring(.5 * d, 2.05, {r: .9, c: C.blue});
  b.pin(k, 270).pin(f, 90).bomb(G[2], 0).pin(G[1], 270).pin(G[2], 180);
  return {b};
}});
L({name: 'Spiral', element: 'All so far', rule: 'A spiral: the lock key is at the far end',
  challenge: 'Rings wind in a curl, smaller to the end. The inner end is locked and its key is the outer end ring. Unwind it in order.', make() {
  const b = new Lv(), R = [];
  const cols = [C.red, C.orange, C.yellow, C.green, C.cyan, C.blue, C.purple, C.pink];
  R.push(b.ring(3, -1.2, {r: 1, c: cols[0]}));
  let dir = 90;
  for (let k = 1; k < 7; k++) { R.push(nb(b, R[k - 1], dir, {r: 1 - k * .07, c: cols[k]})); dir += 36; }
  for (let k = 0; k < 6; k++) b.arm(R[k + 1], R[k]);
  b.pin(R[0], 0).lock(R[6], R[0]);
  b.arm(nb(b, R[6], dir - 40, {r: .5, c: C.pink}), R[6]);
  return {b};
}});
L({name: 'Crown', element: 'All', hard: true, G: {0: 5, 1: 200, 4: 105, 5: 290, 6: 230, 7: 355, 9: 175}, rule: 'Finale: every rule in one picture',
  challenge: 'Finale: a gear pair carries two pinned bars down to the pillars, the jewel is locked with its key on the left bar, and the bomb ring at the base has a decoy on the near side and the hook of the jewel blocking the far side. Bars, then jewel, then send the bomb the long way to the knot.', make() {
  const b = new Lv(), d = D(.9, .9), a = b.ring(-d / 2, 2.6, {r: .9, c: C.green}), g = b.ring(d / 2, 2.6, {r: .9, c: C.green}); b.gear(a, g);
  const L = b.ring(-2.6, .3, {r: .9, c: C.yellow, gap: 40}), R = b.ring(2.6, .3, {r: .9, c: C.yellow, gap: 140}), J = b.ring(0, 0, {r: 1, c: C.red});
  const h1 = b.bar([b.on(a, 180), [-2.6, 2.6], b.on(L, 90)], {c: C.purple}), h2 = b.bar([b.on(g, 0), [2.6, 2.6], b.on(R, 90)], {c: C.purple});
  b.pinAt(-2.6, 2.6, 135).pinAt(2.6, 2.6, 45);
  b.arm(J, L).arm(J, R).lock(J, h1);
  b.arm(L, nb(b, L, 220, {r: .65, c: C.pink})).arm(R, nb(b, R, 320, {r: .65, c: C.pink}));
  const M = b.ring(1.1, -2.3, {r: .95, c: C.orange}), K = b.ring(-1, -2.3, {r: .95, c: C.blue, closed: true}), F = b.ring(3.2, -2.3, {r: .95, c: C.blue});
  b.arm(J, M).bomb(M, 60).pin(K, 270).pin(F, 270).pin(M, 270);
  return {b};
}});
