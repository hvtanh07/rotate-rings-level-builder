import {describe, it, expect} from 'vitest';
import fs from 'node:fs';
import {normalize, serialize, serializeFile, compact, parseLevels, analyze, check, fmtFloat, blankLevel, removePieces} from '../src/format.js';

const RAW = fs.readFileSync(new URL('../src/data/levels_sample60.json', import.meta.url), 'utf8');
const FILE = JSON.parse(RAW);

describe('level format', () => {
  it('writes the game file with the same keys, order and layout', () => {
    // the sample file is older than timeLimit (added 2026-11-26): leave that one new key out of the comparison
    const out = serializeFile(FILE.levels.map(normalize), FILE).replace(/,\n\s*"timeLimit": 0/g, '');
    expect(JSON.parse(out)).toEqual(FILE);
    // same lines apart from the last digits of a few floats (the game prints 17 digits, JS prints the shortest form)
    const a = RAW.split('\n'), b = out.split('\n');
    expect(b.length).toBe(a.length);
    a.forEach((line, i) => { if (line !== b[i]) expect(line.replace(/[\d.e-]+,?$/, '')).toBe(b[i].replace(/[\d.e-]+,?$/, '')); });
  });
  it('writes floats with a decimal point and ints without', () => {
    expect(fmtFloat(1)).toBe('1.0'); expect(fmtFloat(-180)).toBe('-180.0'); expect(fmtFloat(1.07e-7)).toBe('1.07e-07');
    const s = serialize(blankLevel('level_x'));
    expect(s).toMatch(/"radius": 1\.0/); expect(s).toMatch(/"colorIndex": \d+,/); expect(s).toMatch(/"keyHolder": -1,/);
  });
  it('reads the file, a list, one level, pasted objects and sheet rows', () => {
    const one = FILE.levels[0], two = FILE.levels.slice(0, 2);
    expect(parseLevels(RAW)).toHaveLength(60);
    expect(parseLevels(JSON.stringify(two))).toHaveLength(2);
    expect(parseLevels(JSON.stringify(one))[0].id).toBe('level_001');
    expect(parseLevels(JSON.stringify(one) + '\n' + JSON.stringify(FILE.levels[1]))).toHaveLength(2);
    const rows = two.map((l, i) => `${i + 1}\t"${compact(normalize(l)).replace(/"/g, '""')}"`).join('\n');
    const got = parseLevels(rows);
    expect(got.map(l => l.id)).toEqual(['level_001', 'level_002']);
    expect(got[1]).toEqual(normalize(FILE.levels[1]));
  });
  it('fills missing keys with defaults in game order', () => {
    const lv = normalize({id: 'a', rings: [{shape: {type: 1}}]});
    expect(Object.keys(lv)).toEqual(['id', 'version', 'mode', 'liftDirection', 'tier', 'difficulty', 'seed', 'rings', 'tutorialRing', 'timeLimit']);
    expect(Object.keys(lv.rings[0])).toEqual(Object.keys(normalize(FILE.levels[0]).rings[0]));
  });
});

describe('geometry', () => {
  it('finds the owner and hooked ring of every connector, bar and pin in the sample levels', () => {
    for (const raw of FILE.levels) {
      const lv = normalize(raw), {locks, owner, problems} = analyze(lv);
      expect(problems).toEqual([]);
      lv.rings.forEach((r, i) => {
        if (r.shape.type === 6) { expect(owner[i]).toBeDefined(); expect(lv.rings[owner[i]].colorIndex).toBe(r.colorIndex); expect(locks.filter(k => k.piece === i)).toHaveLength(1); }
        if (r.shape.type === 10) expect(locks.filter(k => k.piece === i)).toHaveLength(2);
        if (r.shape.type === 9) expect(locks.filter(k => k.piece === i)).toHaveLength(1);
      });
    }
  });
  it('level 1: the blue ring owns the arm that hooks the orange ring', () => {
    const lv = normalize(FILE.levels[0]), {locks, owner} = analyze(lv);
    expect(owner[2]).toBe(1); expect(locks[0]).toMatchObject({kind: 'arm', owner: 1, ring: 0});
  });
  it('the sample levels have no errors', () => {
    for (const raw of FILE.levels) expect(check(normalize(raw)).filter(x => x.lvl === 'bad')).toEqual([]);
  });
  it('fixes indexes when pieces are deleted', () => {
    const lv = normalize(FILE.levels.find(l => l.id === 'level_014'));
    removePieces(lv, [2]);
    expect(lv.rings[0].keyHolder).toBe(1);
    removePieces(lv, [1]);
    expect(lv.rings[0].keyHolder).toBe(-1); expect(lv.rings[0].locked).toBe(false);
  });
});
