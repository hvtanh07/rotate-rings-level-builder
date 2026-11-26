// Level format of Rotate Rings: the same keys, in the same order, as the game's levels.json (Unity JsonUtility).
// Geometry helpers: which ring each connector, bar and pin rests on.

export const TYPE = {CLOSED: 0, RING: 1, CONNECTOR: 6, PIN: 9, BAR: 10, BOMB: 11};
export const TYPE_NAME = {0: 'Closed ring', 1: 'Ring', 6: 'Connector', 9: 'Pin', 10: 'Straight Bar', 11: 'Bomb'};
export const ID_PREFIX = {0: 'R', 1: 'R', 6: 'K', 9: 'H', 10: 'L', 11: 'B'};
export const isRing = r => r && (r.shape.type === TYPE.RING || r.shape.type === TYPE.CLOSED);

// colorIndex 0–7, in the order of the GDD's 8 template colors (3.2).
export const PALETTE = [
  {name: 'Red', hex: '#E5484D'}, {name: 'Blue', hex: '#2F80ED'}, {name: 'Green', hex: '#3DBE4A'}, {name: 'Yellow', hex: '#F5C21A'},
  {name: 'Pink', hex: '#F472B6'}, {name: 'Orange', hex: '#F2780F'}, {name: 'Purple', hex: '#8B45DB'}, {name: 'Cyan', hex: '#22B8D1'}
];
export const colorHex = i => (PALETTE[i] || {hex: '#9AA3B5'}).hex;

// Keys written as integers; every other number is a float and is written with a decimal point, like the game file.
const INT_KEYS = new Set(['version', 'mode', 'tier', 'seed', 'type', 'gearTeeth', 'colorIndex', 'keyHolder', 'tutorialRing', 'gearWith']);

const v3 = (x = 0, y = 0, z = 0) => ({x, y, z});
const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
const bool = (v, d) => (typeof v === 'boolean' ? v : d);
const vec = (o, d) => { o = o || {}; return {x: num(o.x, d.x), y: num(o.y, d.y), z: num(o.z, d.z), ...extra(o, ['x', 'y', 'z'])}; };
function extra(o, known) { const e = {}; for (const k of Object.keys(o || {})) if (!known.includes(k)) e[k] = o[k]; return e; }

const SHAPE_KEYS = ['id', 'type', 'radius', 'tubeRadius', 'gaps', 'flatRatio', 'legLength', 'arcDegrees', 'flexDepth', 'hook', 'points', 'gearTeeth', 'gearPhase'];
const RING_KEYS = ['shape', 'position', 'eulerAngles', 'rotationAxis', 'pivot', 'startAngle', 'limitAngle', 'minAngle', 'maxAngle', 'snapStep', 'colorIndex', 'slide', 'slideAxis', 'locked', 'keyHolder', 'lockAngle', 'keyAngle', 'gearWith'];
const LEVEL_KEYS = ['id', 'version', 'mode', 'liftDirection', 'tier', 'difficulty', 'seed', 'rings', 'tutorialRing'];

// Default values for a new piece of each type (taken from the sample levels).
export const SHAPE_DEFAULTS = {
  0: {radius: 1.0, tubeRadius: 0.15000000596046448, legLength: 1.2000000476837158, hook: false},
  1: {radius: 1.0, tubeRadius: 0.15000000596046448, legLength: 1.2000000476837158, hook: false},
  6: {radius: 0.2200000137090683, tubeRadius: 0.04500000178813934, legLength: 0.6000000238418579, hook: true},
  9: {radius: 0.2199999988079071, tubeRadius: 0.04500000178813934, legLength: 0.75, hook: false},
  10: {radius: 0.25999999046325684, tubeRadius: 0.09000000357627869, legLength: 1.2000000476837158, hook: false},
  // Bomb: new type (11), not in the game file yet. radius = size of the bomb.
  11: {radius: 0.25, tubeRadius: 0.05, legLength: 0.3, hook: false}
};
export const GAP_WIDTH = 46.982540130615234;

