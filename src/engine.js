// Play-test rules of Rotate Rings (GDD 1.2 and 1.4), and a bot that solves a level.
import {TYPE, isRing, analyze, inGap, P, angleAt, wrap180, barPoints, segDist, dist, rad, connectorEnds, dirOf} from './format.js';

export const RULES = {
  block: {name: 'Arms hold their ring', text: 'A ring whose arm still hooks another ring cannot turn. Free the hooked ring first.'},
  // not the game's rule (designer, 2026-11-25); kept for comparison in tests
  swing: {name: 'Arms swing off', text: 'Turning a ring swings its arms off the rings they hook.'}
};
export const RING_POINTS = 300;
const STEP = 2; // degrees per sweep step; smaller than the narrowest gap in the sample levels (12°)

export function newGame(lv, opts = {}) {
  const {locks, owner, host} = analyze(lv);
  const g = {
    lv, rule: opts.rule || 'block', locks: locks.map((L, k) => ({...L, id: k, on: true})), owner, host,
    turn: lv.rings.map(() => 0), alive: lv.rings.map(r => r.shape.type in {0: 1, 1: 1, 6: 1, 9: 1, 10: 1, 11: 1}),
    open: lv.rings.map(r => !r.locked), touch: lv.rings.map(() => []), rest: [], moves: 0, score: 0, events: [], history: []
  };
  // pieces a bomb touches at the start do not set it off; only a new touch does
  lv.rings.forEach((r, b) => { if (r.shape.type === TYPE.BOMB) g.touch[b] = bombContacts(g, b); });
  // something already in a gap at the start is free at once
  for (const L of g.locks) if (inGap(lv.rings[L.ring], 0, L.point)) release(g, L, 'start');
  resolve(g);
  return g;
}
const snapshot = g => JSON.stringify({l: g.locks.map(L => L.on), t: g.turn, a: g.alive, o: g.open, m: g.moves, s: g.score, h: g.touch});
export function undoMove(g) {
  const s = g.history.pop(); if (!s) return false;
  const d = JSON.parse(s); g.locks.forEach((L, k) => L.on = d.l[k]); g.turn = d.t; g.alive = d.a; g.open = d.o; g.moves = d.m; g.score = d.s; g.touch = d.h; g.events = [];
  return true;
}

// Starts one player move (a drag); the drag then turns the ring with turnRing(..., {count:false}).
export function beginMove(g) { g.history.push(snapshot(g)); g.moves++; }

function release(g, L, why) { if (!L.on) return; L.on = false; g.events.push({type: 'release', lock: L.id, why}); }
const armsOf = (g, i) => g.locks.filter(L => L.on && L.kind === 'arm' && L.owner === i);
const locksOn = (g, i) => g.locks.filter(L => L.on && L.ring === i);
export const won = g => g.alive.every(a => !a);
export const left = g => g.alive.filter(Boolean).length;

// Rings that turn together: meshed gears turn the other way, by the tooth ratio (same teeth: same angle).
export function gearGroup(g, i) {
  const out = [{i, k: 1}], seen = new Set([i]);
  for (let q = 0; q < out.length; q++) {
    const {i: a, k} = out[q], ra = g.lv.rings[a];
    for (const b of ra.gearWith) {
      if (seen.has(b) || !g.lv.rings[b] || !g.alive[b]) continue;
      const rb = g.lv.rings[b], ta = ra.shape.gearTeeth || 1, tb = rb.shape.gearTeeth || 1;
      seen.add(b); out.push({i: b, k: -k * ta / tb});
    }
  }
  return out;
}
// Can ring i be turned now? {ok, why, by}
export function canTurn(g, i) {
  const r = g.lv.rings[i];
  if (!r || !isRing(r) || !g.alive[i]) return {ok: false, why: 'not a ring'};
  for (const {i: j} of gearGroup(g, i)) {
    if (!g.open[j]) return {ok: false, why: 'locked', by: j};
    if (g.rule === 'block') { const a = armsOf(g, j); if (a.length) return {ok: false, why: 'arm', by: j, lock: a[0].id}; }
  }
  return {ok: true};
}

