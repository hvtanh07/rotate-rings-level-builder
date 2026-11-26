import './style.css';
import ORIGINAL from './data/levels.json';
import {TYPE, TYPE_NAME, PALETTE, colorHex, isRing, normalize, normalizeRing, serialize, serializeFile, compact, parseLevels, analyze, check, statusOf, tally, pname,
  makePiece, placeArm, placeBar, snapToRing, nearestRing, ringsThrough, removePieces, blankLevel, connectorEnds, barPoints, P, dist, angleAt, rad, deg, wrap180, nextId} from './format.js';
import {RULES, newGame, beginMove, turnRing, canTurn, undoMove, won, left, hint, saw, removePiece, botMove, solve} from './engine.js';
import {drawLevel, bounds, shardsAt} from './render.js';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const NS = 'http://www.w3.org/2000/svg';
const STORE = 'rotateRingsLevelBuilder.v1';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1nyJ1k3zGlLKoiFaT5fMqq8r27lMgC8l7iSyxq2gokow/edit';
const CELL_LIMIT = 50000;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const r3 = n => Math.round(n * 1000) / 1000;
const PRAISE = ['Great!', 'Excellent!', 'Amazing!', 'Incredible!'];

/* ---------- state ---------- */
const ORIG_LEVELS = (ORIGINAL.levels || []).map(normalize);
let levels = [], cur = 0, meta = {version: ORIGINAL.version ?? 1, exportedAt: ORIGINAL.exportedAt ?? ''};
let tab = 'level', mode = 'edit', tool = 'select', sel = new Set(), pick = null;
let undo = [], redo = [], lastSnap = '';
let prefs = {grid: 0.05, ids: false, rule: 'block'}; // rule confirmed by the designer: a ring whose arm hooks another ring is locked
let view = null;
const L = () => levels[cur];

const hash = t => { let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return String(h >>> 0); };
const BASE = hash(JSON.stringify(ORIGINAL));
let savedBase = BASE;
function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
  if (saved && Array.isArray(saved.levels) && saved.levels.length) { levels = saved.levels.map(normalize); cur = Math.min(saved.cur | 0, levels.length - 1); savedBase = saved.base || ''; if (saved.meta) meta = saved.meta; }
  else { levels = clone(ORIG_LEVELS); cur = 0; }
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(STORE + '.prefs') || '{}')); } catch (e) {}
  prefs.rule = 'block';
}
const STALE = 'The game data built into the tool changed since you last saved here. Press Reset to game data to load it (export first to keep your edits).';
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify({levels, cur, base: savedBase, meta})); $('#saveNote').textContent = savedBase === BASE ? 'Changes are saved in this browser.' : STALE; }
  catch (e) { $('#saveNote').textContent = 'This browser is not saving changes. Export before you close the page.'; }
}
const savePrefs = () => { try { localStorage.setItem(STORE + '.prefs', JSON.stringify(prefs)); } catch (e) {} };
const origById = id => ORIG_LEVELS.find(o => o.id === id);
const isChanged = lv => { const o = origById(lv.id); return !o || serialize(o) !== serialize(lv); };

/* ---------- history ---------- */
function resetHistory() { undo = []; redo = []; lastSnap = JSON.stringify(L()); syncUndo(); }
function commit() {
  const s = JSON.stringify(L()); if (s === lastSnap) return;
  undo.push(lastSnap); if (undo.length > 200) undo.shift(); redo = []; lastSnap = s; persist(); syncUndo(); refreshList(); refreshChecks();
}
function doUndo() { if (!undo.length) return; redo.push(lastSnap); lastSnap = undo.pop(); levels[cur] = JSON.parse(lastSnap); afterHistory(); }
function doRedo() { if (!redo.length) return; undo.push(lastSnap); lastSnap = redo.pop(); levels[cur] = JSON.parse(lastSnap); afterHistory(); }
function afterHistory() { sel = new Set([...sel].filter(i => i < L().rings.length)); persist(); syncUndo(); renderAll(); }
function syncUndo() { $('#tUndo').disabled = !undo.length; $('#tRedo').disabled = !redo.length; }

/* ---------- level list ---------- */
let listStatus = [];
const refreshAllStatus = () => { listStatus = levels.map(lv => statusOf(check(lv))); };
function refreshList() {
  listStatus[cur] = statusOf(check(L()));
  const q = $('#lvSearch').value.trim().toLowerCase();
  $('#lvList').innerHTML = levels.map((lv, i) => {
    if (q && !(lv.id.toLowerCase().includes(q) || String(i + 1) === q || ('tier ' + lv.tier) === q)) return '';
    const st = listStatus[i] || 'ok', ch = isChanged(lv), t = tally(lv), el = [];
    if (t.bars) el.push('bar'); if (t.pins) el.push('pin'); if (t.locked) el.push('lock'); if (t.gears) el.push('gear'); if (t.closed) el.push('closed');
    return `<li><button type="button" class="lv" data-i="${i}" aria-current="${i === cur}"><span class="n">${i + 1}</span><span><span class="t">${esc(lv.id)}${ch ? ' <i class="sr">changed</i>' : ''}</span><span class="m">${ch ? '<i>● </i>' : ''}T${lv.tier} · D${(+lv.difficulty).toFixed(1)} · ${t.rings + t.closed} rings${el.length ? ' · ' + el.join(', ') : ''}</span></span><span class="dot ${st}" title="${st === 'ok' ? 'No problems' : st === 'warn' ? 'Has warnings' : 'Has errors'}"></span></button></li>`;
  }).join('');
  const a = $('#lvList [aria-current="true"]'); if (a) a.scrollIntoView({block: 'nearest'});
}
function selectLevel(i) {
  if (i < 0 || i >= levels.length) return;
  if (mode === 'play') setMode('edit');
  cur = i; sel = new Set(); pick = null; view = null; resetHistory(); persist(); renderAll();
}
$('#lvList').addEventListener('click', e => { const b = e.target.closest('.lv'); if (b) selectLevel(+b.dataset.i); });
$('#lvSearch').addEventListener('input', refreshList);
function uniqueId(base) { let n = base, k = 2; while (levels.some(l => l.id === n)) n = `${base}_${k++}`; return n; }
function nextLevelId() { const n = Math.max(0, ...levels.map(l => +((/(\d+)$/.exec(l.id) || [0, 0])[1]))) + 1; return uniqueId('level_' + String(n).padStart(3, '0')); }
$('#lvNew').addEventListener('click', () => { const lv = blankLevel(nextLevelId()); lv.seed = Math.floor(Math.random() * 2e6); levels.splice(cur + 1, 0, lv); refreshAllStatus(); selectLevel(cur + 1); toast(`Made ${lv.id}.`); });
$('#lvDup').addEventListener('click', () => { const c = clone(L()); c.id = uniqueId(L().id + '_copy'); levels.splice(cur + 1, 0, c); refreshAllStatus(); selectLevel(cur + 1); toast(`Made ${c.id}.`); });
$('#lvUp').addEventListener('click', () => { if (cur < 1) return; [levels[cur - 1], levels[cur]] = [levels[cur], levels[cur - 1]]; cur--; refreshAllStatus(); persist(); refreshList(); });
$('#lvDown').addEventListener('click', () => { if (cur >= levels.length - 1) return; [levels[cur + 1], levels[cur]] = [levels[cur], levels[cur + 1]]; cur++; refreshAllStatus(); persist(); refreshList(); });
function arm(btn, label, fn) {
  if (btn.classList.contains('armed')) { btn.classList.remove('armed'); btn.textContent = btn.dataset.label; fn(); return; }
  btn.dataset.label = btn.textContent; btn.classList.add('armed'); btn.textContent = label;
  setTimeout(() => { if (btn.classList.contains('armed')) { btn.classList.remove('armed'); btn.textContent = btn.dataset.label; } }, 3500);
}
$('#lvDel').addEventListener('click', e => arm(e.currentTarget, 'Confirm delete', () => {
  if (levels.length <= 1) { toast('Keep at least one level.'); return; }
  const n = L().id; levels.splice(cur, 1); cur = Math.min(cur, levels.length - 1); refreshAllStatus(); persist(); selectLevel(cur); toast(`Deleted ${n}.`);
}));
$('#btnReset').addEventListener('click', e => arm(e.currentTarget, 'Confirm reset', () => {
  levels = clone(ORIG_LEVELS); meta = {version: ORIGINAL.version ?? 1, exportedAt: ORIGINAL.exportedAt ?? ''}; cur = 0; savedBase = BASE; refreshAllStatus(); persist(); selectLevel(0);
  toast(`Back to the game data: ${levels.length} levels.`);
}));

