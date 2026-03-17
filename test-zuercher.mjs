import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
});
const page = await context.newPage();

const apiCalls = [];
page.on('response', async (response) => {
  const url = response.url();
  const status = response.status();
  const ct = response.headers()['content-type'] || '';
  if (ct.includes('json') || url.includes('api') || url.includes('inmate') || url.includes('detainee')) {
    let body = '';
    try { body = (await response.text()).slice(0, 200); } catch {}
    apiCalls.push({ url, status, body });
  }
});

try {
  await page.goto('https://stjohn-so-la.zuercherportal.com/#/inmates', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
} catch (e) {
  console.log('Navigation error:', e.message);
}

console.log('API calls intercepted:');
apiCalls.forEach(c => console.log(`  ${c.status} ${c.url}\n    body: ${c.body.slice(0,100)}`));

await browser.close();
