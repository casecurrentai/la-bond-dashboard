import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
});
const page = await context.newPage();

let inmatesData = null;
let cookies = null;

page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/api/portal/inmates/load')) {
    try {
      const json = await response.json();
      inmatesData = json;
    } catch {}
  }
});

await page.goto('https://stjohn-so-la.zuercherportal.com/#/inmates', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

if (inmatesData) {
  console.log('Total records:', inmatesData.total_record_count);
  console.log('Sample record (first):', JSON.stringify(inmatesData.records?.[0], null, 2));
  console.log('Sample record (second):', JSON.stringify(inmatesData.records?.[1], null, 2));
}

// Also get cookies for direct API calls
cookies = await context.cookies();
const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
console.log('\nCookies:', cookieStr.slice(0, 200));

await browser.close();
