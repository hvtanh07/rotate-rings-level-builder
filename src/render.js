// Draws a level as SVG markup in world units (y up). Used by both the design view and the play test.
import {TYPE, isRing, colorHex, connectorEnds, barPoints, P, rad, deg} from './format.js';

const f = n => (+n).toFixed(3).replace(/\.?0+$/, '') || '0';
const pt = (c, r, a) => ({x: c.x + r * Math.cos(rad(a)), y: c.y + r * Math.sin(rad(a))});
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, n >> 8 & 255, n & 255].map(v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };

// Arc of a ring from angle a0 to a1 (degrees, counter-clockwise).
function arcPath(c, r, a0, a1) {
  const p0 = pt(c, r, a0), p1 = pt(c, r, a1), big = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `M${f(p0.x)} ${f(p0.y)}A${f(r)} ${f(r)} 0 ${big} 1 ${f(p1.x)} ${f(p1.y)}`;
}
function ringBody(r, cls) {
  const c = P(r), R = r.shape.radius, w = r.shape.tubeRadius * 2, col = colorHex(r.colorIndex), hi = shade(col, .45), z = r.eulerAngles.z;
  let s = '';
  if (r.shape.type === TYPE.CLOSED || !r.shape.gaps.length) {
    s += `<circle class="tube" cx="${f(c.x)}" cy="${f(c.y)}" r="${f(R)}" stroke="${col}" stroke-width="${f(w)}"/>`;
    s += `<circle class="shine" cx="${f(c.x)}" cy="${f(c.y)}" r="${f(R + w * .18)}" stroke="${hi}" stroke-width="${f(w * .22)}"/>`;
  } else {
    // one arc between each pair of gaps
    const gs = r.shape.gaps.map(g => ({a: g.centerDegrees + z, h: g.widthDegrees / 2})).sort((a, b) => a.a - b.a);
    gs.forEach((g, k) => {
      const n = gs[(k + 1) % gs.length], a0 = g.a + g.h, a1 = (k + 1 < gs.length ? n.a : n.a + 360) - n.h;
      if (a1 <= a0) return;
      const d = arcPath(c, R, a0, a1);
      s += `<path class="tube" d="${d}" stroke="${col}" stroke-width="${f(w)}"/>`;
      s += `<path class="shine" d="${arcPath(c, R + w * .18, a0 + 3, a1 - 3)}" stroke="${hi}" stroke-width="${f(w * .22)}"/>`;
    });
  }
  if (r.shape.gearTeeth > 0) {
    const n = r.shape.gearTeeth, r0 = R + w / 2 - .01, r1 = R + w / 2 + .12;
    let d = '';
    for (let k = 0; k < n; k++) { const a = r.shape.gearPhase + z + k * 360 / n, p0 = pt(c, r0, a), p1 = pt(c, r1, a); d += `M${f(p0.x)} ${f(p0.y)}L${f(p1.x)} ${f(p1.y)}`; }
    s = `<path class="teeth" d="${d}" stroke="${shade(col, -.25)}" stroke-width="${f(Math.min(.13, 2 * Math.PI * R / n * .45))}"/>` + s;
  }
  // wide invisible hit area
  s += `<circle class="hit" cx="${f(c.x)}" cy="${f(c.y)}" r="${f(R)}" stroke-width="${f(Math.max(w * 2.2, .5))}"/>`;
  return s;
}
function connectorBody(r) {
  const {tail, head} = connectorEnds(r), col = colorHex(r.colorIndex), w = Math.max(.1, r.shape.tubeRadius * 2.6);
  let s = `<line class="arm" x1="${f(tail.x)}" y1="${f(tail.y)}" x2="${f(head.x)}" y2="${f(head.y)}" stroke="${col}" stroke-width="${f(w)}"/>`;
  if (r.shape.hook) s += `<circle class="hook" cx="${f(head.x)}" cy="${f(head.y)}" r="${f(r.shape.radius * .62)}" stroke="${shade(col, -.2)}" stroke-width="${f(r.shape.tubeRadius * 2.2)}"/>`;
  s += `<circle class="plug" cx="${f(head.x)}" cy="${f(head.y)}" r="${f(w * .62)}" fill="${shade(col, .25)}"/>`;
  s += `<line class="hit" x1="${f(tail.x)}" y1="${f(tail.y)}" x2="${f(head.x)}" y2="${f(head.y)}" stroke-width=".36"/>`;
  return s;
}
function barBody(r) {
  const pts = barPoints(r), col = colorHex(r.colorIndex), w = r.shape.tubeRadius * 2;
  if (!pts.length) return '';
  const d = 'M' + pts.map(p => `${f(p.x)} ${f(p.y)}`).join('L');
  let s = `<path class="bar" d="${d}" stroke="${col}" stroke-width="${f(w)}"/><path class="shine" d="${d}" stroke="${shade(col, .45)}" stroke-width="${f(w * .25)}"/>`;
  for (const e of [pts[0], pts[pts.length - 1]]) s += `<circle class="sleeve" cx="${f(e.x)}" cy="${f(e.y)}" r="${f(r.shape.radius * .55)}" fill="${shade(col, -.2)}"/>`;
  s += `<path class="hit" d="${d}" stroke-width=".4"/>`;
  return s;
}
function pinBody(r) {
  const p = P(r), a = r.eulerAngles.z, e = pt(p, r.shape.legLength * .55, a), col = colorHex(r.colorIndex);
  return `<line class="arm" x1="${f(p.x)}" y1="${f(p.y)}" x2="${f(e.x)}" y2="${f(e.y)}" stroke="#7D8597" stroke-width=".1"/>` +
    `<circle class="pinhead" cx="${f(e.x)}" cy="${f(e.y)}" r="${f(r.shape.radius * .75)}" fill="${col}" stroke="${shade(col, -.3)}" stroke-width=".04"/>` +
    `<circle class="pinbase" cx="${f(p.x)}" cy="${f(p.y)}" r="${f(r.shape.radius * .6)}" fill="${col}" stroke="#fff" stroke-width=".05"/>` +
    `<circle class="hit" cx="${f(p.x)}" cy="${f(p.y)}" r=".32" stroke-width="0" fill="transparent"/>`;
}
function bombBody(r) {
  const p = P(r), R = r.shape.radius, a = r.eulerAngles.z, f0 = pt(p, R * .8, a + 50), f1 = pt(p, R * 1.35, a + 35);
  return `<circle class="bomb" cx="${f(p.x)}" cy="${f(p.y)}" r="${f(R)}" fill="#2B2F3A" stroke="#11131A" stroke-width=".04"/>` +
    `<circle cx="${f(p.x - R * .3)}" cy="${f(p.y + R * .3)}" r="${f(R * .28)}" fill="#fff" fill-opacity=".35"/>` +
    `<path class="fuse" d="M${f(f0.x)} ${f(f0.y)}Q${f(f1.x)} ${f(f0.y)} ${f(f1.x)} ${f(f1.y)}" stroke="#8C6A3E" stroke-width=".06" fill="none"/>` +
    `<circle cx="${f(f1.x)}" cy="${f(f1.y)}" r="${f(R * .22)}" fill="#FFB020" stroke="#F2560F" stroke-width=".03"/>` +
    `<circle class="hit" cx="${f(p.x)}" cy="${f(p.y)}" r="${f(R * 1.1)}" stroke-width="0" fill="transparent"/>`;
}
function padlock(c, s, open) {
  return `<g class="padlock${open ? ' open' : ''}" transform="translate(${f(c.x)} ${f(c.y)}) scale(${f(s)} ${f(-s)})">` +
    `<path d="M-5 -1V-5a5 5 0 0 1 10 0${open ? 'V-3' : 'V-1'}" fill="none" stroke="#5C6478" stroke-width="2.2" transform="${open ? 'translate(4 -3)' : ''}"/>` +
    `<rect x="-7" y="-1" width="14" height="11" rx="2.5" fill="#F0B323" stroke="#A86F08" stroke-width="1.2"/><circle cx="0" cy="4" r="1.7" fill="#7A4D05"/></g>`;
}
function keyIcon(c, s) {
  return `<g class="key" transform="translate(${f(c.x)} ${f(c.y)}) scale(${f(s)} ${f(-s)})"><circle cx="-4" cy="0" r="4" fill="none" stroke="#C98A12" stroke-width="2.4"/><path d="M0 0H8M5 0V3M8 0V3" stroke="#C98A12" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
}
const label = (p, txt, cls = 'lab') => `<text class="${cls}" transform="translate(${f(p.x)} ${f(p.y)}) scale(1 -1)">${txt}</text>`;

export function bounds(lv) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (p, m) => { x0 = Math.min(x0, p.x - m); y0 = Math.min(y0, p.y - m); x1 = Math.max(x1, p.x + m); y1 = Math.max(y1, p.y + m); };
  lv.rings.forEach(r => {
    if (isRing(r)) add(P(r), r.shape.radius + .35);
    else if (r.shape.type === TYPE.BAR) barPoints(r).forEach(p => add(p, .3));
    else add(P(r), (r.shape.legLength || .5) + .4);
  });
  if (!isFinite(x0)) { x0 = -3; y0 = -3; x1 = 3; y1 = 3; }
  const w = Math.max(4, x1 - x0), h = Math.max(4, y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return {x: cx - w / 2 - .6, y: cy - h / 2 - .6, w: w + 1.2, h: h + 1.2};
}

/* opts: {turn, alive, open, owner, sel:Set, hint:Set, ids, links:[{a,b,kind}], ghost, play, shakeIdx, dim:Set} */
export function drawLevel(lv, o = {}) {
  const R = lv.rings, alive = o.alive || R.map(() => true), turn = o.turn || R.map(() => 0), open = o.open || R.map(r => !r.locked), owner = o.owner || {}, host = o.host || {};
  const sel = o.sel || new Set(), hint = o.hint || new Set(), off = o.offset || [];
  const tr = i => off[i] && (off[i].x || off[i].y) ? ` transform="translate(${f(off[i].x)} ${f(off[i].y)})"` : '';
  const order = R.map((r, i) => i).sort((a, b) => layer(R[a]) - layer(R[b]));
  const inRing = {}; Object.entries(owner).forEach(([c, i]) => { (inRing[i] = inRing[i] || []).push(+c); });
  const bombsOn = {}; Object.entries(host).forEach(([b, i]) => { if (isRing(R[i])) (bombsOn[i] = bombsOn[i] || []).push(+b); });
  let s = '';
  const piece = i => {
    const r = R[i], t = r.shape.type;
    const cls = `pc t${t}${sel.has(i) ? ' sel' : ''}${hint.has(i) ? ' hint' : ''}${o.shakeIdx === i ? ' shake' : ''}${o.dim && o.dim.has(i) ? ' dim' : ''}`;
    if (t === TYPE.RING || t === TYPE.CLOSED) {
      const c = P(r);
      let inner = ringBody(r);
      if (r.locked) inner += padlock(pt(c, r.shape.radius, r.lockAngle + r.eulerAngles.z), .024, open[i]);
      R.forEach((k, j) => { if (k.locked && k.keyHolder === i && !open[j] && alive[j]) inner += keyIcon(pt(c, r.shape.radius, r.keyAngle + r.eulerAngles.z), .024); });
      // connectors owned by this ring turn with it
      for (const j of inRing[i] || []) if (alive[j]) inner += `<g class="pc t6${sel.has(j) ? ' sel' : ''}" data-i="${j}">${connectorBody(R[j])}</g>`;
      for (const j of bombsOn[i] || []) if (alive[j]) inner += `<g class="pc t11${sel.has(j) ? ' sel' : ''}" data-i="${j}">${bombBody(R[j])}</g>`;
      return `<g class="${cls}" data-i="${i}" transform="rotate(${f(turn[i] || 0)} ${f(c.x)} ${f(c.y)})">${inner}</g>`;
    }
    if (t === TYPE.CONNECTOR) return owner[i] !== undefined ? '' : `<g class="${cls}" data-i="${i}">${connectorBody(r)}</g>`;
    if (t === TYPE.BAR) {
      let inner = barBody(r);
      R.forEach((k, j) => { if (k.locked && k.keyHolder === i && !open[j] && alive[j]) { const p = barPoints(r); if (p.length) inner += keyIcon({x: (p[0].x + p[p.length - 1].x) / 2, y: (p[0].y + p[p.length - 1].y) / 2}, .024); } });
      return `<g class="${cls}" data-i="${i}"${tr(i)}>${inner}</g>`;
    }
    if (t === TYPE.PIN) return `<g class="${cls}" data-i="${i}">${pinBody(r)}</g>`;
    if (t === TYPE.BOMB) return host[i] !== undefined && isRing(R[host[i]]) ? '' : `<g class="${cls}" data-i="${i}"${tr(host[i])}>${bombBody(r)}</g>`;
    return `<g class="${cls} unknown" data-i="${i}"><circle cx="${f(r.position.x)}" cy="${f(r.position.y)}" r=".3" class="unk"/><circle class="hit" cx="${f(r.position.x)}" cy="${f(r.position.y)}" r=".3"/></g>`;
  };
  for (const i of order) if (alive[i] && !(R[i].shape.type === TYPE.CONNECTOR && owner[i] !== undefined && !alive[owner[i]])) s += piece(i);
  if (o.links) for (const L of o.links) s += `<line class="link ${L.kind}" x1="${f(L.a.x)}" y1="${f(L.a.y)}" x2="${f(L.b.x)}" y2="${f(L.b.y)}"/>`;
  if (o.ids) R.forEach((r, i) => { if (alive[i] && isRing(r)) s += label(P(r), r.shape.id || '#' + i); });
  if (o.tutorial >= 0 && R[o.tutorial] && alive[o.tutorial]) s += label({x: R[o.tutorial].position.x, y: R[o.tutorial].position.y - .18}, '☝', 'tut');
  return s;
}
const layer = r => ({0: 0, 1: 1, 10: 2, 6: 3, 9: 4, 11: 5}[r.shape.type] ?? 6);

// Shards that burst out of a cleared piece.
export function shardsAt(p, col, n = 12, spread = .9) {
  let s = '';
  for (let k = 0; k < n; k++) {
    const a = k * 360 / n + (k % 2 ? 13 : -9), d = spread * (.6 + .4 * ((k * 7) % 5) / 4), q = pt(p, d, a);
    s += `<rect x="-.07" y="-.07" width=".14" height=".14" rx=".03" fill="${col}"><animateTransform attributeName="transform" type="translate" from="${f(p.x)} ${f(p.y)}" to="${f(q.x)} ${f(q.y)}" dur=".7s" fill="freeze"/><animate attributeName="opacity" from="1" to="0" dur=".7s" fill="freeze"/></rect>`;
  }
  return s;
}
export {pt, deg};