// Turn ring i by delta degrees (positive = counter-clockwise). Sweeps in small steps; a lock is freed when a gap passes it.
export function turnRing(g, i, delta, {count = true} = {}) {
  const c = canTurn(g, i); g.events = [];
  if (!c.ok) { g.events.push({type: 'shake', piece: i, why: c.why, by: c.by}); return false; }
  if (!delta) return true;
  if (count) { g.history.push(snapshot(g)); g.moves++; }
  const grp = gearGroup(g, i), n = Math.max(1, Math.ceil(Math.abs(delta) / STEP));
  for (let s = 1; s <= n; s++) {
    const d = delta / n;
    let blocked = false;
    for (const {i: j, k} of grp) { const r = g.lv.rings[j]; if (r.limitAngle) { const t = g.turn[j] + d * k; if (t < r.minAngle - 1e-6 || t > r.maxAngle + 1e-6) blocked = true; } }
    if (blocked) break;
    const t1 = [...g.turn]; for (const {i: j, k} of grp) t1[j] += d * k;
    const bump = bumpOf(g, new Set(grp.map(q => q.i)), g.turn, t1);
    if (bump) { g.events.push({type: 'bump', ...bump}); break; }
    for (const {i: j, k} of grp) {
      g.turn[j] += d * k;
      const r = g.lv.rings[j];
      for (const L of locksOn(g, j)) if (inGap(r, g.turn[j], L.point)) release(g, L, 'gap');
      if (g.rule === 'swing') for (const L of armsOf(g, j)) release(g, L, 'swing');
    }
    checkBombs(g);
  }
  resolve(g);
  return true;
}

