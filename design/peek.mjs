// Renders chosen levels from design/levels40.mjs to design/out/peek.png: node design/peek.mjs 7 8 9
import fs from 'fs';
import {execSync} from 'child_process';
import {LEVELS} from './levels40.mjs';
import {serializeFile} from '../src/format.js';
const ns = process.argv.slice(2).map(Number);
const out = ns.map(n => { const L = LEVELS[n - 1], {b, tutorialRing} = L.make(); return b.build({id: `level_${String(n).padStart(3, '0')}`, tutorialRing, G: L.G}); });
fs.writeFileSync(new URL('./out/peek.json', import.meta.url), serializeFile(out, {}));
fs.writeFileSync(new URL('./out/peek_labels.json', import.meta.url), JSON.stringify(Object.fromEntries(ns.map((n, k) => [out[k].id, LEVELS[n - 1].name]))));
execSync('node design/sheet.mjs design/out/peek.json design/out/peek.html design/out/peek_labels.json');
execSync(`node -e "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1250,height:300},deviceScaleFactor:1});await p.goto('file://'+process.cwd()+'/design/out/peek.html');await p.screenshot({path:'design/out/peek.png',fullPage:true});await b.close();})()"`);
