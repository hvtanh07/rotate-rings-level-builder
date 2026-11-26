import {describe, it, expect} from 'vitest';
import fs from 'node:fs';
import {normalize, makePiece, placeBar, analyze, TYPE, serialize, parseLevels} from '../src/format.js';
import {newGame, turnRing, canTurn, won, solve, hint, saw, removePiece, undoMove, gearGroup} from '../src/engine.js';

const FILE = JSON.parse(fs.readFileSync(new URL('../src/data/levels.json', import.meta.url), 'utf8'));
const lvl = id => normalize(FILE.levels.find(l => l.id === id));

describe('rules', () => {
  it('level 1: turning the orange ring 90° frees the hook and clears all', () => {
    const g = newGame(lvl('level_001'));
    expect(canTurn(g, 1).ok).toBe(false); // its arm hooks ring 0
    expect(canTurn(g, 0).ok).toBe(true);
    turnRing(g, 0, 30); expect(won(g)).toBe(false);
    turnRing(g, 0, 60); expect(won(g)).toBe(true); expect(g.score).toBe(600); expect(g.moves).toBe(2);
  });
  it('swing rule: turning the arm owner swings the arm off', () => {
    const g = newGame(lvl('level_001'), {rule: 'swing'});
    expect(canTurn(g, 1).ok).toBe(true);
    turnRing(g, 1, 15); expect(won(g)).toBe(true);
  });
  it('Locked Ring does not turn until its key holder shatters', () => {
    const g = newGame(lvl('level_014'));
    expect(canTurn(g, 0)).toMatchObject({ok: false, why: 'locked', by: 0});
    turnRing(g, 1, 360);
    expect(g.alive[1]).toBe(false); expect(g.open[0]).toBe(true);
  });
  it('meshed gears turn the other way', () => {
    const g = newGame(lvl('level_018'));
    expect(gearGroup(g, 0).map(x => x.k)).toEqual([1, -1]);
    turnRing(g, 0, 30); expect(g.turn[1]).toBeCloseTo(-30);
  });
  it('a pin shatters when it locks nothing', () => {
    const g = newGame(lvl('level_010'));
    expect(g.alive[3]).toBe(true);
    expect(canTurn(g, 0).ok).toBe(false);
    turnRing(g, 1, 360); expect(g.alive[1]).toBe(false);
    turnRing(g, 0, 360); expect(g.alive[3]).toBe(false); expect(won(g)).toBe(true);
  });
  it('boosters and undo', () => {
    const g = newGame(lvl('level_001'));
    expect(hint(g)).toEqual([0]);
    expect(saw(g, 2)).toBe(true); expect(won(g)).toBe(true);
    expect(undoMove(g)).toBe(true); expect(won(g)).toBe(false);
    expect(removePiece(g, 0)).toBe(true); expect(won(g)).toBe(true);
  });
  it('the bot solves all 60 sample levels with both rules', () => {
    for (const raw of FILE.levels) for (const rule of ['block', 'swing']) {
      const s = solve(normalize(raw), rule);
      expect(s.won, `${raw.id} ${rule}`).toBe(true);
    }
  });
});

describe('Bomb', () => {
  // R0 held by a pin; a bar held only by a pin (it touches no ring); a bomb on R0 at 180°.
  const make = (withBomb = true) => {
    const lv = normalize({id: 'bomb_test', rings: []});
    const R0 = makePiece(lv, TYPE.RING, {position: {x: 0, y: 0}}); lv.rings.push(R0);
    lv.rings.push(makePiece(lv, TYPE.PIN, {position: {x: 0, y: 1}, eulerAngles: {z: 90}}));
    const bar = makePiece(lv, TYPE.BAR); placeBar(bar, {x: -0.5, y: -2}, {x: -0.5, y: -0.5}); lv.rings.push(bar);
    lv.rings.push(makePiece(lv, TYPE.PIN, {position: {x: -0.5, y: -1.5}, eulerAngles: {z: 180}}));
    if (withBomb) lv.rings.push(makePiece(lv, TYPE.BOMB, {position: {x: -1, y: 0}}));
    return lv;
  };
  it('finds what each piece sits on', () => {
    const {locks, host, problems} = analyze(make());
    expect(problems).toEqual([]);
    expect(host[4]).toBe(0);
    expect(locks.find(k => k.piece === 3)).toMatchObject({kind: 'pin', ring: 2, onBar: true});
  });
  it('turning the bomb onto the bar blows up the ring and the bar, and the level clears', () => {
    const g = newGame(make());
    turnRing(g, 0, 30); expect(g.alive[2]).toBe(true);
    turnRing(g, 0, 40);
    expect(g.alive[0]).toBe(false); expect(g.alive[2]).toBe(false); expect(won(g)).toBe(true);
  });
  it('without the bomb the bar held by a pin is stuck', () => {
    const s = solve(make(false)); expect(s.won).toBe(false); expect(s.stuck).toContain(2);
  });
  it('the bot uses the bomb when nothing else frees a piece', () => {
    const s = solve(make()); expect(s.won).toBe(true);
  });
  it('round trip keeps the bomb', () => {
    const lv = make(); expect(parseLevels(serialize(lv))[0]).toEqual(normalize(lv));
  });
});