export function normalizeShape(s) {
  s = s || {};
  const t = num(s.type, 1), d = SHAPE_DEFAULTS[t] || SHAPE_DEFAULTS[1];
  return {
    id: typeof s.id === 'string' ? s.id : '', type: t, radius: num(s.radius, d.radius), tubeRadius: num(s.tubeRadius, d.tubeRadius),
    gaps: Array.isArray(s.gaps) ? s.gaps.map(g => ({centerDegrees: num(g && g.centerDegrees, 0), widthDegrees: num(g && g.widthDegrees, GAP_WIDTH), ...extra(g, ['centerDegrees', 'widthDegrees'])})) : [],
    flatRatio: num(s.flatRatio, 0.5), legLength: num(s.legLength, d.legLength), arcDegrees: num(s.arcDegrees, 240.0), flexDepth: num(s.flexDepth, 0.0),
    hook: bool(s.hook, d.hook), points: Array.isArray(s.points) ? s.points.map(p => ({x: num(p && p.x, 0), y: num(p && p.y, 0), ...extra(p, ['x', 'y'])})) : [],
    gearTeeth: num(s.gearTeeth, 0), gearPhase: num(s.gearPhase, 0.0), ...extra(s, SHAPE_KEYS)
  };
}
export function normalizeRing(r) {
  r = r || {};
  return {
    shape: normalizeShape(r.shape), position: vec(r.position, v3()), eulerAngles: vec(r.eulerAngles, v3()), rotationAxis: vec(r.rotationAxis, v3(0, 0, 1)),
    pivot: vec(r.pivot, v3()), startAngle: num(r.startAngle, 0.0), limitAngle: bool(r.limitAngle, false), minAngle: num(r.minAngle, -180.0), maxAngle: num(r.maxAngle, 180.0),
    snapStep: num(r.snapStep, 0.0), colorIndex: num(r.colorIndex, 0), slide: bool(r.slide, false), slideAxis: vec(r.slideAxis, v3(0, 1, 0)),
    locked: bool(r.locked, false), keyHolder: num(r.keyHolder, -1), lockAngle: num(r.lockAngle, 0.0), keyAngle: num(r.keyAngle, 0.0),
    gearWith: Array.isArray(r.gearWith) ? r.gearWith.filter(n => typeof n === 'number') : [], ...extra(r, RING_KEYS)
  };
}
export function normalize(lv) {
  lv = lv || {};
  return {
    id: typeof lv.id === 'string' ? lv.id : 'level_new', version: num(lv.version, 1), mode: num(lv.mode, 1), liftDirection: vec(lv.liftDirection, v3(0, 0, -1)),
    tier: num(lv.tier, 0), difficulty: num(lv.difficulty, 0.0), seed: num(lv.seed, 1), rings: Array.isArray(lv.rings) ? lv.rings.map(normalizeRing) : [],
    tutorialRing: num(lv.tutorialRing, -1), ...extra(lv, LEVEL_KEYS)
  };
}

/* ---------- writing ---------- */
export function fmtFloat(n) {
  if (!isFinite(n)) return '0.0';
  if (Number.isInteger(n)) return n.toFixed(1);
  const a = Math.abs(n);
  if (a < 1e-4) return n.toExponential().replace(/e([+-])(\d)$/, 'e$10$2');
  return String(n);
}
function write(v, key, ind, step) {
  const pad = ' '.repeat(ind + step);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    return '[\n' + v.map(x => pad + write(x, key, ind + step, step)).join(',\n') + '\n' + ' '.repeat(ind) + ']';
  }
  if (v && typeof v === 'object') {
    const ks = Object.keys(v);
    if (!ks.length) return '{}';
    return '{\n' + ks.map(k => pad + JSON.stringify(k) + ': ' + write(v[k], k, ind + step, step)).join(',\n') + '\n' + ' '.repeat(ind) + '}';
  }
  if (typeof v === 'number') return INT_KEYS.has(key) ? String(Math.round(v)) : fmtFloat(v);
  return JSON.stringify(v === undefined ? null : v);
}
// One level, laid out like a level object inside levels.json.
export const serialize = (lv, step = 4) => write(normalize(lv), '', 0, step);
// The whole game file.
export const serializeFile = (levels, meta = {}) => write({version: num(meta.version, 1), exportedAt: typeof meta.exportedAt === 'string' ? meta.exportedAt : '', levels: levels.map(normalize)}, '', 0, 4) + '\n';
// One line, for a sheet cell.
export const compact = lv => write(normalize(lv), '', 0, 0).replace(/\n/g, '');