// Pieces with no links left shatter; a shattered key holder opens its lock. Repeats until nothing changes.
export function resolve(g) {
  const R = g.lv.rings;
  for (let again = true; again;) {
    again = false;
    R.forEach((r, i) => {
      if (!g.alive[i]) return;
      const t = r.shape.type;
      let links;
      if (t === TYPE.RING || t === TYPE.CLOSED) links = locksOn(g, i).length + armsOf(g, i).length;
      else if (t === TYPE.CONNECTOR) links = g.owner[i] !== undefined ? (g.alive[g.owner[i]] ? 1 : 0) : g.locks.filter(L => L.on && L.piece === i).length;
      else if (t === TYPE.PIN) links = g.locks.filter(L => L.on && L.piece === i).length;
      else if (t === TYPE.BAR) links = g.locks.filter(L => L.on && (L.piece === i || (L.ring === i && L.kind === 'arm'))).length; // its ends on rings and hooks on it; pins only hold it in the air (designer, 2026-11-26) and go with it
      else if (t === TYPE.BOMB) links = g.host[i] !== undefined && g.alive[g.host[i]] ? 1 : 0;
      else return;
      if (!links) { shatter(g, i); again = true; }
    });
  }
}
/* ---------- solid parts (designer, 2026-11-26) ---------- */
// Pins, connectors, bars and bombs are solid: none can pass through another. Ring tubes still overlap freely.
// A part turns with its carrier ring: an arm with its owner, a bomb with its ring. Pins and bars stay put.
export function carrierOf(g, i) {
  const t = g.lv.rings[i].shape.type;
  if (t === TYPE.CONNECTOR) return g.owner[i];
  if (t === TYPE.BOMB) { const h = g.host[i]; return h !== undefined && isRing(g.lv.rings[h]) ? h : undefined; }
  return undefined;
}
const SOLID = {6: 1, 9: 1, 10: 1, 11: 1};
// Capsules {a, b, r} of part i, in its rest pose (before its carrier turns).
function restShape(r) {
  const t = r.shape.type, out = [];
  if (t === TYPE.CONNECTOR) {
    const {tail, head} = connectorEnds(r), w = Math.max(.1, r.shape.tubeRadius * 2.6) / 2;
    out.push({a: tail, b: head, r: w});
    if (r.shape.hook) out.push({a: head, b: head, r: r.shape.radius * .62 + r.shape.tubeRadius * 1.1});
  } else if (t === TYPE.PIN) {
    const p = P(r), d = dirOf(r), L = r.shape.legLength * .55, e = {x: p.x + d.x * L, y: p.y + d.y * L};
    out.push({a: p, b: e, r: .05}, {a: e, b: e, r: r.shape.radius * .75}, {a: p, b: p, r: r.shape.radius * .6});
  } else if (t === TYPE.BAR) {
    const pts = barPoints(r);
    for (let k = 0; k + 1 < pts.length; k++) out.push({a: pts[k], b: pts[k + 1], r: r.shape.tubeRadius});
  } else if (t === TYPE.BOMB) { const p = P(r); out.push({a: p, b: p, r: r.shape.radius}); }
  return out;
}
const rot = (p, c, a) => { const cs = Math.cos(a), sn = Math.sin(a), dx = p.x - c.x, dy = p.y - c.y; return {x: c.x + dx * cs - dy * sn, y: c.y + dx * sn + dy * cs}; };
function shapeAt(g, i, turn) {
  const R = g.lv.rings, base = g.rest[i] || (g.rest[i] = restShape(R[i])), c = carrierOf(g, i);
  if (c === undefined || !turn[c]) return base;
  const o = P(R[c]), a = rad(turn[c]);
  return base.map(q => ({a: rot(q.a, o, a), b: rot(q.b, o, a), r: q.r}));
}
function segSeg(p1, p2, q1, q2) {
  const cr = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = cr(q1, q2, p1), d2 = cr(q1, q2, p2), d3 = cr(p1, p2, q1), d4 = cr(p1, p2, q2);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  return Math.min(segDist(p1, [q1, q2]), segDist(p2, [q1, q2]), segDist(q1, [p1, p2]), segDist(q2, [p1, p2]));
}
// Gap between two parts (negative = overlapping).
function partGap(A, B) {
  let best = Infinity;
  for (const x of A) for (const y of B) best = Math.min(best, segSeg(x.a, x.b, y.a, y.b) - x.r - y.r);
  return best;
}
// First pair of parts that the step from turn0 to turn1 pushes into each other, or null.
// Parts that part m could ever touch while its carrier turns (static parts outside its swept ring of space are left out). Cached per game.
function candidates(g, m) {
  const cache = g.cand || (g.cand = []);
  if (cache[m]) return cache[m];
  const R = g.lv.rings, cm = carrierOf(g, m), c = P(R[cm]), base = shapeAt(g, m, R.map(() => 0));
  let lo = Infinity, hi = 0;
  for (const q of base) for (const p of [q.a, q.b]) { const d = dist(p, c); lo = Math.min(lo, d - q.r); hi = Math.max(hi, d + q.r); }
  for (const q of base) lo = Math.min(lo, segDist(c, [q.a, q.b]) - q.r);
  const out = [];
  R.forEach((r, o) => {
    if (o === m || !SOLID[r.shape.type]) return;
    const co = carrierOf(g, o);
    if (co === cm) return;
    if (co !== undefined) { out.push(o); return; }
    let olo = Infinity, ohi = 0;
    for (const q of shapeAt(g, o, R.map(() => 0))) { olo = Math.min(olo, segDist(c, [q.a, q.b]) - q.r); for (const p of [q.a, q.b]) ohi = Math.max(ohi, dist(p, c) + q.r); }
    if (ohi < lo || olo > hi) return;
    out.push(o);
  });
  return (cache[m] = out);
}
function bumpOf(g, moving, turn0, turn1) {
  const R = g.lv.rings;
  for (let m = 0; m < R.length; m++) {
    if (!g.alive[m] || !SOLID[R[m].shape.type]) continue;
    const cm = carrierOf(g, m); if (cm === undefined || !moving.has(cm)) continue;
    const cand = candidates(g, m); if (!cand.length) continue;
    const A0 = shapeAt(g, m, turn0), A1 = shapeAt(g, m, turn1);
    for (const o of cand) {
      if (!g.alive[o]) continue;
      const co = carrierOf(g, o);
      if (co === cm) continue;
      if (co !== undefined && moving.has(co) && o < m) continue; // pair already checked from the other side
      const tm = R[m].shape.type, to = R[o].shape.type;
      if ((tm === TYPE.BOMB && to === TYPE.BAR) || (to === TYPE.BOMB && tm === TYPE.BAR)) continue; // a bomb on a bar goes off instead
      const d1 = partGap(A1, shapeAt(g, o, turn1));
      if (d1 >= 0) continue;
      const d0 = partGap(A0, shapeAt(g, o, turn0));
      if (d1 < d0 - 1e-6) return {piece: m, by: o};
    }
  }
  return null;
}
/* ---------- Bomb ---------- */
// Where bomb b is now: it turns with its ring; on a bar it stays put.
export function bombPos(g, b) {
  const r = g.lv.rings[b], h = g.host[b], p = P(r);
  if (h === undefined || !isRing(g.lv.rings[h])) return p;
  const c = P(g.lv.rings[h]), a = rad(g.turn[h]), dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a)};
}
// Rings and bars that bomb b touches now (not its own piece). A ring's gap does not count as touching.
export function bombContacts(g, b) {
  const R = g.lv.rings, p = bombPos(g, b), br = R[b].shape.radius * .5, out = [];
  R.forEach((r, j) => {
    if (j === b || j === g.host[b] || !g.alive[j]) return;
    if (isRing(r)) { const c = P(r); if (Math.abs(dist(p, c) - r.shape.radius) < r.shape.tubeRadius + br && !inGap(r, g.turn[j], p)) out.push(j); }
    else if (r.shape.type === TYPE.BAR && segDist(p, barPoints(r)) < r.shape.tubeRadius + br) out.push(j);
  });
  return out;
}
// A bomb that comes to touch another ring or bar blows up: its own piece and the one it touched both shatter.
function checkBombs(g) {
  g.lv.rings.forEach((r, b) => {
    if (r.shape.type !== TYPE.BOMB || !g.alive[b]) return;
    const now = bombContacts(g, b), hit = now.find(j => !g.touch[b].includes(j));
    if (hit === undefined) { g.touch[b] = now; return; }
    const h = g.host[b];
    g.events.push({type: 'explode', piece: b, host: h, hit, at: bombPos(g, b)});
    g.alive[b] = false;
    if (h !== undefined) shatter(g, h, 'bomb');
    shatter(g, hit, 'bomb');
  });
}

