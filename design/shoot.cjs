// node design/shoot.cjs in.html out.png
const {chromium} = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1250, height: 600}});
  await p.goto('file://' + require('path').resolve(process.argv[2])); await p.screenshot({path: process.argv[3], fullPage: true}); await b.close(); })();