/* ---------- reading ---------- */
// Accepts the game file, a JSON list of levels, one level, several level objects one after another, or Id/Level rows copied from the sheet.
export function parseLevels(text) {
  text = String(text || '').trim();
  if (!text) throw new Error('Nothing to read.');
  const pick = d => {
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.levels)) return d.levels;
    if (d && Array.isArray(d.rings)) return [d];
    throw new Error('This JSON has no levels. Expected the game file, a list of levels, or one level with "rings".');
  };
  try { return pick(JSON.parse(text)).map(normalize); } catch (e) { if (!(e instanceof SyntaxError)) throw e; }
  // sheet rows: Id<TAB>"json with "" quotes"
  const out = [];
  if (/\t/.test(text)) {
    const cells = splitTsv(text);
    for (const row of cells) for (const c of row) { const s = c.trim(); if (s.startsWith('{')) out.push(...pick(JSON.parse(s))); }
    if (out.length) return out.map(normalize);
  }
  // objects pasted one after another
  for (const chunk of splitObjects(text)) out.push(...pick(JSON.parse(chunk)));
  if (!out.length) throw new Error('Could not read any level from this text.');
  return out.map(normalize);
}
function splitTsv(t) {
  const rows = [[]]; let cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"' && cell === '') q = true;
    else if (ch === '\t') { rows[rows.length - 1].push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; rows[rows.length - 1].push(cell); cell = ''; rows.push([]); }
    else cell += ch;
  }
  rows[rows.length - 1].push(cell);
  return rows;
}
function splitObjects(t) {
  const out = []; let depth = 0, start = -1, str = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (str) { if (ch === '\\') i++; else if (ch === '"') str = false; continue; }
    if (ch === '"') str = true;
    else if (ch === '{') { if (!depth) start = i; depth++; }
    else if (ch === '}') { depth--; if (!depth && start >= 0) { out.push(t.slice(start, i + 1)); start = -1; } }
  }
  return out;
}

/* ---------- geometry ---------- */
export const rad = d => d * Math.PI / 180;
export const deg = r => r * 180 / Math.PI;
export const wrap180 = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a; };
export const wrap360 = a => ((a % 360) + 360) % 360;
export const P = r => ({x: r.position.x, y: r.position.y});
export const dirOf = r => { const a = rad(r.eulerAngles.z); return {x: Math.cos(a), y: Math.sin(a)}; };
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const angleAt = (c, p) => deg(Math.atan2(p.y - c.y, p.x - c.x));

// Connector: an arm from its owner ring's edge (tail) to a hook on another ring (head), centered on position, pointing along eulerAngles.z.
export function connectorEnds(r) {
  const d = dirOf(r), h = r.shape.legLength / 2, p = P(r);
  return {tail: {x: p.x - d.x * h, y: p.y - d.y * h}, head: {x: p.x + d.x * h, y: p.y + d.y * h}};
}
// Straight Bar: points are local to the bar, turned by eulerAngles.z.
export function barPoints(r) {
  const a = rad(r.eulerAngles.z), c = Math.cos(a), s = Math.sin(a), p = P(r);
  return r.shape.points.map(q => ({x: p.x + q.x * c - q.y * s, y: p.y + q.x * s + q.y * c}));
}
export const TOL = 0.06;
// Distance from p to a polyline.
export function segDist(p, pts) {
  let best = Infinity;
  for (let k = 0; k + 1 < pts.length; k++) {
    const a = pts[k], b = pts[k + 1], dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
    best = Math.min(best, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
  }
  return best;
}
export function barsThrough(lv, pt, tol = TOL) {
  const out = [];
  lv.rings.forEach((r, i) => { if (r.shape.type === TYPE.BAR && segDist(pt, barPoints(r)) < tol + r.shape.tubeRadius) out.push(i); });
  return out;
}
export function nearestBar(lv, pt, maxGap = 0.4) {
  let best = -1, bd = Infinity;
  lv.rings.forEach((r, i) => { if (r.shape.type !== TYPE.BAR) return; const d = segDist(pt, barPoints(r)); if (d < bd) { bd = d; best = i; } });
  return bd <= maxGap ? best : -1;
}
export function snapToBar(r, p) {
  const pts = barPoints(r); let best = p, bd = Infinity;
  for (let k = 0; k + 1 < pts.length; k++) {
    const a = pts[k], b = pts[k + 1], dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2)), q = {x: a.x + t * dx, y: a.y + t * dy}, d = dist(p, q);
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}
export function ringsThrough(lv, pt, skip = -1, tol = TOL) {
  const out = [];
  lv.rings.forEach((r, i) => { if (i !== skip && isRing(r) && Math.abs(dist(P(r), pt) - r.shape.radius) < tol) out.push(i); });
  return out.sort((a, b) => Math.abs(dist(P(lv.rings[a]), pt) - lv.rings[a].shape.radius) - Math.abs(dist(P(lv.rings[b]), pt) - lv.rings[b].shape.radius));
}
export function nearestRing(lv, pt, maxGap = 0.5) {
  let best = -1, bd = Infinity;
  lv.rings.forEach((r, i) => { if (!isRing(r)) return; const d = Math.abs(dist(P(r), pt) - r.shape.radius); if (d < bd) { bd = d; best = i; } });
  return bd <= maxGap ? best : -1;
}

