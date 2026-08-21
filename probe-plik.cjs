const { chromium } = require('playwright');
const SCR = process.env.SCR;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true });
  const page = await b.newPage({ viewport: { width: 1280, height: 1100 } });
  const bledy = [];
  page.on('pageerror', (e) => bledy.push(e.message.slice(0, 120)));
  await page.route('**/*', (r) => (r.request().url().includes('127.0.0.1:5199') ? r.continue() : r.abort()));
  await page.goto('http://127.0.0.1:5199/studio/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const adv = page.locator('button', { hasText: /zaawansowan|advanced/i }).first();
  if (await adv.count()) { await adv.click(); await page.waitForTimeout(1500); }

  // Karta technologii, a NIE kafelek "Druk 3D": kafelek tez zawiera "Bambu Lab H2D".
  const kartaFDM = page.locator('button').filter({ hasText: /FDM - Bambu Lab H2D/ }).first();
  const kartaMSLA = page.locator('button').filter({ hasText: /Elegoo Saturn 4 Ultra/ }).filter({ hasText: /MSLA/ }).first();

  const stan = async (etap) => {
    const tekst = await page.locator('body').innerText();
    const jeden = tekst.replace(/\s+/g, ' ');
    const kroki = tekst.split('\n').filter((l) => /^[①-⑨]/.test(l.trim())).map((l) => l.trim().slice(1));
    const tryb = kroki.includes('INFILL') ? 'FDM' : (kroki.includes('APPLICATION') ? 'MSLA' : '?');
    const plik = /kostka/.test(jeden);
    const wymiar = (jeden.match(/\d+[.,]\d\s*×\s*\d+[.,]\d\s*×\s*\d+[.,]\d/) || ['-'])[0];
    const zaDuzy = /exceeds build volume|przekracza przestrze|überschreitet Bauraum/i.test(jeden);
    console.log(`${etap.padEnd(22)} tryb=${tryb.padEnd(4)} plik=${plik ? 'JEST' : 'BRAK'} wymiary=${wymiar.padEnd(22)} zaDuzyDlaMaszyny=${zaDuzy}`);
    return { tryb, plik };
  };

  await page.locator('input[type=file]').first().setInputFiles(SCR + '/' + process.env.PLIK);
  await page.waitForTimeout(2500);
  await stan('FDM po wgraniu');
  await kartaMSLA.scrollIntoViewIfNeeded(); await kartaMSLA.click(); await page.waitForTimeout(2000);
  const po = await stan('po zmianie na MSLA');
  await page.screenshot({ path: SCR + '/msla-' + process.env.PLIK + '.png' });
  await kartaFDM.scrollIntoViewIfNeeded(); await kartaFDM.click(); await page.waitForTimeout(2000);
  const wroc = await stan('powrot na FDM');
  console.log(bledy.length ? 'BLEDY: ' + bledy.join(' | ') : 'brak bledow strony');
  console.log(`WYNIK: przelaczenie ${po.tryb === 'MSLA' && wroc.tryb === 'FDM' ? 'dziala w obie strony' : 'NIE DZIALA'}, plik ${po.plik && wroc.plik ? 'zostaje' : 'GINIE'}`);
  await b.close();
})();
