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
L({name: 'Slide out', element: 'Straight Bar + Pin (new)', rule: 'A pin is a sleeve: slide the bar along it and out',
  challenge: 'Two bars run into the gaps of the top and bottom rings, so those rings cannot turn. The frame on the right is in the way of both bars: slide the frame out first, then each bar, then turn the rings.', make() {
  const b = new Lv(), d = D(1, 1), B = b.ring(0, 0, {c: C.cyan}), A = b.ring(0, d, {c: C.blue, gap: 0}), Cc = b.ring(0, -d, {c: C.purple, gap: 0});
  b.arm(B, A).arm(B, Cc);
  b.arm(A, nb(b, A, 90, {r: .8, c: C.pink})).arm(Cc, nb(b, Cc, 270, {r: .8, c: C.pink}));
  b.arm(B, nb(b, B, 180, {r: .8, c: C.yellow}));
  const red = b.bar([[.35, d], [2.0, d]], {c: C.red}), blue = b.bar([[.35, -d], [2.0, -d]], {c: C.blue});
  b.pinBar(red, .6, 1).pinBar(blue, .6, -1);
  const top = d + 1.25, fr = b.bar([[1.6, top], [2.45, top], [2.45, -top], [1.6, -top]], {c: C.green});
  b.pinBar(fr, .4, 1, 0).pinBar(fr, .6, -1, 2);
  return {b, tutorialRing: -1};
}});
L({name: 'In the way', element: 'Straight Bar + Pin', rule: 'A ring can be in the way of a bar: clear the ring first',
  challenge: 'The bar runs into the top of the middle ring and can only slide up and out, but the ring above is in its way. Clear the top ring, slide the bar out, then open the middle ring.', make() {
  const b = new Lv(), A = b.ring(0, 0, {c: C.cyan, gap: 90}), Bt = b.ring(0, 3.35, {r: .8, c: C.orange, gap: 60});
  const Lr = nb(b, A, 180, {r: .8, c: C.green}), Rr = nb(b, A, 0, {r: .8, c: C.green}), Dn = nb(b, A, 270, {r: .8, c: C.purple});
  b.arm(Lr, A).arm(Rr, A).arm(Dn, A);
  b.arm(Lr, nb(b, Lr, 270, {r: .7, c: C.pink})).arm(Rr, nb(b, Rr, 270, {r: .7, c: C.pink}));
  const F = nb(b, Bt, 0, {r: .7, c: C.yellow}), G = nb(b, Bt, 180, {r: .7, c: C.yellow});
  b.arm(Bt, F).arm(G, Bt);
  const bar = b.bar([[0, -.3], [0, 2.2]], {c: C.red}); b.pinBar(bar, .76, 1);
  return {b};
}});
L({name: 'Two at once', element: 'Straight Bar + Pin', rule: 'One bent bar can run into two rings and hold both',
  challenge: 'A bent bar runs into the gaps of the hub and of the lower ring, so neither can turn. It slides out along its pins, but the short bar above is in its way: slide that one up into its ring and out first.', make() {
  const b = new Lv(), H = b.ring(0, 0, {c: C.cyan, gap: 20}), O = nb(b, H, 315, {c: C.orange, gap: 20});
  const TL = nb(b, H, 135, {r: .85, c: C.blue}), BL = nb(b, H, 225, {r: .85, c: C.red}), Z = nb(b, H, 90, {r: .8, c: C.green});
  b.arm(H, TL).arm(H, BL).arm(H, O).arm(Z, H);
  b.arm(TL, nb(b, TL, 135, {r: .7, c: C.pink})).arm(BL, nb(b, BL, 225, {r: .7, c: C.pink})).arm(O, nb(b, O, 270, {r: .8, c: C.purple}));
  const o = b.R[O], p = (c, r) => pol(r, 20, c);
  const bent = b.bar([p({x: 0, y: 0}, .4), p({x: 0, y: 0}, 2), p(o, 2), p(o, .4)], {c: C.red});
  b.pinBar(bent, .7, 1, 0).pinBar(bent, .3, -1, 2);
  const Y = b.ring(2.6, 3.7, {r: .8, c: C.yellow, gap: 270}); b.pin(Y, 90);
  const short = b.bar([[2.6, .6], [2.6, 3.4]], {c: C.blue}); b.pinBar(short, .22, -1);
  return {b};
}});
L({name: 'Workshop', element: 'Bar + Pin', hard: true, rule: 'Hard: bars in the way of bars, a ring in the way of a bar',
  challenge: 'Three bars hold three rings. The bent bar cannot slide out while the long bar is in its way, and the long bar cannot slide up while the top ring sits on its path. Clear the top corner, slide the long bar, then the bent bar, then open the hub.', make() {
  const b = new Lv(), H = b.ring(0, 0, {c: C.cyan, gap: 20}), O = nb(b, H, 315, {c: C.orange, gap: 20});
  const TL = nb(b, H, 135, {r: .85, c: C.blue}), BL = nb(b, H, 225, {r: .85, c: C.red, gap: 180}), Z = nb(b, H, 90, {r: .8, c: C.green});
  b.arm(H, TL).arm(H, BL).arm(H, O).arm(Z, H);
  b.arm(TL, nb(b, TL, 135, {r: .7, c: C.pink})).arm(BL, nb(b, BL, 270, {r: .7, c: C.pink})).arm(O, nb(b, O, 270, {r: .8, c: C.purple}));
  const o = b.R[O], p = (c, r) => pol(r, 20, c);
  const bent = b.bar([p({x: 0, y: 0}, .4), p({x: 0, y: 0}, 2), p(o, 2), p(o, .4)], {c: C.red});
  b.pinBar(bent, .7, 1, 0).pinBar(bent, .3, -1, 2);
  const V = b.bar([[2.6, .6], [2.6, 4.4]], {c: C.blue}); b.pinBar(V, .16, -1);
  const W = b.ring(2.6, 5.45, {r: .8, c: C.yellow, gap: 30}), W2 = nb(b, W, 180, {r: .7, c: C.green}), W3 = nb(b, W, 90, {r: .7, c: C.pink});
  b.arm(W2, W).arm(W, W3);
  const bl = b.R[BL], left = b.bar([[bl.x - .4, bl.y], [bl.x - 2.1, bl.y]], {c: C.purple}); b.pinBar(left, .7, 1);
  return {b};
}});
L({name: 'Ladder', element: 'Bar + Pin', rule: 'Three rungs, three rings: slide each bar out of its ring',
  challenge: 'Each ring of the ladder has a bar run into its gap. Slide the rungs out (the middle one needs the side ring turned first), then take the ladder down from the top.', make() {
  const b = new Lv(), d = D(.9, .9), r0 = b.ring(0, d, {r: .9, c: C.orange}), r1 = b.ring(0, 0, {r: .9, c: C.yellow}), r2 = b.ring(0, -d, {r: .9, c: C.green});
  b.arm(r0, r1).arm(r1, r2);
  b.poke(r0, 180, {c: C.blue}); b.poke(r1, 0, {c: C.blue, side: -1}); b.poke(r2, 180, {c: C.blue});
  b.arm(nb(b, r0, 90, {r: .7, c: C.pink}), r0);
  const s = b.ring(2.75, 0, {r: .7, c: C.cyan, gap: 90}); b.pin(s, 0);
  return {b};
}});