function shatter(g, i, why = 'free') {
  if (!g.alive[i]) return;
  const R = g.lv.rings;
  g.alive[i] = false; g.events.push({type: 'shatter', piece: i, why});
  if (isRing(R[i])) g.score += RING_POINTS;
  g.locks.forEach(L => { if (L.on && (L.piece === i || L.ring === i || L.owner === i)) release(g, L, 'gone'); });
  R.forEach((r, j) => { if (r.locked && r.keyHolder === i && !g.open[j]) { g.open[j] = true; g.events.push({type: 'unlock', piece: j, from: i}); } });
}

/* ---------- boosters (GDD 1.5) ---------- */
// Hint: rings that can turn and still have something to free.
export function hint(g) {
  const out = g.lv.rings.map((r, i) => i).filter(i => isRing(g.lv.rings[i]) && g.alive[i] && canTurn(g, i).ok && (locksOn(g, i).length || (g.rule === 'swing' && armsOf(g, i).length)));
  if (!out.length) { const m = bombMove(g); if (m) out.push(m.ring); }
  return out;
}
// Saw: cuts one connector or bar.
export function saw(g, i) {
  const r = g.lv.rings[i]; g.events = [];
  if (!r || !g.alive[i] || (r.shape.type !== TYPE.CONNECTOR && r.shape.type !== TYPE.BAR)) return false;
  g.history.push(snapshot(g));
  g.locks.forEach(L => { if (L.on && L.piece === i) release(g, L, 'saw'); });
  if (r.shape.type === TYPE.CONNECTOR) shatter(g, i, 'saw');
  resolve(g); return true;
}
// Remove: takes one ring (or pin / bar) off the board.
export function removePiece(g, i) {
  const r = g.lv.rings[i]; g.events = [];
  if (!r || !g.alive[i] || r.shape.type === TYPE.CONNECTOR) return false;
  g.history.push(snapshot(g));
  shatter(g, i, 'remove');
  g.lv.rings.forEach((c, j) => { if (c.shape.type === TYPE.CONNECTOR && g.owner[j] === i) shatter(g, j, 'remove'); });
  resolve(g); return true;
}

