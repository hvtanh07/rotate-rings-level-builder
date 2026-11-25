// Play-test rules of Rotate Rings (GDD 1.2 and 1.4), and a bot that solves a level.
import {TYPE, isRing, analyze, inGap, P, angleAt, wrap180} from './format.js';

export const RULES = {
  block: {name: 'Arms hold their ring', text: 'A ring whose arm still hooks another ring cannot turn. Free the hooked ring first.'},
  swing: {name: 'Arms swing off', text: 'Turning a ring swings its arms off the rings they hook (GDD 1.2, way 2).'}
};
export const RING_POINTS = 300;
const STEP = 2; // degrees per sweep step; smaller than the narrowest gap in the sample levels (12°)

export function newGame(lv, opts = {}) {
  const {locks, owner} = analyze(lv);
  const g = {
    lv, rule: opts.rule || 'block', locks: locks.map((L, k) => ({...L, id: k, on: true})), owner,
    turn: lv.rings.map(() => 0), alive: lv.rings.map(r => r.shape.type in {0: 1, 1: 1, 6: 1, 9: 1, 10: 1}),
    open: lv.rings.map(r => !r.locked), moves: 0, score: 0, events: [], history: []
  };
  // something already in a gap at the start is free at once
  for (const L of g.locks) if (inGap(lv.rings[L.ring], 0, L.point)) release(g, L, 'start');
  resolve(g);
  return g;
}
const snapshot = g => JSON.stringify({l: g.locks.map(L => L.on), t: g.turn, a: g.alive, o: g.open, m: g.moves, s: g.score});
export function undoMove(g) {
  const s = g.history.pop(); if (!s) return false;
  const d = JSON.parse(s); g.locks.forEach((L, k) => L.on = d.l[k]); g.turn = d.t; g.alive = d.a; g.open = d.o; g.moves = d.m; g.score = d.s; g.events = [];
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
    for (const {i: j, k} of grp) {
      g.turn[j] += d * k;
      const r = g.lv.rings[j];
      for (const L of locksOn(g, j)) if (inGap(r, g.turn[j], L.point)) release(g, L, 'gap');
      if (g.rule === 'swing') for (const L of armsOf(g, j)) release(g, L, 'swing');
    }
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
      else if (t === TYPE.PIN || t === TYPE.BAR) links = g.locks.filter(L => L.on && L.piece === i).length;
      else return;
      if (!links) { shatter(g, i); again = true; }
    });
  }
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
  return g.lv.rings.map((r, i) => i).filter(i => isRing(g.lv.rings[i]) && g.alive[i] && canTurn(g, i).ok && (locksOn(g, i).length || (g.rule === 'swing' && armsOf(g, i).length)));
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
  return best && {ring: best.ring, delta: best.delta};
}
// Plays the level with the bot. {won, moves:[{ring,delta}], stuck:[piece indexes], score}
export function solve(lv, rule = 'block', limit = 400) {
  const g = newGame(JSON.parse(JSON.stringify(lv)), {rule});
  const moves = [];
  while (!won(g) && moves.length < limit) {
    const m = botMove(g); if (!m) break;
    turnRing(g, m.ring, m.delta); moves.push(m);
  }
  return {won: won(g), moves, stuck: g.alive.map((a, i) => a ? i : -1).filter(i => i >= 0), score: g.score, game: g};
}
