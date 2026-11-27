import {describe, it, expect} from 'vitest';
import fs from 'fs';
import {parseLevels, check} from '../src/format.js';
import {solve} from '../src/engine.js';

const DATA = parseLevels(fs.readFileSync(new URL('../src/data/levels.json', import.meta.url), 'utf8'));
const LV = DATA.levels || DATA;

describe('built-in levels (the 40 designed levels)', () => {
  it('has 40 levels with no errors', () => {
    expect(LV.length).toBe(40);
    for (const lv of LV) expect(check(lv).filter(p => p.lvl === 'bad')).toEqual([]);
  });
  it('no rings touch and no part stands in the gap of its own ring', () => {
    for (const lv of LV) expect(check(lv).filter(p => /gap of its own|touch:/.test(p.text)).map(p => p.text), lv.id).toEqual([]);
  });
  it('the bot solves every level', () => {
    for (const lv of LV) expect(solve(lv).won, lv.id).toBe(true);
  }, 120000);
});
