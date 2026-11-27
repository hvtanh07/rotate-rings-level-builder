// Builds the 40 levels without playtest and writes design/out/geom.json (for layout checks).
import fs from 'fs';
import {LEVELS} from './levels40.mjs';
import {serializeFile} from '../src/format.js';
const out = LEVELS.map((L, k) => { const {b, tutorialRing} = L.make(); return b.build({id: `level_${String(k + 1).padStart(3, '0')}`, tutorialRing, G: L.G}); });
fs.writeFileSync(new URL('./out/geom.json', import.meta.url), serializeFile(out, {}));