/* ---------- view (world box) ---------- */
const svg = $('#view');
function fitView() { view = bounds(L()); applyView(); }
function applyView() {
  if (!view) view = bounds(L());
  svg.setAttribute('viewBox', `${view.x} ${-(view.y + view.h)} ${view.w} ${view.h}`);
  drawGrid();
}
function drawGrid() {
  const r = svg.getBoundingClientRect(), k = Math.max(view.w / Math.max(1, r.width), view.h / Math.max(1, r.height));
  const cx = view.x + view.w / 2, cy = view.y + view.h / 2, W = r.width * k / 2 + 1, H = r.height * k / 2 + 1;
  const x0 = Math.floor((cx - W) * 2) / 2, x1 = cx + W, y0 = Math.floor((cy - H) * 2) / 2, y1 = cy + H;
  let s = '';
  if ((x1 - x0) < 120) {
    for (let x = x0; x <= x1; x += .5) s += `<line class="gridl" x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
    for (let y = y0; y <= y1; y += .5) s += `<line class="gridl" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>`;
  }
  s += `<line class="axis" x1="${x0}" y1="0" x2="${x1}" y2="0"/><line class="axis" x1="0" y1="${y0}" x2="0" y2="${y1}"/>`;
  $('#grid').innerHTML = s;
}
function toWorld(e) {
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  const q = p.matrixTransform(svg.getScreenCTM().inverse()); return {x: q.x, y: -q.y};
}
svg.addEventListener('wheel', e => {
  e.preventDefault(); if (!view) return;
  const p = toWorld(e), k = Math.exp(e.deltaY * .0015);
  const w = Math.min(80, Math.max(1.5, view.w * k)), h = view.h * w / view.w;
  view = {x: p.x - (p.x - view.x) * w / view.w, y: p.y - (p.y - view.y) * h / view.h, w, h}; applyView();
}, {passive: false});
window.addEventListener('resize', () => view && drawGrid());
const snapV = v => prefs.grid > 0 ? Math.round(v / prefs.grid) * prefs.grid : v;
const snapP = p => ({x: r3(snapV(p.x)), y: r3(snapV(p.y))});

/* ---------- rendering ---------- */
function renderAll() {
  $('#lvTitle').textContent = L().id;
  refreshList(); syncTools(); if (!view) fitView();
  if (mode === 'edit') renderEdit(); else renderPlay();
  renderPane(); refreshChecks();
}
function renderEdit() {
  const lv = L(), {locks, owner} = analyze(lv);
  const links = [];
  locks.forEach(Lk => { if (sel.has(Lk.piece) || sel.has(Lk.ring) || sel.has(Lk.owner)) links.push({a: Lk.point, b: P(lv.rings[Lk.ring]), kind: Lk.kind}); });
  lv.rings.forEach((r, i) => { if (r.locked && r.keyHolder >= 0 && lv.rings[r.keyHolder] && (sel.has(i) || sel.has(r.keyHolder))) links.push({a: P(r), b: P(lv.rings[r.keyHolder]), kind: 'key'}); r.gearWith.forEach(j => { if (lv.rings[j] && sel.has(i)) links.push({a: P(r), b: P(lv.rings[j]), kind: 'gear'}); }); });
  $('#scene').innerHTML = drawLevel(lv, {sel, owner, links, ids: prefs.ids, tutorial: lv.tutorialRing});
  $('#ui').innerHTML = handles(lv) + (pick ? pickMark(lv) : '');
  svg.classList.remove('play');
}
function pickMark(lv) {
  if (pick.ring !== undefined && lv.rings[pick.ring]) { const r = lv.rings[pick.ring]; return `<circle class="pick" cx="${r.position.x}" cy="${r.position.y}" r="${r.shape.radius}"/>` + (pick.point ? `<circle class="hdl" cx="${pick.point.x}" cy="${pick.point.y}" r=".09"/>` : ''); }
  return '';
}
function handles(lv) {
  if (sel.size !== 1 || tool !== 'select') return '';
  const i = [...sel][0], r = lv.rings[i]; if (!r) return '';
  const t = r.shape.type, h = (cls, p, k) => `<circle class="hdl ${cls}" data-h="${k}" cx="${p.x}" cy="${p.y}" r=".11"/>`;
  let s = '';
  if (isRing(r)) {
    const c = P(r), R = r.shape.radius;
    r.shape.gaps.forEach((g, k) => { const a = rad(g.centerDegrees + r.eulerAngles.z); s += h('gap', {x: c.x + R * Math.cos(a), y: c.y + R * Math.sin(a)}, 'gap:' + k); });
    const ra = rad((r.shape.gaps[0] ? r.shape.gaps[0].centerDegrees : 0) + 180 + 35);
    s += h('rad', {x: c.x + (R + .25) * Math.cos(ra), y: c.y + (R + .25) * Math.sin(ra)}, 'rad');
  } else if (t === TYPE.CONNECTOR) { const e = connectorEnds(r); s += h('', e.tail, 'tail') + h('', e.head, 'head'); }
  else if (t === TYPE.BAR) barPoints(r).forEach((p, k) => { s += h('', p, 'p:' + k); });
  return s;
}

/* ---------- editing geometry ---------- */
function setConnector(r, tail, head) {
  r.position.x = r3((tail.x + head.x) / 2); r.position.y = r3((tail.y + head.y) / 2);
  r.eulerAngles.z = r3(deg(Math.atan2(head.y - tail.y, head.x - tail.x)));
  r.shape.legLength = Math.max(.05, r3(dist(tail, head)));
}
function setBarWorld(r, pts) {
  if (pts.length === 2) { placeBar(r, pts[0], pts[1]); r.position.x = r3(r.position.x); r.position.y = r3(r.position.y); r.eulerAngles.z = r3(r.eulerAngles.z); r.shape.points.forEach(q => { q.x = r3(q.x); }); return; }
  const a = rad(r.eulerAngles.z), c = Math.cos(a), s = Math.sin(a), p = P(r);
  r.shape.points = pts.map(q => { const dx = q.x - p.x, dy = q.y - p.y; return {x: r3(dx * c + dy * s), y: r3(-dx * s + dy * c)}; });
}
// Move pieces `ids` by (dx,dy) in lv (built from base); pieces resting on a moved ring follow it.
function movePieces(base, ids, dx, dy) {
  const lv = clone(base), moved = new Set(ids), {locks, owner} = analyze(base);
  const mv = p => ({x: r3(p.x + dx), y: r3(p.y + dy)});
  lv.rings.forEach((r, i) => { if (moved.has(i)) { r.position.x = r3(r.position.x + dx); r.position.y = r3(r.position.y + dy); } });
  base.rings.forEach((r, i) => {
    if (moved.has(i)) return;
    const t = r.shape.type;
    if (t === TYPE.CONNECTOR) {
      const e = connectorEnds(r), hook = locks.find(k => k.piece === i), o = owner[i];
      const tm = o !== undefined && moved.has(o), hm = hook && moved.has(hook.ring);
      if (tm || hm) setConnector(lv.rings[i], tm ? mv(e.tail) : e.tail, hm ? mv(e.head) : e.head);
    } else if (t === TYPE.BAR) {
      const pts = barPoints(r), ends = locks.filter(k => k.piece === i);
      if (ends.some(k => moved.has(k.ring))) { const np = pts.map((p, k) => ends.some(e => e.end === k && moved.has(e.ring)) ? mv(p) : p); setBarWorld(lv.rings[i], np); }
    } else if (t === TYPE.PIN) {
      const k = locks.find(k => k.piece === i); if (k && moved.has(k.ring)) { lv.rings[i].position.x = r3(r.position.x + dx); lv.rings[i].position.y = r3(r.position.y + dy); }
    }
  });
  return lv;
}
// Ring i of base gets a new radius: everything resting on it is moved onto the new circle.
function resizeRing(base, i, R) {
  const lv = clone(base), {locks, owner} = analyze(base), ring = lv.rings[i];
  ring.shape.radius = R;
  base.rings.forEach((r, j) => {
    const t = r.shape.type;
    if (t === TYPE.CONNECTOR) {
      const e = connectorEnds(r), hook = locks.find(k => k.piece === j);
      const tm = owner[j] === i, hm = hook && hook.ring === i;
      if (tm || hm) setConnector(lv.rings[j], tm ? snapToRing(ring, e.tail) : e.tail, hm ? snapToRing(ring, e.head) : e.head);
    } else if (t === TYPE.BAR) {
      const pts = barPoints(r), ends = locks.filter(k => k.piece === j && k.ring === i);
      if (ends.length) setBarWorld(lv.rings[j], pts.map((p, k) => ends.some(e => e.end === k) ? snapToRing(ring, p) : p));
    } else if (t === TYPE.PIN) {
      const k = locks.find(k => k.piece === j); if (k && k.ring === i) { const q = snapToRing(ring, P(r)); lv.rings[j].position.x = r3(q.x); lv.rings[j].position.y = r3(q.y); }
    }
  });
  return lv;
}
const snapOnRing = (lv, p, skip = -1) => { const k = nearestRing(lv, p, .45); return k >= 0 && k !== skip ? {ring: k, p: snapToRing(lv.rings[k], p)} : {ring: -1, p: snapP(p)}; };
function ringUnder(e, w) {
  const g = e.target.closest && e.target.closest('[data-i]');
  if (g) { const i = +g.dataset.i, r = L().rings[i]; if (isRing(r)) return i; }
  return nearestRing(L(), w, .45);
}

/* ---------- design pointer ---------- */
let drag = null;
svg.addEventListener('pointerdown', e => {
  if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) { startPan(e); return; }
  if (mode === 'play') { playDown(e); return; }
  const w = toWorld(e), lv = L(), hEl = e.target.closest('.hdl'), pEl = e.target.closest('[data-i]');
  if (hEl && sel.size === 1) { drag = {kind: 'handle', h: hEl.dataset.h, i: [...sel][0], base: clone(lv)}; svg.setPointerCapture(e.pointerId); return; }
  if (tool === 'select') {
    if (pEl) {
      const i = +pEl.dataset.i;
      if (e.shiftKey || e.ctrlKey || e.metaKey) { sel.has(i) ? sel.delete(i) : sel.add(i); }
      else if (!sel.has(i)) sel = new Set([i]);
      drag = {kind: 'move', start: w, base: clone(lv), ids: [...sel], moved: false};
      svg.setPointerCapture(e.pointerId); renderEdit(); renderPane(); return;
    }
    if (!e.shiftKey) sel = new Set();
    renderEdit(); renderPane(); startPan(e); return;
  }
  addWithTool(e, w);
});
function startPan(e) {
  drag = {kind: 'pan', sx: e.clientX, sy: e.clientY, v: {...view}, moved: false};
  svg.classList.add('panning'); svg.setPointerCapture(e.pointerId);
}
svg.addEventListener('pointermove', e => {
  const w = toWorld(e);
  if (mode === 'edit') $('#coords').textContent = `x ${w.x.toFixed(2)}  y ${w.y.toFixed(2)}`;
  if (!drag) return;
  if (drag.kind === 'pan') {
    const r = svg.getBoundingClientRect(), k = Math.max(view.w / r.width, view.h / r.height);
    view = {...drag.v, x: drag.v.x - (e.clientX - drag.sx) * k, y: drag.v.y + (e.clientY - drag.sy) * k}; drag.moved = true; applyView(); return;
  }
  if (drag.kind === 'turn') { playMove(e, w); return; }
  if (drag.kind === 'move') {
    let dx = w.x - drag.start.x, dy = w.y - drag.start.y;
    if (prefs.grid > 0) { dx = snapV(dx); dy = snapV(dy); }
    if (!drag.moved && Math.hypot(dx, dy) < .02) return;
    drag.moved = true; levels[cur] = movePieces(drag.base, drag.ids, dx, dy); renderEdit(); return;
  }
  if (drag.kind === 'handle') {
    const lv = clone(drag.base), r = lv.rings[drag.i], [h, k] = drag.h.split(':');
    if (h === 'gap') { const a = angleAt(P(r), w) - r.eulerAngles.z; r.shape.gaps[+k].centerDegrees = Math.round(((a % 360) + 360) % 360 / 5) * 5; levels[cur] = lv; }
    else if (h === 'rad') { const R = Math.max(.2, r3(snapV(dist(P(r), w) - .25) || .2)); levels[cur] = resizeRing(drag.base, drag.i, R); }
    else if (h === 'tail' || h === 'head') {
      const e0 = connectorEnds(r), sp = snapOnRing(lv, w);
      setConnector(r, h === 'tail' ? sp.p : e0.tail, h === 'head' ? sp.p : e0.head);
      if (h === 'tail' && sp.ring >= 0) r.colorIndex = lv.rings[sp.ring].colorIndex;
      levels[cur] = lv;
    } else if (h === 'p') { const pts = barPoints(r); pts[+k] = snapOnRing(lv, w).p; setBarWorld(r, pts); levels[cur] = lv; }
    drag.moved = true; renderEdit();
  }
});
function endDrag(e) {
  if (!drag) return;
  const d = drag; drag = null; svg.classList.remove('panning');
  if (d.kind === 'turn') { finishTurn(d); return; }
  if (d.kind === 'pan') return;
  if (d.moved) { commit(); renderAll(); }
}
svg.addEventListener('pointerup', endDrag);
svg.addEventListener('pointercancel', endDrag);
svg.addEventListener('contextmenu', e => e.preventDefault());

const TOOL_HINT = {
  select: '', ring: 'Click to place an open ring.', closed: 'Click to place a closed ring.',
  connector: 'Click the ring that owns the arm.', connector2: 'Now click the ring the arm hooks.',
  bar: 'Click a point on the first ring.', bar2: 'Now click a point on the second ring.',
  pin: 'Click on a ring to stand a pin on it.', gear: 'Click the first gear ring.', gear2: 'Now click the ring it meshes with.',
  lock: 'Click the ring to lock.', lock2: 'Now click the piece that holds the key (a ring or bar).'
};
function addWithTool(e, w) {
  const lv = L();
  if (tool === 'ring' || tool === 'closed') {
    const t = tool === 'ring' ? TYPE.RING : TYPE.CLOSED, p = snapP(w);
    const r = makePiece(lv, t, {position: {x: p.x, y: p.y}, colorIndex: Math.floor(Math.random() * 8)});
    lv.rings.push(r); sel = new Set([lv.rings.length - 1]); commit(); renderAll(); return;
  }
  if (tool === 'pin') {
    const k = ringUnder(e, w); if (k < 0) { toast('Click on a ring.'); return; }
    const q = snapToRing(lv.rings[k], w), a = angleAt(P(lv.rings[k]), q);
    const r = makePiece(lv, TYPE.PIN, {position: {x: r3(q.x), y: r3(q.y)}, eulerAngles: {z: r3(a)}, colorIndex: 0});
    lv.rings.push(r); sel = new Set([lv.rings.length - 1]); commit(); renderAll(); return;
  }
  const k = tool === 'lock' && pick ? pieceUnder(e, w) : ringUnder(e, w);
  if (k < 0) { toast(tool === 'lock' && pick ? 'Click a ring or bar.' : 'Click on a ring.'); return; }
  if (!pick) { pick = {ring: k, point: tool === 'bar' ? snapToRing(lv.rings[k], w) : null}; renderEdit(); syncTools(); return; }
  if (k === pick.ring) { toast('Pick a different piece.'); return; }
  const a = pick.ring;
  if (tool === 'connector') { const r = makePiece(lv, TYPE.CONNECTOR); lv.rings.push(r); placeArm(lv, lv.rings.length - 1, a, k); roundPiece(r); sel = new Set([lv.rings.length - 1]); }
  else if (tool === 'bar') { const r = makePiece(lv, TYPE.BAR, {colorIndex: 6}); placeBar(r, pick.point, snapToRing(lv.rings[k], w)); roundPiece(r); lv.rings.push(r); sel = new Set([lv.rings.length - 1]); }
  else if (tool === 'gear') {
    for (const [x, y] of [[a, k], [k, a]]) { const r = lv.rings[x]; if (!r.shape.gearTeeth) r.shape.gearTeeth = Math.max(8, Math.round(23 * r.shape.radius)); if (!r.gearWith.includes(y)) r.gearWith.push(y); }
    sel = new Set([a, k]);
    const gap = dist(P(lv.rings[a]), P(lv.rings[k])) - lv.rings[a].shape.radius - lv.rings[k].shape.radius;
    if (Math.abs(gap - .6) > .25) toast(`Meshed. Edges are ${gap.toFixed(2)} apart; sample gears sit 0.6 apart.`);
  } else if (tool === 'lock') {
    const r = lv.rings[a], kh = lv.rings[k];
    r.locked = true; r.keyHolder = k; r.lockAngle = Math.round(wrapPos(angleAt(P(r), P(kh)))); r.keyAngle = isRing(kh) ? Math.round(wrapPos(angleAt(P(kh), P(r)))) : 0.0;
    sel = new Set([a]);
  }
  pick = null; commit(); renderAll();
}
const wrapPos = a => ((a % 360) + 360) % 360;
function pieceUnder(e, w) {
  const g = e.target.closest && e.target.closest('[data-i]');
  if (g) { const i = +g.dataset.i, r = L().rings[i]; if (isRing(r) || r.shape.type === TYPE.BAR) return i; }
  return nearestRing(L(), w, .45);
}
function roundPiece(r) { r.position.x = r3(r.position.x); r.position.y = r3(r.position.y); r.eulerAngles.z = r3(r.eulerAngles.z); r.shape.legLength = r3(r.shape.legLength); r.shape.points.forEach(q => { q.x = r3(q.x); q.y = r3(q.y); }); }

function setTool(t) { tool = t; pick = null; if (t !== 'select') sel = new Set(); syncTools(); if (mode === 'edit') renderEdit(); }
function syncTools() {
  $$('#tools [data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
  $('#tIds').setAttribute('aria-pressed', String(!!prefs.ids)); $('#gridSel').value = String(prefs.grid);
  $('#toolHint').textContent = TOOL_HINT[tool + (pick ? '2' : '')] || '';
}
$('#tools').addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
$('#gridSel').addEventListener('change', e => { prefs.grid = +e.target.value; savePrefs(); });
$('#tFit').addEventListener('click', fitView);
$('#tIds').addEventListener('click', () => { prefs.ids = !prefs.ids; savePrefs(); syncTools(); mode === 'edit' ? renderEdit() : renderPlay(); });
$('#tUndo').addEventListener('click', doUndo);
$('#tRedo').addEventListener('click', doRedo);

function deleteSel() {
  if (!sel.size) return;
  const lv = L(), {owner} = analyze(lv), del = new Set(sel);
  lv.rings.forEach((r, i) => { if (r.shape.type === TYPE.CONNECTOR && del.has(owner[i])) del.add(i); });
  removePieces(lv, [...del]); sel = new Set(); commit(); renderAll(); toast(`Deleted ${del.size} piece${del.size > 1 ? 's' : ''}.`);
}
function duplicateSel() {
  if (!sel.size) return;
  const lv = L(), add = [];
  for (const i of [...sel].sort((a, b) => a - b)) { const c = clone(lv.rings[i]); c.shape.id = nextId(lv, c.shape.type); c.position.x = r3(c.position.x + .5); c.position.y = r3(c.position.y - .5); c.gearWith = []; c.locked = false; c.keyHolder = -1; lv.rings.push(c); add.push(lv.rings.length - 1); }
  sel = new Set(add); commit(); renderAll();
}
function nudge(dx, dy) { if (!sel.size) return; levels[cur] = movePieces(L(), [...sel], dx, dy); commit(); renderAll(); }

/* ---------- play test ---------- */
let game = null, auto = null, booster = null, hintSet = new Set(), shakeIdx = -1, animating = false;
function setMode(m) {
  if (m === mode) return;
  mode = m; stopAuto(); booster = null; pick = null;
  $('#modeEdit').setAttribute('aria-pressed', String(m === 'edit')); $('#modePlay').setAttribute('aria-pressed', String(m === 'play'));
  $$('[data-edit]').forEach(x => x.hidden = m !== 'edit'); $$('[data-play]').forEach(x => x.hidden = m !== 'play');
  if (m === 'play') restart(); else { $('#banner').hidden = true; $('#fx').innerHTML = ''; $('#ui').innerHTML = ''; }
  renderAll();
}
$('#modeEdit').addEventListener('click', () => setMode('edit'));
$('#modePlay').addEventListener('click', () => setMode('play'));
function restart() { stopAuto(); game = newGame(clone(L()), {rule: prefs.rule}); hintSet = new Set(); booster = null; $('#fx').innerHTML = ''; $('#banner').hidden = true; flushEvents(); syncBoosters(); renderPlay(); }
function renderPlay() {
  if (!game) return;
  $('#scene').innerHTML = drawLevel(game.lv, {turn: game.turn, alive: game.alive, open: game.open, owner: game.owner, hint: hintSet, ids: prefs.ids, shakeIdx, tutorial: game.moves ? -1 : game.lv.tutorialRing});
  $('#ui').innerHTML = '';
  svg.classList.add('play');
  const rule = RULES[game.rule];
  $('#pStats').innerHTML = `<span>Moves <b>${game.moves}</b></span><span>Score <b>${game.score}</b></span><span>Pieces left <b>${left(game)}</b></span>`;
}
function pieceCenter(i) {
  const r = game.lv.rings[i];
  if (r.shape.type === TYPE.BAR) { const p = barPoints(r); return p.length ? {x: (p[0].x + p[p.length - 1].x) / 2, y: (p[0].y + p[p.length - 1].y) / 2} : P(r); }
  if (r.shape.type === TYPE.CONNECTOR) { const o = game.owner[i]; if (o !== undefined) { const c = P(game.lv.rings[o]), a = rad(game.turn[o]), p = P(r), dx = p.x - c.x, dy = p.y - c.y; return {x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a)}; } }
  return P(r);
}
function flushEvents() {
  if (!game) return;
  const fx = $('#fx');
  for (const ev of game.events) {
    if (ev.type === 'shatter') {
      const r = game.lv.rings[ev.piece], c = pieceCenter(ev.piece), big = isRing(r);
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = shardsAt(c, colorHex(r.colorIndex), big ? 16 : 7, big ? r.shape.radius + .5 : .4) + (big ? `<text class="praise" transform="translate(${c.x} ${c.y}) scale(1 -1)">${PRAISE[Math.floor(Math.random() * PRAISE.length)]}</text>` : '');
      fx.appendChild(g); setTimeout(() => g.remove(), 900);
    }
    if (ev.type === 'shake') { shakeIdx = ev.piece; setTimeout(() => { shakeIdx = -1; renderPlay(); }, 330); const by = ev.by; toast(ev.why === 'locked' ? `${pname(game.lv, by)} is locked. Clear the piece with its key first.` : ev.why === 'arm' ? `${pname(game.lv, by)} cannot turn: its arm still hooks another ring.` : 'This piece does not turn.'); }
    if (ev.type === 'unlock') toast(`The key flew to ${pname(game.lv, ev.piece)}: it is open now.`);
  }
  game.events = [];
  if (won(game)) { $('#banner').className = 'banner won'; $('#banner').textContent = `Level clear in ${game.moves} move${game.moves === 1 ? '' : 's'}. Score ${game.score}.`; $('#banner').hidden = false; stopAuto(); }
  else if (auto === null && !botMove(game) && !hint(game).length) { $('#banner').className = 'banner lost'; $('#banner').textContent = 'Stuck: no ring can free anything. See Check for the pieces left.'; $('#banner').hidden = false; }
  else $('#banner').hidden = true;
}
function playTarget(e) {
  const g = e.target.closest('[data-i]'); if (!g) return -1;
  return +g.dataset.i;
}
function playDown(e) {
  if (!game || animating) return;
  const i = playTarget(e);
  if (i < 0) { startPan(e); return; }
  const r = game.lv.rings[i];
  if (booster === 'saw') { if (saw(game, i)) { booster = null; syncBoosters(); hintSet = new Set(); flushEvents(); renderPlay(); } else toast('The Saw cuts a connector or a bar.'); return; }
  if (booster === 'remove') { if (removePiece(game, i)) { booster = null; syncBoosters(); hintSet = new Set(); flushEvents(); renderPlay(); } else toast('Remove takes a ring, a bar or a pin.'); return; }
  let ring = i;
  if (r.shape.type === TYPE.CONNECTOR && game.owner[i] !== undefined) ring = game.owner[i];
  if (!isRing(game.lv.rings[ring])) return;
  const c = canTurn(game, ring);
  if (!c.ok) { turnRing(game, ring, 1); flushEvents(); renderPlay(); return; }
  stopAuto(); hintSet = new Set();
  const w = toWorld(e);
  drag = {kind: 'turn', ring, prev: angleAt(P(game.lv.rings[ring]), w), total: 0, started: false};
  svg.setPointerCapture(e.pointerId);
}
function playMove(e, w) {
  const d = drag, c = P(game.lv.rings[d.ring]), a = angleAt(c, w), dd = wrap180(a - d.prev);
  d.prev = a; if (!dd) return;
  if (!d.started) { beginMove(game); d.started = true; }
  d.total += dd; turnRing(game, d.ring, dd, {count: false}); flushEvents(); renderPlay();
}
function finishTurn(d) {
  if (!d || !d.started) return;
  const r = game.lv.rings[d.ring], step = r.snapStep || 0;
  if (step && game.alive[d.ring]) { const t = game.turn[d.ring], target = Math.round(t / step) * step; if (Math.abs(target - t) > 1e-6) turnRing(game, d.ring, target - t, {count: false}); }
  flushEvents(); renderPlay();
}
function animateTurn(i, delta, done) {
  animating = true; beginMove(game);
  const t0 = performance.now(), dur = Math.min(900, 250 + Math.abs(delta) * 2.2); let doneA = 0;
  const stepF = now => {
    const k = Math.min(1, (now - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, want = delta * e;
    turnRing(game, i, want - doneA, {count: false}); doneA = want; flushEvents(); renderPlay();
    if (k < 1 && game.alive[i]) requestAnimationFrame(stepF); else { animating = false; done && done(); }
  };
  requestAnimationFrame(stepF);
}
function botStep(then) {
  if (!game || won(game) || animating) return;
  const m = botMove(game);
  if (!m) { toast('The bot finds no move: the level is stuck.'); stopAuto(); flushEvents(); renderPlay(); return; }
  hintSet = new Set([m.ring]); animateTurn(m.ring, m.delta, then);
}
function stopAuto() { if (auto !== null) { clearTimeout(auto); auto = null; } $('#pAuto').setAttribute('aria-pressed', 'false'); }
function autoLoop() { botStep(() => { if (auto !== null && !won(game)) auto = setTimeout(autoLoop, 350); else stopAuto(); }); }
$('#pAuto').addEventListener('click', () => { if (auto !== null) { stopAuto(); return; } if (won(game)) restart(); auto = 0; $('#pAuto').setAttribute('aria-pressed', 'true'); autoLoop(); });
$('#pBot').addEventListener('click', () => { stopAuto(); botStep(); });
$('#pRestart').addEventListener('click', restart);
$('#pUndo').addEventListener('click', () => { if (game && undoMove(game)) { $('#fx').innerHTML = ''; flushEvents(); renderPlay(); } });
function syncBoosters() { $('#bSaw').setAttribute('aria-pressed', String(booster === 'saw')); $('#bRemove').setAttribute('aria-pressed', String(booster === 'remove')); }
$('#bHint').addEventListener('click', () => { if (!game) return; hintSet = new Set(hint(game)); if (!hintSet.size) toast('No ring can free anything right now.'); renderPlay(); });
$('#bSaw').addEventListener('click', () => { booster = booster === 'saw' ? null : 'saw'; syncBoosters(); if (booster) toast('Saw: click a connector or a bar to cut it.'); });
$('#bRemove').addEventListener('click', () => { booster = booster === 'remove' ? null : 'remove'; syncBoosters(); if (booster) toast('Remove: click a ring, bar or pin.'); });

/* ---------- inspector ---------- */
$('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; tab = b.dataset.tab; renderPane(); });
let checkCache = {key: '', issues: [], bot: {}};
function getChecks() {
  const k = JSON.stringify(L());
  if (checkCache.key !== k) checkCache = {key: k, issues: check(L()), bot: {}};
  for (const rule of ['block']) if (!checkCache.bot[rule]) { const s = solve(L(), rule); checkCache.bot[rule] = {won: s.won, moves: s.moves, stuck: s.stuck}; }
  return checkCache;
}
function refreshChecks() {
  const c = getChecks(), n = c.issues.length + (c.bot[prefs.rule].won ? 0 : 1), st = c.bot[prefs.rule].won ? statusOf(c.issues) : 'bad';
  const b = $('#chkBadge'); b.textContent = n; b.className = 'badge' + (st === 'ok' ? '' : ' ' + st);
}
const fld = (label, k, v, attrs = '', cls = '') => `<label class="fld ${cls}"><span>${label}</span><input data-k="${k}" value="${esc(v)}" ${attrs}></label>`;
const nfld = (label, k, v, step = 'any', cls = '') => fld(label, k, typeof v === 'number' ? +v.toFixed(6) : v, `type="number" step="${step}"`, cls);
const cfld = (label, k, v) => `<label class="chk"><input type="checkbox" data-k="${k}" ${v ? 'checked' : ''}><span>${label}</span></label>`;
const sw = (k, v) => `<div class="swatches">${PALETTE.map((c, i) => `<button type="button" class="sw" data-sw="${k}" data-v="${i}" aria-pressed="${v === i}" style="background:${c.hex}" title="${i} ${c.name}">${i}</button>`).join('')}</div>`;
function getPath(o, k) { return k.split('.').reduce((a, p) => a == null ? a : a[p], o); }
function setPath(o, k, v) { const ps = k.split('.'), last = ps.pop(); const t = ps.reduce((a, p) => a[p], o); t[last] = v; }

function renderPane() {
  $$('#tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  const lv = L(), p = $('#pane');
  if (tab === 'level') p.innerHTML = paneLevel(lv);
  else if (tab === 'piece') p.innerHTML = panePiece(lv);
  else if (tab === 'pieces') p.innerHTML = panePieces(lv);
  else if (tab === 'check') p.innerHTML = paneCheck(lv);
  else if (tab === 'json') p.innerHTML = `<p class="hint">This level, laid out like one level object in the game's levels.json. Edit and press Apply.</p><textarea class="code" id="jsonText" spellcheck="false">${esc(serialize(lv))}</textarea><div class="btns"><button class="btn primary" id="jsonApply" type="button">Apply</button><button class="btn" id="jsonCopy" type="button">Copy</button><button class="btn" id="jsonDl" type="button">Download</button></div><div class="msg" id="jsonMsg"></div>`;
  else p.innerHTML = paneHelp();
}
function paneLevel(lv) {
  const t = tally(lv), rings = lv.rings.map((r, i) => isRing(r) ? `<option value="${i}" ${lv.tutorialRing === i ? 'selected' : ''}>${esc(pname(lv, i))}</option>` : '').join('');
  return `<h2>${esc(lv.id)}</h2><div class="fields">
    ${fld('Id <code>id</code>', 'L.id', lv.id, '', 'full')}
    ${nfld('Tier <code>tier</code>', 'L.tier', lv.tier, 1)}${nfld('Difficulty <code>difficulty</code>', 'L.difficulty', lv.difficulty, 'any')}
    ${nfld('Seed <code>seed</code>', 'L.seed', lv.seed, 1)}${nfld('Mode <code>mode</code>', 'L.mode', lv.mode, 1)}
    <label class="fld full"><span>Tutorial ring <code>tutorialRing</code> (hand pointer on this ring)</span><select data-k="L.tutorialRing"><option value="-1">None (-1)</option>${rings}</select></label>
    </div>
    <details><summary class="hint">More fields</summary><div class="fields">${nfld('Version <code>version</code>', 'L.version', lv.version, 1)}<span></span>${nfld('liftDirection x', 'L.liftDirection.x', lv.liftDirection.x)}${nfld('liftDirection y', 'L.liftDirection.y', lv.liftDirection.y)}${nfld('liftDirection z', 'L.liftDirection.z', lv.liftDirection.z)}</div></details>
    <h3>Pieces</h3><table class="tally"><tr><th>Open rings</th><td>${t.rings}</td></tr><tr><th>Closed rings</th><td>${t.closed}</td></tr><tr><th>Connectors</th><td>${t.connectors}</td></tr><tr><th>Straight Bars</th><td>${t.bars}</td></tr><tr><th>Pins</th><td>${t.pins}</td></tr><tr><th>Locked Rings</th><td>${t.locked}</td></tr><tr><th>Gear Rings</th><td>${t.gears}</td></tr></table>
    <h3>Tidy</h3><div class="btns"><button class="btn" type="button" data-act="center">Center on 0,0</button><button class="btn" type="button" data-act="order">Game order and ids</button></div>
    <p class="hint">Game order puts rings first, then connectors, bars and pins, and renames ids R0…, K0…, L0…, H0… like the game file. Key holders, gears and the tutorial ring follow.</p>`;
}
function panePiece(lv) {
  if (!sel.size) return `<p class="hint">Click a piece to edit it. Shift-click to pick more than one. Use the tools above to add rings, connectors, bars, pins, gears and locks.</p>`;
  if (sel.size > 1) return `<h2>${sel.size} pieces</h2><p class="hint">Drag to move them together. Arrow keys nudge.</p><h3>Color</h3>${sw('multi', -1)}<div class="btns"><button class="btn" data-act="dup" type="button">Duplicate</button><button class="btn" data-act="del" type="button">Delete</button></div>`;
  const i = [...sel][0], r = lv.rings[i]; if (!r) return '';
  const t = r.shape.type, K = 'R.', {locks, owner} = analyze(lv);
  let s = `<h2>${esc(TYPE_NAME[t] || 'Type ' + t)} <small class="hint">#${i}</small></h2><div class="fields">`;
  s += fld('Id <code>shape.id</code>', K + 'shape.id', r.shape.id);
  if (isRing(r)) s += `<label class="fld"><span>Type <code>shape.type</code></span><select data-k="R.shape.type"><option value="1" ${t === 1 ? 'selected' : ''}>1 Open ring</option><option value="0" ${t === 0 ? 'selected' : ''}>0 Closed ring</option></select></label>`;
  else s += `<label class="fld"><span>Type <code>shape.type</code></span><input value="${t} ${esc(TYPE_NAME[t] || '')}" disabled></label>`;
  s += `</div><h3>Color <code>colorIndex</code></h3>${sw(K + 'colorIndex', r.colorIndex)}<h3>Place</h3><div class="fields">`;
  s += nfld('Position x', K + 'position.x', r.position.x) + nfld('Position y', K + 'position.y', r.position.y);
  s += nfld(t === TYPE.RING || t === TYPE.CLOSED ? 'Turn <code>eulerAngles.z</code>' : 'Angle <code>eulerAngles.z</code>', K + 'eulerAngles.z', r.eulerAngles.z);
  s += nfld('Radius <code>shape.radius</code>', K + 'shape.radius', r.shape.radius) + nfld('Tube <code>shape.tubeRadius</code>', K + 'shape.tubeRadius', r.shape.tubeRadius);
  if (t === TYPE.CONNECTOR || t === TYPE.PIN) s += nfld('Leg <code>shape.legLength</code>', K + 'shape.legLength', r.shape.legLength);
  s += '</div>';
  if (t === TYPE.CONNECTOR) {
    s += cfld('Hook <code>shape.hook</code>', K + 'shape.hook', r.shape.hook);
    const lk = locks.find(k => k.piece === i);
    s += `<p class="hint">Arm of ${owner[i] !== undefined ? '<b>' + esc(pname(lv, owner[i])) + '</b>' : '<b class="x">no ring</b>'}, hooks ${lk ? '<b>' + esc(pname(lv, lk.ring)) + '</b>' : '<b>nothing</b>'}. Drag the white dots to move the ends; they snap onto rings.</p>`;
    if (owner[i] !== undefined && lk) s += `<div class="btns"><button class="btn" type="button" data-act="aim">Put on the line between ring centers</button></div>`;
  }
  if (t === TYPE.RING) {
    s += `<h3>Gaps <code>shape.gaps</code></h3>` + r.shape.gaps.map((g, k) => `<div class="gaprow">${nfld('Center °', K + `shape.gaps.${k}.centerDegrees`, g.centerDegrees)}${nfld('Width °', K + `shape.gaps.${k}.widthDegrees`, g.widthDegrees)}<button class="ib" type="button" data-act="gapdel" data-g="${k}" title="Remove gap">✕</button></div>`).join('') + `<div class="btns"><button class="btn" type="button" data-act="gapadd">Add gap</button></div><p class="hint">Drag the blue dot on the ring to turn the gap, the white dot to resize the ring.</p>`;
  }
  if (isRing(r)) {
    s += `<h3>Turning</h3><div class="fields">${nfld('Snap step <code>snapStep</code>', K + 'snapStep', r.snapStep)}${nfld('Start angle <code>startAngle</code>', K + 'startAngle', r.startAngle)}</div>${cfld('Limit the turn <code>limitAngle</code>', K + 'limitAngle', r.limitAngle)}`;
    if (r.limitAngle) s += `<div class="fields">${nfld('Min °', K + 'minAngle', r.minAngle)}${nfld('Max °', K + 'maxAngle', r.maxAngle)}</div>`;
    const others = lv.rings.map((o, j) => (j !== i && isRing(o)) ? j : -1).filter(j => j >= 0);
    s += `<h3>Locked Ring</h3>${cfld('Locked <code>locked</code>', K + 'locked', r.locked)}`;
    if (r.locked) s += `<div class="fields"><label class="fld full"><span>Key holder <code>keyHolder</code></span><select data-k="R.keyHolder"><option value="-1">None</option>${lv.rings.map((o, j) => j !== i && (isRing(o) || o.shape.type === TYPE.BAR) ? `<option value="${j}" ${r.keyHolder === j ? 'selected' : ''}>${esc(pname(lv, j))}</option>` : '').join('')}</select></label>${nfld('Padlock at ° <code>lockAngle</code>', K + 'lockAngle', r.lockAngle)}${nfld('Key at ° <code>keyAngle</code>', K + 'keyAngle', r.keyAngle)}</div><p class="hint">The key angle is on the key holder ring.</p>`;
    s += `<h3>Gear Ring</h3><div class="fields">${nfld('Teeth <code>gearTeeth</code>', K + 'shape.gearTeeth', r.shape.gearTeeth, 1)}${nfld('Phase ° <code>gearPhase</code>', K + 'shape.gearPhase', r.shape.gearPhase)}</div>`;
    s += `<p class="hint">Meshes with <code>gearWith</code>:</p><div class="swatches">${others.map(j => `<label class="chk"><input type="checkbox" data-gear="${j}" ${r.gearWith.includes(j) ? 'checked' : ''}><span>${esc(lv.rings[j].shape.id || '#' + j)}</span></label>`).join('')}</div>`;
    const on = locks.filter(k => k.ring === i), arms = locks.filter(k => k.owner === i);
    s += `<h3>Links</h3><p class="hint">${arms.length ? 'Its arms hook: ' + arms.map(k => esc(pname(lv, k.ring))).join(', ') + '. ' : ''}${on.length ? 'Held by: ' + on.map(k => esc(pname(lv, k.piece)) + (k.kind === 'arm' ? ' (arm of ' + esc(pname(lv, k.owner)) + ')' : '')).join(', ') + '.' : 'Nothing rests on it.'}</p>`;
  }
  if (t === TYPE.BAR) s += `<h3>Points <code>shape.points</code> (local)</h3><div class="fields">${r.shape.points.map((q, k) => nfld(`P${k} x`, K + `shape.points.${k}.x`, q.x) + nfld(`P${k} y`, K + `shape.points.${k}.y`, q.y)).join('')}</div><p class="hint">Drag the white dots to move the ends; they snap onto rings.</p>`;
  s += `<details><summary class="hint">More fields</summary><div class="fields">${nfld('flatRatio', K + 'shape.flatRatio', r.shape.flatRatio)}${nfld('arcDegrees', K + 'shape.arcDegrees', r.shape.arcDegrees)}${nfld('flexDepth', K + 'shape.flexDepth', r.shape.flexDepth)}${nfld('position z', K + 'position.z', r.position.z)}${nfld('pivot x', K + 'pivot.x', r.pivot.x)}${nfld('pivot y', K + 'pivot.y', r.pivot.y)}${nfld('rotationAxis z', K + 'rotationAxis.z', r.rotationAxis.z)}</div>${cfld('slide (not used by the sample levels)', K + 'slide', r.slide)}</details>`;
  s += `<div class="btns"><button class="btn" data-act="dup" type="button">Duplicate</button><button class="btn" data-act="del" type="button">Delete</button>${isRing(r) ? `<button class="btn" data-act="tut" type="button">${lv.tutorialRing === i ? 'Tutorial ring ✓' : 'Make tutorial ring'}</button>` : ''}</div>`;
  return s;
}
function panePieces(lv) {
  const {locks, owner} = analyze(lv);
  return `<p class="hint">${lv.rings.length} pieces, in file order.</p><ul class="plist">${lv.rings.map((r, i) => {
    const t = r.shape.type, lk = locks.find(k => k.piece === i);
    const note = t === TYPE.CONNECTOR ? `${owner[i] !== undefined ? esc(lv.rings[owner[i]].shape.id) : '?'} → ${lk ? esc(lv.rings[lk.ring].shape.id) : '?'}` : t === TYPE.PIN ? `on ${lk ? esc(lv.rings[lk.ring].shape.id) : '?'}` : t === TYPE.BAR ? locks.filter(k => k.piece === i).map(k => esc(lv.rings[k.ring].shape.id)).join(' – ') : [r.locked ? '🔒 key ' + esc(lv.rings[r.keyHolder] ? lv.rings[r.keyHolder].shape.id : '?') : '', r.gearWith.length ? '⚙ ' + r.gearWith.map(j => esc(lv.rings[j] ? lv.rings[j].shape.id : '?')).join(',') : ''].filter(Boolean).join(' · ');
    return `<li><button type="button" data-pi="${i}" aria-current="${sel.has(i)}"><span class="pc" style="background:${colorHex(r.colorIndex)}"></span><code>${esc(r.shape.id || '#' + i)}</code><span>${esc(TYPE_NAME[t] || 'type ' + t)} <small>${note}</small></span><small>#${i}</small></button></li>`;
  }).join('')}</ul>`;
}
function paneCheck(lv) {
  const c = getChecks();
  const bot = rule => {
    const b = c.bot[rule];
    return `<h3>Bot</h3>` +
      (b.won ? `<p><b>Solved in ${b.moves.length} move${b.moves.length === 1 ? '' : 's'}.</b></p>` : `<p class="x"><b>Stuck after ${b.moves.length} moves.</b> Left: ${b.stuck.map(i => esc(pname(lv, i))).join(', ')}</p>`) +
      `<div class="sol">${b.moves.map((m, k) => `<span class="${b.won ? 'ok' : ''}" title="Move ${k + 1}">${esc(lv.rings[m.ring].shape.id || '#' + m.ring)} ${m.delta > 0 ? '↺' : '↻'}${Math.abs(m.delta)}°</span>`).join('')}</div>`;
  };
  return `<h2>Check</h2>${c.issues.length ? `<ul class="issues">${c.issues.map(x => `<li class="${x.lvl}" ${x.piece !== undefined ? `data-piece="${x.piece}"` : ''}><b>${x.lvl === 'bad' ? 'Error' : 'Warning'}:</b> ${esc(x.text)}</li>`).join('')}</ul>` : '<ul class="issues"><li class="ok">No format problems.</li></ul>'}
    ${bot('block')}
    <p class="hint">The bot turns one free ring at a time, by the smallest turn that frees everything on it (↺ counter-clockwise, ↻ clockwise). The level has no move limit, so a level the bot cannot finish is stuck for a player too. Move counts are a rough guide to difficulty.</p>
    <div class="btns"><button class="btn" type="button" data-act="watch">Watch the bot play</button></div>`;
}
function paneHelp() {
  return `<h2>How to use</h2><div class="keys">
  <kbd>V</kbd><span>Select. Drag pieces to move them; pieces resting on a moved ring follow it.</span>
  <kbd>R</kbd> <span>Open ring. <kbd>O</kbd> closed ring.</span>
  <kbd>C</kbd><span>Connector: click the ring that owns the arm, then the ring it hooks.</span>
  <kbd>P</kbd><span>Pin: click on a ring.</span>
  <kbd>G</kbd><span>Gear Ring: click two rings to mesh them.</span>
  <kbd>K</kbd><span>Locked Ring: click the ring, then the piece holding its key.</span>
  <kbd>Del</kbd><span>Delete. <kbd>Ctrl D</kbd> duplicate, arrows nudge, <kbd>Ctrl Z</kbd>/<kbd>Ctrl Y</kbd> undo/redo.</span>
  <kbd>F</kbd><span>Fit view. Wheel zooms, drag the background to pan. <kbd>I</kbd> shows ids.</span>
  <kbd>Space</kbd><span>Design ↔ Play test.</span></div>
  <h3>Play test rules</h3><ul>
  <li>Drag a ring to turn it around its center (snaps to <code>snapStep</code>). Its arms turn with it.</li>
  <li>When a ring's gap passes a hook, pin or bar end resting on it, that link comes apart.</li>
  <li>A piece with no links left shatters. A ring gives 300 points.</li>
  <li>Locked Ring: does not turn until the piece holding its key shatters.</li>
  <li>Gear Rings: meshed gears turn the other way, by the tooth ratio.</li>
  <li>A ring whose arm still hooks another ring is held: it cannot turn (a tap only shakes it). Free the hooked ring first.</li>
  <li>Boosters: Hint lights the rings that can turn; Saw cuts one connector or bar; Remove takes one ring off.</li></ul>
  <h3>Data</h3><ul>
  <li>Levels are read from and written to the game's <code>levels.json</code> format: same keys, same order, 4-space layout.</li>
  <li>Links are not stored in the file. The tool works them out from the geometry like the sample levels: a connector is an arm from its ring's edge (<code>position</code> ± <code>legLength</code>/2 along <code>eulerAngles.z</code>) to a hook on another ring; bar ends and pins sit on a ring's circle.</li>
  <li>Edits are saved in this browser. Export → <b>Download levels.json</b> for the game, and <b>Copy as sheet rows</b> to paste into the <a href="${SHEET_URL}" target="_blank" rel="noopener">Level sheet</a> (tab Level Config, columns Id and Level).</li></ul>`;
}
$('#pane').addEventListener('change', e => {
  const el = e.target, lv = L();
  if (el.dataset.gear !== undefined) {
    const i = [...sel][0], j = +el.dataset.gear, a = lv.rings[i], b = lv.rings[j];
    if (el.checked) { if (!a.gearWith.includes(j)) a.gearWith.push(j); if (!b.gearWith.includes(i)) b.gearWith.push(i); if (!a.shape.gearTeeth) a.shape.gearTeeth = Math.round(23 * a.shape.radius); if (!b.shape.gearTeeth) b.shape.gearTeeth = Math.round(23 * b.shape.radius); }
    else { a.gearWith = a.gearWith.filter(x => x !== j); b.gearWith = b.gearWith.filter(x => x !== i); }
    commit(); renderAll(); return;
  }
  const k = el.dataset.k; if (!k) return;
  const [root, ...rest] = k.split('.'), path = rest.join('.');
  const target = root === 'L' ? lv : lv.rings[[...sel][0]];
  if (!target) return;
  const old = getPath(target, path);
  let v = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? +el.value : typeof old === 'number' ? +el.value : el.value;
  if (typeof v === 'number' && !isFinite(v)) { renderPane(); return; }
  if (root === 'R' && path === 'shape.radius') { levels[cur] = resizeRing(lv, [...sel][0], Math.max(.05, v)); commit(); renderAll(); return; }
  if (root === 'R' && (path === 'position.x' || path === 'position.y')) { const r = target, dx = path === 'position.x' ? v - r.position.x : 0, dy = path === 'position.y' ? v - r.position.y : 0; levels[cur] = movePieces(lv, [[...sel][0]], dx, dy); commit(); renderAll(); return; }
  setPath(target, path, v);
  if (root === 'R' && path === 'shape.type') { if (v === TYPE.RING && !target.shape.gaps.length) target.shape.gaps.push({centerDegrees: 0.0, widthDegrees: 46.982540130615234}); if (v === TYPE.CLOSED) target.shape.gaps = []; }
  if (root === 'R' && path === 'locked' && !v) target.keyHolder = -1;
  if (root === 'L' && path === 'id') $('#lvTitle').textContent = v;
  commit(); renderAll();
});
$('#pane').addEventListener('click', e => {
  const lv = L(), b = e.target.closest('button,[data-piece]'); if (!b) return;
  if (b.dataset.sw) {
    const v = +b.dataset.v;
    if (b.dataset.sw === 'multi') sel.forEach(i => { lv.rings[i].colorIndex = v; }); else lv.rings[[...sel][0]].colorIndex = v;
    // connectors take the color of their ring
    const {owner} = analyze(lv); lv.rings.forEach((r, j) => { if (r.shape.type === TYPE.CONNECTOR && sel.has(owner[j])) r.colorIndex = lv.rings[owner[j]].colorIndex; });
    commit(); renderAll(); return;
  }
  if (b.dataset.pi !== undefined) { sel = new Set([+b.dataset.pi]); tab = 'piece'; if (mode === 'edit') renderEdit(); renderPane(); return; }
  if (b.dataset.piece !== undefined) { if (mode === 'play') setMode('edit'); sel = new Set([+b.dataset.piece]); tab = 'piece'; renderEdit(); renderPane(); return; }
  if (b.id === 'jsonApply') { try { const got = parseLevels($('#jsonText').value); if (got.length !== 1) throw new Error('Paste exactly one level here. Use Import for several.'); levels[cur] = got[0]; sel = new Set(); commit(); renderAll(); $('#jsonMsg').className = 'msg ok'; $('#jsonMsg').textContent = 'Applied.'; } catch (err) { $('#jsonMsg').className = 'msg bad'; $('#jsonMsg').textContent = err.message; } return; }
  if (b.id === 'jsonCopy') { copyText(serialize(lv), 'Level JSON copied.'); return; }
  if (b.id === 'jsonDl') { download(lv.id + '.json', serialize(lv) + '\n'); return; }
  const act = b.dataset.act; if (!act) return;
  const i = [...sel][0], r = lv.rings[i];
  if (act === 'del') deleteSel();
  else if (act === 'dup') duplicateSel();
  else if (act === 'gapadd') { r.shape.gaps.push({centerDegrees: r.shape.gaps.length ? (r.shape.gaps[0].centerDegrees + 180) % 360 : 0.0, widthDegrees: 46.982540130615234}); commit(); renderAll(); }
  else if (act === 'gapdel') { r.shape.gaps.splice(+b.dataset.g, 1); commit(); renderAll(); }
  else if (act === 'aim') { const {owner, locks} = analyze(lv), lk = locks.find(k => k.piece === i); placeArm(lv, i, owner[i], lk.ring); roundPiece(r); commit(); renderAll(); }
  else if (act === 'tut') { lv.tutorialRing = lv.tutorialRing === i ? -1 : i; commit(); renderAll(); }
  else if (act === 'center') { const bb = bounds(lv), cx = r3(bb.x + bb.w / 2), cy = r3(bb.y + bb.h / 2); levels[cur] = movePieces(lv, lv.rings.map((x, j) => j), -cx, -cy); commit(); view = null; renderAll(); }
  else if (act === 'order') { gameOrder(lv); sel = new Set(); commit(); renderAll(); toast('Pieces are in game order with fresh ids.'); }
  else if (act === 'watch') { setMode('play'); $('#pAuto').click(); }
});
function gameOrder(lv) {
  const rank = r => ({0: 0, 1: 0, 6: 1, 10: 2, 9: 3}[r.shape.type] ?? 4);
  const order = lv.rings.map((r, i) => i).sort((a, b) => rank(lv.rings[a]) - rank(lv.rings[b]) || a - b), map = [];
  order.forEach((o, n) => { map[o] = n; });
  lv.rings = order.map(o => lv.rings[o]);
  lv.rings.forEach(r => { if (r.keyHolder >= 0) r.keyHolder = map[r.keyHolder]; r.gearWith = r.gearWith.map(j => map[j]); });
  if (lv.tutorialRing >= 0) lv.tutorialRing = map[lv.tutorialRing];
  const cnt = {};
  lv.rings.forEach(r => { const pre = {0: 'R', 1: 'R', 6: 'K', 10: 'L', 9: 'H'}[r.shape.type] || 'X'; cnt[pre] = cnt[pre] || 0; r.shape.id = pre + cnt[pre]++; });
}

/* ---------- import / export ---------- */
function openModal(title, body, foot) { $('#dlgTitle').textContent = title; $('#dlgBody').innerHTML = body; $('#dlgFoot').innerHTML = foot || ''; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; }
$('#dlgX').addEventListener('click', closeModal);
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
$('#btnImport').addEventListener('click', () => {
  openModal('Import levels', `<p class="hint">Paste the game's levels.json, a JSON list of levels, one level, or rows copied from the Level Config sheet (Id and Level columns). Or pick a file.</p>
    <input type="file" id="impFile" accept=".json,.txt,application/json"><textarea class="code" id="impText" spellcheck="false" placeholder="Paste here"></textarea>
    <div class="fields"><label class="fld full"><span>How</span><select id="impHow"><option value="merge">Replace levels with the same id, add the others at the end</option><option value="after">Add after the current level</option><option value="all">Replace all levels</option></select></label></div><div class="msg" id="impMsg"></div>`,
    `<button class="btn" type="button" id="impCancel">Cancel</button><button class="btn primary" type="button" id="impGo">Import</button>`);
  $('#impFile').addEventListener('change', async e => { const f = e.target.files[0]; if (f) $('#impText').value = await f.text(); });
  $('#impCancel').addEventListener('click', closeModal);
  $('#impGo').addEventListener('click', () => {
    try {
      const text = $('#impText').value, got = parseLevels(text), how = $('#impHow').value;
      try { const d = JSON.parse(text); if (d && Array.isArray(d.levels)) meta = {version: d.version ?? 1, exportedAt: d.exportedAt ?? ''}; } catch (e) {}
      doImport(got, how); closeModal();
    } catch (err) { $('#impMsg').className = 'msg bad'; $('#impMsg').textContent = err.message; }
  });
});
function doImport(got, how) {
  let n = 0, rep = 0;
  if (how === 'all') { levels = got; cur = 0; n = got.length; }
  else if (how === 'after') { levels.splice(cur + 1, 0, ...got.map(g => { g.id = levels.some(l => l.id === g.id) ? uniqueId(g.id) : g.id; return g; })); cur++; n = got.length; }
  else for (const g of got) { const k = levels.findIndex(l => l.id === g.id); if (k >= 0) { levels[k] = g; rep++; } else { levels.push(g); n++; } }
  refreshAllStatus(); persist(); selectLevel(Math.min(cur, levels.length - 1));
  toast(how === 'merge' ? `Imported: ${rep} replaced, ${n} added.` : `Imported ${n} level${n === 1 ? '' : 's'}.`);
}
document.addEventListener('paste', e => {
  if (e.target.closest && e.target.closest('input,textarea')) return;
  const t = e.clipboardData && e.clipboardData.getData('text'); if (!t || !/rings/.test(t)) return;
  try { const got = parseLevels(t); e.preventDefault(); doImport(got, 'merge'); } catch (err) { toast(err.message); }
});
const levelNo = (lv, i) => { const m = /(\d+)$/.exec(lv.id || ''); return m ? +m[1] : i + 1; };
const sheetRow = (lv, i) => `${levelNo(lv, i)}\t"${compact(lv).replace(/"/g, '""')}"`;
$('#btnExport').addEventListener('click', () => {
  const big = levels.filter(lv => compact(lv).length > CELL_LIMIT).map(l => l.id);
  openModal('Export levels', `<p class="hint"><b>levels.json</b> is the game file: <code>{"version", "exportedAt", "levels": [...]}</code>, same keys and layout as the game. <b>Sheet rows</b> paste into the <a href="${SHEET_URL}" target="_blank" rel="noopener">Level sheet</a>, tab Level Config: click the Id cell of the first row, then paste. Each row is Id, then the level as one line of JSON.</p>
    ${big.length ? `<p class="msg bad">Over the sheet's ${CELL_LIMIT.toLocaleString()}-character cell limit: ${big.map(esc).join(', ')}.</p>` : ''}
    <div class="btns"><button class="btn primary" type="button" data-exp="file">Download levels.json (${levels.length})</button><button class="btn" type="button" data-exp="all">Copy levels.json</button><button class="btn" type="button" data-exp="one">Copy this level</button><button class="btn" type="button" data-exp="sheet">Copy as sheet rows (${levels.length})</button><button class="btn" type="button" data-exp="sheet1">Copy sheet row of this level</button></div>
    <textarea class="code" id="expText" readonly spellcheck="false"></textarea>`);
  $('#dlgBody').addEventListener('click', e => {
    const b = e.target.closest('[data-exp]'); if (!b) return;
    const k = b.dataset.exp;
    if (k === 'file') { download('levels.json', serializeFile(levels, meta)); return; }
    const txt = k === 'all' ? serializeFile(levels, meta) : k === 'one' ? serialize(L()) : k === 'sheet' ? levels.map(sheetRow).join('\n') : sheetRow(L(), cur);
    const ta = $('#expText'); ta.value = txt.length > 400000 ? txt.slice(0, 400000) + '\n… (cut in this preview; the copy has all of it)' : txt;
    copyText(txt, k === 'sheet' ? `Copied ${levels.length} sheet rows.` : k === 'sheet1' ? 'Copied the sheet row.' : 'Copied.');
  });
});
function copyText(t, msg) {
  const ok = () => toast(msg), fail = () => { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Copy failed: select the text and copy it.'); } ta.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, fail); else fail();
}
function download(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type: 'application/json'})); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast(`Downloaded ${name}.`); }
$('#tCopy').addEventListener('click', () => copyText(serialize(L()), 'Level JSON copied.'));
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2600); }

/* ---------- keys ---------- */
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,select') || !$('#modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (k === ' ') { e.preventDefault(); setMode(mode === 'edit' ? 'play' : 'edit'); return; }
  if (mode === 'play') {
    if (mod && k === 'z') { e.preventDefault(); $('#pUndo').click(); }
    else if (k === 'r') restart(); else if (k === 'n') botStep(); else if (k === 'i') $('#tIds').click(); else if (k === 'f') fitView();
    return;
  }
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
  if (mod && k === 'y') { e.preventDefault(); doRedo(); return; }
  if (mod && k === 'd') { e.preventDefault(); duplicateSel(); return; }
  if (mod) return;
  if (k === 'delete' || k === 'backspace') { e.preventDefault(); deleteSel(); return; }
  if (k === 'escape') { pick = null; sel = new Set(); setTool('select'); renderPane(); return; }
  const step = prefs.grid > 0 ? prefs.grid : .05;
  if (k === 'arrowleft') { e.preventDefault(); nudge(-step, 0); } else if (k === 'arrowright') { e.preventDefault(); nudge(step, 0); }
  else if (k === 'arrowup') { e.preventDefault(); nudge(0, step); } else if (k === 'arrowdown') { e.preventDefault(); nudge(0, -step); }
  const T = {v: 'select', r: 'ring', o: 'closed', c: 'connector', p: 'pin', g: 'gear', k: 'lock'};
  if (T[k]) setTool(T[k]); else if (k === 'f') fitView(); else if (k === 'i') $('#tIds').click();
});

/* ---------- start ---------- */
load(); refreshAllStatus(); resetHistory();
$$('[data-play]').forEach(x => x.hidden = true);
if (savedBase !== BASE) { $('#saveNote').textContent = STALE; setTimeout(() => toast('New game data in the tool: press Reset to game data to load it.'), 400); }
syncBoosters(); renderAll();