// Every lock in the level, worked out from the geometry: which piece rests on which ring, and where.
// kind 'arm': connector piece, owned by ring `owner`, hooks ring `ring` at `point`.
// kind 'bar': end `end` of bar piece rests on ring `ring`. kind 'pin': pin piece locks ring `ring`.
export function analyze(lv) {
  const locks = [], owner = {}, host = {}, problems = [];
  lv.rings.forEach((r, i) => {
    const t = r.shape.type;
    if (t === TYPE.CONNECTOR) {
      const {tail, head} = connectorEnds(r);
      const o = ringsThrough(lv, tail)[0], tg = ringsThrough(lv, head, o === undefined ? -1 : o)[0];
      if (o === undefined) problems.push({lvl: 'bad', piece: i, text: 'The arm does not start on a ring.'});
      if (tg === undefined) problems.push({lvl: 'bad', piece: i, text: 'The hook does not rest on a ring.'});
      if (o !== undefined) owner[i] = o;
      if (o !== undefined && tg !== undefined) locks.push({kind: 'arm', piece: i, owner: o, ring: tg, point: head});
    } else if (t === TYPE.BAR) {
      const pts = barPoints(r);
      if (pts.length < 2) problems.push({lvl: 'bad', piece: i, text: 'A bar needs 2 or more points.'});
      const ends = pts.length ? [0, pts.length - 1] : [];
      for (const e of ends) {
        const tg = ringsThrough(lv, pts[e])[0];
        if (tg !== undefined) locks.push({kind: 'bar', piece: i, ring: tg, point: pts[e], end: e});
      }
    } else if (t === TYPE.PIN) {
      const tg = ringsThrough(lv, P(r))[0], bar = barsThrough(lv, P(r))[0];
      if (tg !== undefined) locks.push({kind: 'pin', piece: i, ring: tg, point: P(r)});
      else if (bar !== undefined) locks.push({kind: 'pin', piece: i, ring: bar, point: P(r), onBar: true});
      else problems.push({lvl: 'bad', piece: i, text: 'The pin does not stand on a ring or a bar.'});
    } else if (t === TYPE.BOMB) {
      const tg = ringsThrough(lv, P(r))[0], bar = barsThrough(lv, P(r))[0];
      if (tg !== undefined) host[i] = tg; else if (bar !== undefined) host[i] = bar;
      else problems.push({lvl: 'bad', piece: i, text: 'The bomb does not sit on a ring or a bar.'});
    }
  });
  return {locks, owner, host, problems};
}

// Gap of ring r, turned by `turn` degrees, contains point p?
export function inGap(r, turn, p) {
  if (r.shape.type !== TYPE.RING) return false;
  const a = angleAt(P(r), p);
  return r.shape.gaps.some(g => Math.abs(wrap180(a - (g.centerDegrees + r.eulerAngles.z + turn))) < g.widthDegrees / 2);
}