/* ---------- bot ---------- */
// Smallest turn of ring i, in direction dir (+1/-1), that brings a gap of `r` (turned already by base) over point p. Infinity if never.
function firstHit(r, base, p, dir) {
  if (r.shape.type !== TYPE.RING) return Infinity;
  const a = angleAt(P(r), p);
  let best = Infinity;
  for (const gp of r.shape.gaps) {
    const c = gp.centerDegrees + r.eulerAngles.z + base, h = gp.widthDegrees / 2;
    // need dir*t such that |wrap(a - (c + dir*t))| < h; first t >= 0
    let t = dir > 0 ? wrap180(a - h - c) : wrap180(c - h - a);
    t = ((t % 360) + 360) % 360; if (t > 360 - 2 * h) t = 0; // already inside
    best = Math.min(best, t + 0.5);
  }
  return best;
}
// One bot move: {ring, delta} or null when stuck.
export function botMove(g) {
  let best = null;
  g.lv.rings.forEach((r, i) => {
    if (!isRing(r) || !g.alive[i] || !canTurn(g, i).ok) return;
    const grp = gearGroup(g, i);
    for (const dir of [1, -1]) {
      let need = 0, frees = 0;
      for (const {i: j, k} of grp) {
        const rj = g.lv.rings[j], ls = locksOn(g, j);
        for (const L of ls) {
          const sgn = Math.sign(dir * k), t = firstHit(rj, g.turn[j], L.point, sgn);
          if (t === Infinity) continue;
          const ti = t / Math.abs(k);
          if (j === i || ti <= 360) { need = Math.max(need, ti); frees++; }
        }
        if (g.rule === 'swing' && armsOf(g, j).length) { need = Math.max(need, r.snapStep || 15); frees += armsOf(g, j).length; }
      }
      if (!frees || need > 360) continue;
      const step = r.snapStep || 1, delta = dir * Math.min(360, Math.ceil(need / step) * step);
      const score = frees * 1000 - Math.abs(delta);
      if (!best || score > best.score) best = {ring: i, delta, score};
    }
  });
  if (best) return {ring: best.ring, delta: best.delta};
  return bombMove(g);
}
const cloneGame = g => ({...g, locks: g.locks.map(L => ({...L})), turn: [...g.turn], alive: [...g.alive], open: [...g.open], touch: g.touch.map(t => [...t]), events: [], history: []});
// No turn frees a lock: look for the smallest turn that sets off a bomb (or frees anything at all).
function bombMove(g) {
  let best = null;
  g.lv.rings.forEach((r, i) => {
    if (!isRing(r) || !g.alive[i] || !canTurn(g, i).ok) return;
    const step = r.snapStep || 15;
    for (const dir of [1, -1]) {
      const c = cloneGame(g), before = c.alive.filter(Boolean).length;
      for (let t = step; t <= 360; t += step) {
        turnRing(c, i, dir * step, {count: false});
        if (c.alive.filter(Boolean).length < before) { if (!best || t < Math.abs(best.delta)) best = {ring: i, delta: dir * t}; break; }
      }
    }
  });
  return best;
}
// Player moves from a state: turn one ring one way until something happens (a link frees, a piece shatters, a bomb goes off).
export function eventMoves(g) {
  const out = [];
  g.lv.rings.forEach((r, i) => {
    if (!g.alive[i] || !isRing(r) || !canTurn(g, i).ok) return;
    const step = r.snapStep || 15;
    for (const dir of [1, -1]) {
      const c = cloneGame(g), l0 = c.locks.filter(L => L.on).length, a0 = c.alive.filter(Boolean).length;
      for (let t = step; t <= 360; t += step) {
        const t0 = c.turn[i];
        turnRing(c, i, dir * step, {count: false});
        const boom = c.events.some(e => e.type === 'explode'), bump = c.events.some(e => e.type === 'bump');
        if (boom || c.locks.filter(L => L.on).length < l0 || c.alive.filter(Boolean).length < a0) { out.push({ring: i, delta: dir * t, boom, g: c}); break; }
        if (bump) { const moved = dir * (t - step) + (c.turn[i] - t0); if (Math.abs(moved) > .5) out.push({ring: i, delta: moved, bump: true, g: c}); break; }
      }
    }
  });
  return out;
}
const stateKey = g => g.alive.map(a => a ? 1 : 0).join('') + '|' + g.locks.map(L => L.on ? 1 : 0).join('') + '|' + g.turn.map(t => Math.round(((t % 360) + 360) % 360)).join(',');
// Full search for a winning line (used when the greedy bot gets stuck: a bomb on the wrong ring, or parts that bump). null if none.
export function searchSolve(lv, rule = 'block', maxStates = 30000) {
  const seen = new Set(); let n = 0;
  const dfs = g => {
    if (won(g)) return [];
    const k = stateKey(g); if (seen.has(k) || ++n > maxStates) return null; seen.add(k);
    for (const m of eventMoves(g)) { const r = dfs(m.g); if (r) return [{ring: m.ring, delta: m.delta}, ...r]; }
    return null;
  };
  return dfs(newGame(JSON.parse(JSON.stringify(lv)), {rule}));
}
// Plays the level with the bot. {won, moves:[{ring,delta}], stuck:[piece indexes], score, searched}
export function solve(lv, rule = 'block', limit = 400) {
  const play = list => {
    const g = newGame(JSON.parse(JSON.stringify(lv)), {rule}), moves = [];
    if (list) for (const m of list) { turnRing(g, m.ring, m.delta); moves.push(m); }
    else while (!won(g) && moves.length < limit) { const m = botMove(g); if (!m) break; const k0 = stateKey(g); turnRing(g, m.ring, m.delta); if (stateKey(g) === k0) break; moves.push(m); }
    return {won: won(g), moves, stuck: g.alive.map((a, i) => a ? i : -1).filter(i => i >= 0), score: g.score, game: g};
  };
  const r = play();
  if (r.won) return r;
  const line = searchSolve(lv, rule);
  return line ? {...play(line), searched: true, greedyStuck: true} : r;
}
