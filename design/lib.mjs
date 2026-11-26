// Helpers to write levels by hand in code, and to playtest them (bot + full search).
import {TYPE, normalize, makePiece, placeArm, placeBar, P, dist, angleAt, wrap180, analyze, check, GAP_WIDTH, deg} from '../src/format.js';
import {newGame, turnRing, canTurn, won, solve, gearGroup} from '../src/engine.js';

export const C = {red: 0, blue: 1, green: 2, yellow: 3, pink: 4, orange: 5, purple: 6, cyan: 7};
const r5 = a => ((Math.round(a / 5) * 5) % 360 + 360) % 360;
export const pol = (r, a, c = {x: 0, y: 0}) => [c.x + r * Math.cos(a * Math.PI / 180), c.y + r * Math.sin(a * Math.PI / 180)];

export class Lv {
  constructor() { this.R = []; this.arms = []; this.pins = []; this.bombs = []; this.locks = []; this.gears = []; this.bars = []; this.wpins = []; this.barHooks = []; }
  // o: r (radius), c (color), gap (degrees, world; omit = auto), closed, gw (gap width)
  ring(x, y, o = {}) { this.R.push({x, y, r: o.r || 1, c: o.c ?? 1, gap: o.gap, closed: !!o.closed, gw: o.gw, gaps: o.gaps}); return this.R.length - 1; }
  arm(owner, target) { this.arms.push([owner, target]); return this; }
  pin(t, ang) { this.pins.push([t, ang]); return this; }
  bomb(h, ang) { this.bombs.push([h, ang]); return this; }
  // world point on ring i's tube at angle a
  on(i, a) { const q = this.R[i]; return pol(q.r, a, q); }
  // Straight Bar through world points [[x,y],...]; o.c color. Returns the bar's handle {bar: k}.
  bar(pts, o = {}) { this.bars.push({pts, c: o.c ?? 6}); return {bar: this.bars.length - 1}; }
  // a pin standing on its own at world point (on a bar, it holds the bar up); ang = where its head points
  pinAt(x, y, ang = 90) { this.wpins.push([x, y, ang]); return this; }
  // a pin on bar h at fraction t along segment seg, head pointing to side (+1 left / -1 right of the segment)
  pinBar(h, t = .5, side = 1, seg = 0) {
    const pts = this.bars[h.bar].pts, a = pts[seg], b = pts[seg + 1], x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
    return this.pinAt(x, y, deg(Math.atan2(b[1] - a[1], b[0] - a[0])) + 90 * side);
  }
  // an arm from ring `owner` hooking bar h at world point p (a bar has no gap: a knot only a Bomb clears)
  // an arm from ring `owner` to world point p on another ring's tube (e.g. a small ring inside a big one hooking its inner side)
  armTo(owner, p) { this.barHooks.push([owner, -1, p]); return this; }
  hookBar(owner, h, p) { this.barHooks.push([owner, h.bar, p]); return this; }
  lock(i, key) { this.locks.push([i, key]); return this; }
  gear(a, b) { this.gears.push([a, b]); return this; }
  // world points on ring i that something holds (hooks onto it, pins on it)
  holds(i) {
    const R = this.R, out = [];
    for (const [o, t] of this.arms) if (t === i) out.push(angleAt(R[t], R[o]));
    for (const [t, a] of this.pins) if (t === i) out.push(a);
    const q = R[i];
    for (const B of this.bars) for (const p of [B.pts[0], B.pts[B.pts.length - 1]]) if (Math.abs(Math.hypot(p[0] - q.x, p[1] - q.y) - q.r) < .05) out.push(angleAt(q, {x: p[0], y: p[1]}));
    for (const [x, y] of this.wpins) if (Math.abs(Math.hypot(x - q.x, y - q.y) - q.r) < .05) out.push(angleAt(q, {x, y}));
    for (const [o, , [x, y]] of this.barHooks) if (o !== i && Math.abs(Math.hypot(x - q.x, y - q.y) - q.r) < .05) out.push(angleAt(q, {x, y}));
    return out;
  }
  tails(i) { return [...this.arms.filter(([o]) => o === i).map(([o, t]) => angleAt(this.R[o], this.R[t])), ...this.barHooks.filter(([o]) => o === i).map(([o, , p]) => angleAt(this.R[o], {x: p[0], y: p[1]}))]; }
  autoGap(i) {
    const h = this.holds(i), t = this.tails(i), bomb = this.bombs.filter(([b]) => b === i).map(([, a]) => a);
    let best = 0, bs = -1;
    for (let a = 0; a < 360; a += 5) {
      const dh = h.length ? Math.min(...h.map(x => Math.abs(wrap180(a - x)))) : 180;
      const dt = Math.min(180, ...t.map(x => Math.abs(wrap180(a - x))), ...bomb.map(x => Math.abs(wrap180(a - x))));
      const s = Math.min(dh, dt < 40 ? dt - 100 : 180) + dh * .01;
      if (s > bs) { bs = s; best = a; }
    }
    return best;
  }
  build(meta) {
    const lv = normalize({id: meta.id, rings: []});
    this.R.forEach((q, i) => {
      const t = q.closed ? TYPE.CLOSED : TYPE.RING, gw = q.gw || (q.r >= 1 ? GAP_WIDTH : q.r >= .8 ? 55.27 : 56.0);
      const gaps = q.closed ? [] : (q.gaps || [meta.G?.[i] ?? q.gap ?? this.autoGap(i)]).map(g => ({centerDegrees: r5(g), widthDegrees: gw}));
      const p = makePiece(lv, t, {position: {x: q.x, y: q.y}, colorIndex: q.c});
      p.shape.radius = q.r; p.shape.gaps = gaps;
      lv.rings.push(p);
    });
    for (const B of this.bars) {
      const k = makePiece(lv, TYPE.BAR, {colorIndex: B.c});
      if (B.pts.length === 2) placeBar(k, {x: B.pts[0][0], y: B.pts[0][1]}, {x: B.pts[1][0], y: B.pts[1][1]});
      else { k.position.x = 0; k.position.y = 0; k.eulerAngles.z = 0; k.shape.points = B.pts.map(([x, y]) => ({x, y})); }
      lv.rings.push(k);
    }
    for (const [o, t] of this.arms) { const k = makePiece(lv, TYPE.CONNECTOR); lv.rings.push(k); placeArm(lv, lv.rings.length - 1, o, t); }
    for (const [o, , p] of this.barHooks) {
      const A = lv.rings[o], c = P(A), d = Math.hypot(p[0] - c.x, p[1] - c.y), u = {x: (p[0] - c.x) / d, y: (p[1] - c.y) / d};
      const tail = {x: c.x + u.x * A.shape.radius, y: c.y + u.y * A.shape.radius}, k = makePiece(lv, TYPE.CONNECTOR);
      k.position.x = (tail.x + p[0]) / 2; k.position.y = (tail.y + p[1]) / 2; k.eulerAngles.z = deg(Math.atan2(u.y, u.x));
      k.shape.legLength = Math.max(.05, d - A.shape.radius); k.colorIndex = A.colorIndex; lv.rings.push(k);
    }
    for (const [t, a] of this.pins) { const q = this.R[t], [x, y] = pol(q.r, a, q); lv.rings.push(makePiece(lv, TYPE.PIN, {position: {x, y}, eulerAngles: {z: r5(a)}, colorIndex: 0})); }
    for (const [x, y, a] of this.wpins) lv.rings.push(makePiece(lv, TYPE.PIN, {position: {x, y}, eulerAngles: {z: r5(a)}, colorIndex: 0}));
    for (const [h, a] of this.bombs) { const q = this.R[h], [x, y] = pol(q.r, a, q); lv.rings.push(makePiece(lv, TYPE.BOMB, {position: {x, y}, eulerAngles: {z: r5(a)}, colorIndex: 0})); }
    for (const [i, k0] of this.locks) {
      const k = typeof k0 === 'object' ? this.R.length + k0.bar : k0, r = lv.rings[i], kh = lv.rings[k];
      r.locked = true; r.keyHolder = k; r.lockAngle = r5(angleAt(P(r), P(kh)) + 180 + 40); r.keyAngle = r5(angleAt(P(kh), P(r)) + 40);
    }
    for (const [a, b] of this.gears) {
      const A = lv.rings[a], B = lv.rings[b], ta = Math.round(23 * A.shape.radius), tb = Math.round(23 * B.shape.radius);
      A.shape.gearTeeth = ta; B.shape.gearTeeth = tb; A.gearWith.push(b); B.gearWith.push(a);
      const th = angleAt(P(A), P(B));
      B.shape.gearPhase = ((180 + 180 / tb + 2 * th - A.shape.gearPhase) % 360 + 360) % 360;
    }
    Object.assign(lv, {tier: meta.tier ?? 0, difficulty: meta.difficulty ?? 0, seed: meta.seed ?? 1, tutorialRing: meta.tutorialRing ?? -1});
    for (const r of lv.rings) for (const k of ['x', 'y']) r.position[k] = Math.round(r.position[k] * 1e4) / 1e4;
    return lv;
  }
}