/* ---------- checks ---------- */
export function check(lv) {
  const out = [];
  const add = (lvl, text, piece) => out.push({lvl, text, piece});
  if (!lv.rings.some(isRing)) add('bad', 'The level has no ring.');
  const {locks, owner, problems} = analyze(lv);
  problems.forEach(p => add(p.lvl, `${pname(lv, p.piece)}: ${p.text}`, p.piece));
  const ids = {};
  lv.rings.forEach((r, i) => {
    const nm = pname(lv, i);
    if (!r.shape.id) add('warn', `Piece ${i} has no id.`, i);
    else if (ids[r.shape.id] !== undefined) add('warn', `${nm}: id is used twice (also piece ${ids[r.shape.id]}).`, i); else ids[r.shape.id] = i;
    if (!(r.shape.type in TYPE_NAME)) add('warn', `${nm}: type ${r.shape.type} is not known to the tool. It is kept as it is.`, i);
    if (r.colorIndex < 0 || r.colorIndex > 7) add('warn', `${nm}: colorIndex ${r.colorIndex} is outside 0–7.`, i);
    if (r.shape.type === TYPE.RING && !r.shape.gaps.length) add('bad', `${nm}: an open ring needs a gap (use Closed ring for none).`, i);
    if (r.shape.type === TYPE.CONNECTOR && owner[i] !== undefined && lv.rings[owner[i]].colorIndex !== r.colorIndex) add('warn', `${nm}: color is not the color of its ring ${pname(lv, owner[i])}.`, i);
    if (r.locked) {
      const k = r.keyHolder;
      if (!isRing(r)) add('bad', `${nm}: only a ring can be a Locked Ring.`, i);
      if (k < 0 || k >= lv.rings.length || k === i) add('bad', `${nm}: Locked Ring needs a key holder (keyHolder).`, i);
      else if (!isRing(lv.rings[k]) && lv.rings[k].shape.type !== TYPE.BAR) add('warn', `${nm}: the key holder ${pname(lv, k)} is not a ring or bar.`, i);
    } else if (r.keyHolder !== -1) add('warn', `${nm}: keyHolder is set but the ring is not locked.`, i);
    r.gearWith.forEach(j => {
      const o = lv.rings[j];
      if (!o || j === i) add('bad', `${nm}: gearWith ${j} is not a piece.`, i);
      else {
        if (!o.gearWith.includes(i)) add('warn', `${nm}: meshes with ${pname(lv, j)}, but not the other way round.`, i);
        if (!r.shape.gearTeeth || !o.shape.gearTeeth) add('warn', `${nm}: a Gear Ring needs gearTeeth.`, i);
        const d = dist(P(r), P(o)) - r.shape.radius - o.shape.radius;
        if (d < 0.2 || d > 1.2) add('warn', `${nm}: gear ${pname(lv, j)} is ${d.toFixed(2)} from its edge (sample levels: 0.6).`, i);
      }
    });
  });
  lv.rings.forEach((r, i) => { if (r.shape.type === TYPE.BAR && !locks.some(k => k.piece === i || k.ring === i)) add('warn', `${pname(lv, i)}: nothing holds this bar (no ring under its ends, no pin on it), so it shatters at once.`, i); });
  locks.forEach(L => { if (inGap(lv.rings[L.ring], 0, L.point)) add('warn', `${pname(lv, L.piece)} starts inside the gap of ${pname(lv, L.ring)}, so it is free at once.`, L.piece); });
  const t = lv.tutorialRing;
  if (t !== -1 && (!lv.rings[t] || !isRing(lv.rings[t]))) add('warn', `tutorialRing ${t} is not a ring.`);
  return out;
}
export const pname = (lv, i) => { const r = lv.rings[i]; return r ? (r.shape.id || TYPE_NAME[r.shape.type] || 'piece') + ` (#${i})` : `#${i}`; };
export const statusOf = issues => issues.some(x => x.lvl === 'bad') ? 'bad' : issues.some(x => x.lvl === 'warn') ? 'warn' : 'ok';