/* ---------- 12-16: Bomb (unlock 12) ---------- */
L({name: 'Knot', element: 'Bomb (new)', rule: 'A Bomb blows up the ring or bar it runs into, and its own ring',
  challenge: 'The bar runs into the gap of the right ring, but a ring hooks the bar, so the bar cannot slide (a knot). Turn the bomb ring up into the bar: the blast clears the bar, then the right ring can turn.', make() {
  const b = new Lv(), y = .6, Q = b.ring(3.1, y, {r: .9, c: C.green, gap: 180});
  const h = b.bar([[2.55, y], [-1.9, y]], {c: C.purple}); b.pinBar(h, .2, 1);
  const k = b.ring(1.4, -.7, {r: .9, c: C.blue, gap: 270}), m = b.ring(-1.6, -.6, {c: C.orange, gap: 300});
  b.hookBar(k, h, [1.4, y]).bomb(m, 0).pin(m, 230).pin(Q, 0);
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
  challenge: 'Two bars run into the side rings, and each bar is hooked from above, so neither can slide (two knots). Each bomb ring must turn up into its own bar; turned the other way, its bomb hits the center ring instead and the level is lost.', make() {
  const b = new Lv(), y = .6, Lp = b.ring(-3.6, y, {r: .9, c: C.blue, gap: 0}), Rp = b.ring(3.6, y, {r: .9, c: C.blue, gap: 180});
  const hL = b.bar([[-3.35, y], [-.9, y]], {c: C.purple}), hR = b.bar([[3.35, y], [.9, y]], {c: C.purple});
  b.pinBar(hL, .2, 1).pinBar(hR, .2, -1).pin(Lp, 270).pin(Rp, 270);
  b.arm(Lp, nb(b, Lp, 180, {r: .6, c: C.pink})).arm(Rp, nb(b, Rp, 0, {r: .6, c: C.pink}));
  const kL = b.ring(-2.1, y + 1.35, {r: .9, c: C.green, gap: 90}), kR = b.ring(2.1, y + 1.35, {r: .9, c: C.green, gap: 90});
  b.hookBar(kL, hL, [-2.1, y]).hookBar(kR, hR, [2.1, y]);
  const BL = b.ring(-1.6, y - 1.2, {c: C.orange, gap: 200}), BR = b.ring(1.6, y - 1.2, {c: C.orange, gap: 340});
  const ct = b.ring(0, -2.8, {r: .8, c: C.yellow}), s = nb(b, ct, 270, {r: .6, c: C.pink}), dc = b.ring(0, -1.2, {r: .5, c: C.cyan, gap: 90}); b.pin(dc, 270);
  b.arm(ct, BL).arm(ct, BR).arm(ct, s).bomb(BL, 45).bomb(BR, 135);
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
L({name: 'Key bar', element: 'Locked Ring', rule: 'The key can sit on a bar: slide the bar out to open the lock',
  challenge: 'The key of the locked ring is on the bar that runs into the left ring. The right ring is in the bar\'s way: turn it first, slide the bar out, then the lock opens.', make() {
  const b = new Lv(), A = b.ring(-2.4, .2, {c: C.green}), B = b.ring(1.9, .2, {c: C.green, gap: 90}), X = b.ring(-.2, -1.7, {c: C.purple});
  b.arm(A, nb(b, A, 180, {r: .7, c: C.orange})).arm(nb(b, B, 0, {r: .7, c: C.orange}), B).pin(B, 270);
  const h = b.poke(A, 0, {c: C.blue, len: 1.5});
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
L({name: 'Vault', element: 'Locked Ring + Bomb', hard: true, G: {0: 290, 2: 340, 4: 285, 5: 260, 6: 355, 7: 285}, rule: 'Hard: a locked bomb, a key on a bar, a knot',
  challenge: 'The bomb ring is locked; its key is on the bar run into the left top ring. The right top ring is in the bar\'s way, and its pendant must go first. Slide the bar out, then aim the bomb at the closed knot ring, not the free one.', make() {
  const b = new Lv(), M = b.ring(0, 0, {c: C.orange}), K = b.ring(-2.2, 0, {c: C.blue, closed: true}), F = b.ring(2.2, 0, {c: C.blue});
  const A = b.ring(-2.2, 2.4, {r: .85, c: C.green}), B = b.ring(2.2, 2.4, {r: .85, c: C.green});
  const h = b.poke(A, 0, {c: C.purple, len: 1.8});
  b.arm(A, nb(b, A, 135, {r: .65, c: C.pink})).arm(B, nb(b, B, 45, {r: .65, c: C.pink}));
  b.bomb(M, 270).pin(M, 90).pin(K, 270).pin(F, 270).lock(M, h);
  b.arm(nb(b, K, 180, {r: .7, c: C.yellow}), K);
  const f1 = nb(b, F, 0, {r: .7, c: C.yellow}), f2 = nb(b, f1, 300, {r: .55, c: C.pink}); b.arm(F, f1).arm(f1, f2);
  return {b};
}});
L({name: 'Wave', element: 'Bar + Pin', rule: 'Breather: two bent bars, each in two rings',
  challenge: 'A bent bar runs into the tops of the left and middle rings, another into the bottoms of the middle and right rings. Slide each one out, both legs at once, then open the rings.', make() {
  const b = new Lv(), y = -.3, R = [-3, 0, 3].map((x, k) => b.ring(x, y, {r: .9, c: [C.cyan, C.blue, C.cyan][k]}));
  b.R[0].gap = 90; b.R[1].gaps = [90, 270]; b.R[2].gap = 270;
  const i = .9 - .65, h1 = b.bar([[-3, y + i], [-3, 1.6], [0, 1.6], [0, y + i]], {c: C.purple}), h2 = b.bar([[0, y - i], [0, -2.2], [3, -2.2], [3, y - i]], {c: C.purple});
  b.pinBar(h1, .6, 1, 0).pinBar(h1, .4, -1, 2).pinBar(h2, .6, 1, 0).pinBar(h2, .4, -1, 2);
  b.arm(nb(b, R[0], 180, {r: .65, c: C.yellow}), R[0]).arm(nb(b, R[2], 0, {r: .65, c: C.yellow}), R[2]).arm(R[1], R[0]);
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
L({name: 'Drawbridge', element: 'Gear Ring', rule: 'A bent bar in two gears: lift it, then one turn frees both',
  challenge: 'The bridge is a bent bar in the tops of both gears, so the gear pair cannot turn. The ring above is in the way of the bridge: clear it, lift the bridge out, then one turn of the gears frees both pendants.', make() {
  const b = new Lv(), d = D(1, 1), y = -.3, a = b.ring(-d / 2, y, {c: C.cyan, gap: 90}), g = b.ring(d / 2, y, {c: C.cyan, gap: 90});
  b.gear(a, g);
  const h = b.bar([[-d / 2, y + .35], [-d / 2, 1.9], [d / 2, 1.9], [d / 2, y + .35]], {c: C.purple});
  b.pinBar(h, .6, 1, 0).pinBar(h, .4, -1, 2);
  const T = b.ring(0, 3.05, {r: .9, c: C.yellow}); b.pin(T, 90);
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
L({name: 'Clock', element: 'Gear + Bar', rule: 'Gears around a hub: the hands are bars in two gears',
  challenge: 'Four small gears sit around a big gear. Two clock hands are bars run into two of the small gears, so nothing can turn. Slide both hands out, then one turn of the big gear moves all four small gears the other way.', make() {
  const b = new Lv(), c = b.ring(0, 0, {r: 1.3, c: C.yellow}), G = [];
  [45, 135, 225, 315].forEach((a, k) => { const g = at(b, D(1.3, .8), a, {x: 0, y: 0}, {r: .8, c: k % 2 ? C.cyan : C.blue}); b.gear(c, g); G.push(g); });
  b.poke(G[0], 45, {c: C.purple}); b.poke(G[2], 225, {c: C.purple});
  G.forEach((g, k) => b.pin(g, [135, 225, 315, 45][k]));
  b.arm(nb(b, c, 0, {r: .6, c: C.pink}), c);
  return {b};
}});
L({name: 'Lift', element: 'Lock + Gear', rule: 'The key holder is a gear',
  challenge: 'The key sits on a gear pair, and a bar runs into each gear. Slide both bars out, turn the pair to drop the key, then the locked cabin ring and its chain can move.', make() {
  const b = new Lv(), d = D(1, 1), a = b.ring(-d / 2, 2, {c: C.green}), g = b.ring(d / 2, 2, {c: C.green});
  b.gear(a, g).pin(a, 90).pin(g, 90);
  b.poke(a, 180, {c: C.purple}); b.poke(g, 0, {c: C.purple, side: -1});
  const x = b.ring(0, -.6, {r: .9, c: C.red}), y = nb(b, x, 270, {r: .75, c: C.orange}), z = nb(b, y, 270, {r: .6, c: C.yellow});
  b.arm(x, y).arm(y, z).pin(z, 270).lock(x, g);
  return {b};
}});
L({name: 'Grid', element: 'All so far', hard: true, G: {1: 135, 3: 340, 4: 40, 5: 310, 7: 40}, rule: 'Hard: a 3 x 3 grid',
  challenge: 'Nine rings in a grid, linked like a maze, a locked center, and two bent bars run into the four corner rings, with a ring above and below in their way. Clear those, slide the frames out, then find the one corner that starts the chain.', make() {
  const b = new Lv(), d = D(.85, .85), g = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) g.push(b.ring((c - 1) * d, (1 - r) * d, {r: .85, c: [C.blue, C.green, C.orange, C.purple, C.red, C.purple, C.orange, C.green, C.blue][r * 3 + c]}));
  [[0, 1], [1, 2], [2, 5], [5, 8], [8, 7], [7, 6], [6, 3]].forEach(([a, c]) => b.arm(a, c));
  b.arm(g[4], g[1]).lock(g[4], g[3]);
  b.R[0].gap = 90; b.R[2].gap = 90; b.R[6].gap = 270; b.R[8].gap = 270;
  const i = .85 - .65, top = b.bar([[-d, d + i], [-d, d + 1.3], [d, d + 1.3], [d, d + i]], {c: C.cyan}), bot = b.bar([[-d, -d - i], [-d, -d - 1.3], [d, -d - 1.3], [d, -d - i]], {c: C.cyan});
  b.pinBar(top, .85, 1, 0).pinBar(top, .15, -1, 2).pinBar(bot, .85, 1, 0).pinBar(bot, .15, -1, 2);
  const T = b.ring(0, d + 2.55, {r: .9, c: C.pink, gap: 0}), Bt = b.ring(0, -d - 2.55, {r: .9, c: C.pink, gap: 180}); b.pin(T, 90).pin(Bt, 270);
  b.arm(T, nb(b, T, 180, {r: .6, c: C.yellow}));
  b.arm(nb(b, g[3], 180, {r: .65, c: C.yellow}), g[3]).arm(nb(b, g[5], 0, {r: .65, c: C.yellow}), g[5]);
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
L({name: 'Tower', element: 'All so far', rule: 'A tall build: a roof bar, a lock and gears',
  challenge: 'A tower of gears and bars. The roof is a bent bar in the tops of both gears, and it holds the key of the base. Climb down: roof, gears, base.', make() {
  const b = new Lv(), d = D(.9, .9), a = b.ring(-d / 2, 1.4, {r: .9, c: C.cyan, gap: 90}), g = b.ring(d / 2, 1.4, {r: .9, c: C.cyan, gap: 90});
  b.gear(a, g);
  const roof = b.bar([[-d / 2, 1.65], [-d / 2, 3.2], [d / 2, 3.2], [d / 2, 1.65]], {c: C.purple}); b.pinBar(roof, .6, 1, 0).pinBar(roof, .4, -1, 2);
  const base = b.ring(0, -1.1, {r: 1.1, c: C.red}); b.arm(base, a).arm(base, g).lock(base, roof);
  b.arm(nb(b, base, 225, {r: .7, c: C.yellow}), base).arm(nb(b, base, 315, {r: .7, c: C.yellow}), base);
  return {b};
}});
L({name: 'Fortress', element: 'Lock + Bomb + Gear', hard: true, G: {2: 290, 3: 180, 6: 80, 7: 15, 8: 15}, rule: 'Hard: two locked bombs, two knots',
  challenge: 'Two bomb rings are locked, their keys on the two gate bars run into the gear pair. Slide each gate out, then aim each bomb at its own knot; each has a free decoy on the other side.', make() {
  const b = new Lv(), d = D(1, 1), a = b.ring(-d / 2, 2.4, {c: C.green}), g = b.ring(d / 2, 2.4, {c: C.green}); b.gear(a, g).pin(a, 90).pin(g, 90);
  const m1 = b.ring(-2.2, 0, {c: C.orange}), m2 = b.ring(2.2, 0, {c: C.orange});
  const k1 = b.ring(-4.4, 0, {c: C.blue, closed: true}), k2 = b.ring(4.4, 0, {c: C.blue, closed: true}), f = b.ring(0, -.4, {c: C.cyan});
  const h1 = b.poke(a, 180, {c: C.purple}), h2 = b.poke(g, 0, {c: C.purple, side: -1});
  b.lock(m1, h1).lock(m2, h2).bomb(m1, 270).bomb(m2, 270).pin(m1, 45).pin(m2, 135).pin(k1, 90).pin(k2, 90).pin(f, 270);
  const y1 = nb(b, k1, 270, {r: .7, c: C.yellow}), y2 = nb(b, k2, 270, {r: .7, c: C.yellow}); b.arm(y1, k1).arm(y2, k2);
  b.arm(nb(b, y1, 0, {r: .55, c: C.pink}), y1).arm(nb(b, y2, 180, {r: .55, c: C.pink}), y2);
  b.arm(f, nb(b, f, 300, {r: .6, c: C.pink}));
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
  challenge: 'A big ring cages three small ones. Two hook its inner side and hold it; a bar runs from the gap of the third, out through the gap of the cage. Slide the bar out first, then turn the cage past both inner hooks and the hook below.', make() {
  const b = new Lv(), B = b.ring(0, 0, {r: 2.1, c: C.purple, gap: 90}), o = {x: 0, y: 0};
  const s1 = at(b, 1.25, 150, o, {r: .65, c: C.yellow}), s2 = at(b, 1.25, 30, o, {r: .65, c: C.yellow}), k = at(b, 1.15, 270, o, {r: .7, c: C.blue, gap: 90});
  b.armTo(s1, pol(2.1, 150)).armTo(s2, pol(2.1, 30));
  const h = b.bar([[0, -1.1], [0, 2.7]], {c: C.cyan}); b.pinBar(h, .32, 1);
  b.arm(nb(b, B, 300, {r: .7, c: C.green}), B);
  return {b};
}});
L({name: 'Gear bridge', element: 'Gear + Bar + Bomb', G: {1: 130, 2: 310, 5: 180}, rule: 'A row of four gears: alternate directions',
  challenge: 'Four gears in a row turn as one, each the other way from its neighbour. Bars run into gears 1 and 4; a bomb rides gear 3. Slide both bars out, then choose the one direction that sends the bomb into the knot below, not the free ring above.', make() {
  const b = new Lv(), d = D(.9, .9), G = [0, 1, 2, 3].map(k => b.ring((k - 1.5) * d, 0, {r: .9, c: k % 2 ? C.cyan : C.green}));
  for (let k = 0; k < 3; k++) b.gear(G[k], G[k + 1]);
  b.poke(G[0], 90, {c: C.purple}); b.poke(G[3], 90, {c: C.purple, side: -1});
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
L({name: 'Crown', element: 'All', hard: true, G: {4: 105, 5: 290, 6: 230, 7: 355, 9: 175}, rule: 'Finale: every rule in one picture',
  challenge: 'Finale: two bars run into the gear pair, the jewel is locked with its key on the left bar, and the bomb ring at the base has a decoy on the near side and the hook of the jewel blocking the far side. Bars, then gears and jewel, then send the bomb the long way to the knot.', make() {
  const b = new Lv(), d = D(.9, .9), a = b.ring(-d / 2, 2.6, {r: .9, c: C.green}), g = b.ring(d / 2, 2.6, {r: .9, c: C.green}); b.gear(a, g).pin(a, 90).pin(g, 90);
  const L = b.ring(-2.6, .3, {r: .9, c: C.yellow, gap: 40}), R = b.ring(2.6, .3, {r: .9, c: C.yellow, gap: 140}), J = b.ring(0, 0, {r: 1, c: C.red});
  const h1 = b.poke(a, 180, {c: C.purple}), h2 = b.poke(g, 0, {c: C.purple, side: -1});
  b.arm(J, L).arm(J, R).lock(J, h1);
  b.arm(L, nb(b, L, 220, {r: .65, c: C.pink})).arm(R, nb(b, R, 320, {r: .65, c: C.pink}));
  const M = b.ring(1.1, -2.3, {r: .95, c: C.orange}), K = b.ring(-1, -2.3, {r: .95, c: C.blue, closed: true}), F = b.ring(3.2, -2.3, {r: .95, c: C.blue});
  b.arm(J, M).bomb(M, 60).pin(K, 270).pin(F, 270).pin(M, 270);
  return {b};
}});