/* ---------- playtest ---------- */
const clone = g => ({...g, locks: g.locks.map(L => ({...L})), turn: [...g.turn], alive: [...g.alive], open: [...g.open], touch: g.touch.map(t => [...t]), events: [], history: []});
const key = g => g.alive.map(a => a ? 1 : 0).join('') + '|' + g.locks.map(L => L.on ? 1 : 0).join('') + '|' + g.turn.map(t => Math.round(((t % 360) + 360) % 360)).join(',');
// Player moves from a state: turn a ring one way until something happens (a link frees, a piece shatters, a bomb goes off).
export function moves(g) {
  const out = [];
  g.lv.rings.forEach((r, i) => {
    if (!g.alive[i] || !(r.shape.type <= 1) || !canTurn(g, i).ok) return;
    for (const dir of [1, -1]) {
      const c = clone(g), l0 = c.locks.filter(L => L.on).length, a0 = c.alive.filter(Boolean).length;
      let ev = null;
      for (let t = 15; t <= 360; t += 15) {
        const t0 = c.turn[i];
        turnRing(c, i, dir * 15, {count: false});
        const boom = c.events.some(e => e.type === 'explode'), bump = c.events.some(e => e.type === 'bump');
        if (boom || c.locks.filter(L => L.on).length < l0 || c.alive.filter(Boolean).length < a0) { ev = {ring: i, delta: dir * t, boom, cleared: a0 - c.alive.filter(Boolean).length}; break; }
        if (bump) { const moved = dir * (t - 15) + (c.turn[i] - t0); if (Math.abs(moved) > .5) ev = {ring: i, delta: moved, boom: false, bump: true, cleared: 0}; break; }
      }
      if (ev) out.push({...ev, g: c});
    }
  });
  return out;
}
// Can the level still be won from g? (memo search)
export function winnable(g, memo = new Map(), depth = 0, cap = Infinity) {
  if (won(g)) return true;
  const k = key(g); if (memo.has(k)) return memo.get(k);
  if (memo.size > cap) throw new Error('cap');
  memo.set(k, false);
  let ok = false;
  for (const m of moves(g)) { if (winnable(m.g, memo, depth + 1, cap)) { ok = true; break; } }
  memo.set(k, ok); return ok;
}
// Full report for one level.
export function playtest(lv) {
  const probs = check(lv).filter(p => p.lvl === 'bad' || /starts inside|nothing holds/.test(p.text));
  const g0 = newGame(JSON.parse(JSON.stringify(lv)));
  const rings = lv.rings.filter(r => r.shape.type <= 1).length;
  const startFree = moves(g0).map(m => m.ring).filter((v, i, a) => a.indexOf(v) === i).length;
  const memo = new Map();
  const canWin = winnable(g0, memo);
  // walk the shortest-move solution (BFS over event moves), counting trap moves (moves that make the level unwinnable)
  let traps = 0, choices = 0, path = [], maxCombo = 0, booms = 0, waves = 0;
  {
    let frontier = [{g: g0, path: []}], seen = new Set([key(g0)]), sol = null;
    while (frontier.length && !sol) {
      const next = [];
      for (const s of frontier) {
        for (const m of moves(s.g)) {
          const k = key(m.g); if (seen.has(k)) continue; seen.add(k);
          const p = [...s.path, {ring: m.ring, delta: m.delta, cleared: m.cleared, boom: m.boom, g: m.g, from: s.g}];
          if (won(m.g)) { sol = p; break; }
          next.push({g: m.g, path: p});
        }
        if (sol) break;
      }
      frontier = next.slice(0, 4000);
    }
    path = sol || [];
  }
  for (const st of path) {
    const ms = moves(st.from);
    choices += ms.length;
    for (const m of ms) if (!winnable(m.g, memo)) traps++;
    maxCombo = Math.max(maxCombo, st.cleared); if (st.boom) booms++;
  }
  const noBomb = JSON.parse(JSON.stringify(lv)); noBomb.rings = noBomb.rings.filter(r => r.shape.type !== TYPE.BOMB);
  const needsBomb = lv.rings.some(r => r.shape.type === TYPE.BOMB) ? !solve(noBomb).won : false;
  const bot = solve(lv);
  // careless player: random moves until won or stuck (seeded, 100 runs)
  let seed = 7, stuck = 0, rmoves = 0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let run = 0; run < 100; run++) {
    let g = newGame(JSON.parse(JSON.stringify(lv))), n = 0;
    while (!won(g) && n < 200) { const ms = moves(g); if (!ms.length) break; g = ms[Math.floor(rnd() * ms.length)].g; n++; }
    if (!won(g)) stuck++; rmoves += n;
  }
  return {probs: probs.map(p => p.text), rings, pieces: lv.rings.length, canWin, botWon: bot.won, botMoves: bot.moves.length, minMoves: path.length,
    startFree, traps, choices, stuckRate: stuck / 100, randMoves: rmoves / 100, trapRate: choices ? traps / choices : 0, maxCombo, booms, needsBomb, sweep: path.reduce((s, m) => s + Math.abs(m.delta), 0)};
}

// Difficulty: rings to read, the fewest moves that win (a bump that stops a turn counts), and how often a careless player gets stuck.
export const score = t => +(2 * t.rings + 2.5 * t.minMoves + 40 * t.stuckRate).toFixed(1);