export function tally(lv) {
  const t = {rings: 0, closed: 0, connectors: 0, pins: 0, bars: 0, bombs: 0, locked: 0, gears: 0};
  lv.rings.forEach(r => {
    const k = r.shape.type;
    if (k === 1) t.rings++; else if (k === 0) t.closed++; else if (k === 6) t.connectors++; else if (k === 9) t.pins++; else if (k === 10) t.bars++; else if (k === 11) t.bombs++;
    if (r.locked) t.locked++; if (r.shape.gearTeeth) t.gears++;
  });
  return t;
}

/* ---------- making pieces ---------- */
export function nextId(lv, type) {
  const pre = ID_PREFIX[type] || 'X';
  let n = 0; const used = new Set(lv.rings.map(r => r.shape.id));
  while (used.has(pre + n)) n++;
  return pre + n;
}
export function makePiece(lv, type, over = {}) {
  const d = SHAPE_DEFAULTS[type] || SHAPE_DEFAULTS[1];
  const r = normalizeRing({shape: {type, id: nextId(lv, type), ...d, gaps: type === TYPE.RING ? [{centerDegrees: 0.0, widthDegrees: GAP_WIDTH}] : []}, snapStep: isRing({shape: {type}}) ? 15.0 : 0.0, colorIndex: type === TYPE.PIN || type === TYPE.BOMB ? 0 : 1});
  return deepMerge(r, over);
}
function deepMerge(a, b) {
  for (const k of Object.keys(b)) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') deepMerge(a[k], b[k]); else a[k] = b[k]; }
  return a;
}
// Put connector c between ring o (owner) and ring t, on the line between their centers.
export function placeArm(lv, c, o, t) {
  const A = lv.rings[o], B = lv.rings[t], pa = P(A), pb = P(B), d = dist(pa, pb) || 1;
  const u = {x: (pb.x - pa.x) / d, y: (pb.y - pa.y) / d};
  const tail = {x: pa.x + u.x * A.shape.radius, y: pa.y + u.y * A.shape.radius}, head = {x: pb.x - u.x * B.shape.radius, y: pb.y - u.y * B.shape.radius};
  const R = lv.rings[c];
  R.position.x = (tail.x + head.x) / 2; R.position.y = (tail.y + head.y) / 2;
  R.eulerAngles.z = deg(Math.atan2(u.y, u.x));
  R.shape.legLength = Math.max(0.05, dist(tail, head));
  R.colorIndex = A.colorIndex;
}
// Set a 2-point bar from world point a to world point b.
export function placeBar(r, a, b) {
  const m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}, h = dist(a, b) / 2;
  r.position.x = m.x; r.position.y = m.y; r.eulerAngles.z = deg(Math.atan2(b.y - a.y, b.x - a.x));
  r.shape.points = [{x: -h, y: 0.0}, {x: h, y: 0.0}];
}
export function snapToRing(r, p) {
  const c = P(r), d = dist(c, p) || 1;
  return {x: c.x + (p.x - c.x) / d * r.shape.radius, y: c.y + (p.y - c.y) / d * r.shape.radius};
}

// After pieces are deleted, fix keyHolder / gearWith / tutorialRing indexes.
export function removePieces(lv, idx) {
  const del = new Set(idx), map = []; let n = 0;
  lv.rings.forEach((r, i) => { map[i] = del.has(i) ? -1 : n++; });
  lv.rings = lv.rings.filter((r, i) => !del.has(i));
  lv.rings.forEach(r => {
    if (r.keyHolder >= 0) { r.keyHolder = map[r.keyHolder] ?? -1; if (r.keyHolder < 0) r.locked = false; }
    r.gearWith = r.gearWith.map(j => map[j]).filter(j => j >= 0);
  });
  if (lv.tutorialRing >= 0) lv.tutorialRing = map[lv.tutorialRing] ?? -1;
}

export function blankLevel(id) {
  const lv = normalize({id, rings: []});
  const a = makePiece(lv, TYPE.RING, {position: {x: 0.0, y: -1.3}, colorIndex: 5}); lv.rings.push(a);
  const b = makePiece(lv, TYPE.RING, {position: {x: 0.0, y: 1.3}, colorIndex: 1}); b.shape.gaps[0].centerDegrees = 90.0; lv.rings.push(b);
  const k = makePiece(lv, TYPE.CONNECTOR); lv.rings.push(k); placeArm(lv, 2, 1, 0);
  return lv;
}
