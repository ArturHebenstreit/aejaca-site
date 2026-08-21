const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true });
  const page = await b.newPage({ viewport: { width: 1280, height: 1100 } });
  await page.route('**/*', (r) => (r.request().url().includes('127.0.0.1:5199') ? r.continue() : r.abort()));
  await page.goto('http://127.0.0.1:5199/studio/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const adv = page.locator('button', { hasText: /zaawansowan|advanced/i }).first();
  if (await adv.count()) { await adv.click(); await page.waitForTimeout(1500); }
  const kroki = async () => (await page.locator('body').innerText())
    .split('\n').filter((l) => /^[①②③④⑤⑥⑦⑧⑨]/.test(l.trim())).map((l) => l.trim().slice(0, 28));
  console.log('kroki na starcie:', JSON.stringify(await kroki()));
  await b.close();
})();
