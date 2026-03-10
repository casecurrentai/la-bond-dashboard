import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();

const apiCalls = [];
const apiResponses = [];

page.on('request', req => {
  const url = req.url();
  const skip = url.includes('fonts.google') || url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.png') || url.endsWith('.ico') || url.endsWith('.woff2');
  if (!skip) {
    apiCalls.push({ url, method: req.method() });
  }
});

page.on('response', async resp => {
  const url = resp.url();
  const isData = url.includes('/api/') || url.includes('inmate') || url.includes('zuercher') || url.includes('centralsquare');
  if (isData) {
    try {
      const body = await resp.text().catch(() => '');
      apiResponses.push({ url, status: resp.status(), body: body.substring(0, 800) });
    } catch (e) { /* ignore */ }
  }
});

console.log('Navigating to St. John Zuercher inmates page...');

try {
  await page.goto('https://stjohn-so-la.zuercherportal.com/#/inmates', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(4000);

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('\n=== BODY TEXT ===\n', bodyText);

  // Check for bond
  const html = await page.content();
  const hasBond = html.toLowerCase().includes('bond');
  console.log('\nBond field present in HTML:', hasBond);

  // Save HTML
  fs.writeFileSync('/tmp/stjohn_inmates.html', html);
  console.log('HTML saved to /tmp/stjohn_inmates.html, length:', html.length);

  // Get table rows
  const rows = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr'));
    return trs.slice(0, 5).map(tr => tr.innerText.trim());
  });
  console.log('\nTable rows (first 5):', JSON.stringify(rows, null, 2));

  // Get all column headers
  const headers = await page.evaluate(() => {
    const ths = Array.from(document.querySelectorAll('th'));
    return ths.map(th => th.innerText.trim());
  });
  console.log('\nTable headers:', JSON.stringify(headers));

  console.log('\n=== API CALLS ===');
  apiCalls.slice(0, 20).forEach(c => console.log(c.method, c.url));

  console.log('\n=== API RESPONSES ===');
  apiResponses.forEach(r => {
    console.log(`${r.status} ${r.url}`);
    console.log('  Body:', r.body.substring(0, 300));
  });

} catch (e) {
  console.log('Error:', e.message);
}

await browser.close();
