import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

let apiData = null;

page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/api/portal/inmates/load')) {
    try {
      const json = await response.json();
      apiData = json;
      console.log('Got data, count:', Array.isArray(json) ? json.length : (json.records?.length ?? 'unknown'));
    } catch {}
  }
});

await page.goto('https://stjohn-so-la.zuercherportal.com/#/inmates', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

if (apiData) {
  const records = Array.isArray(apiData) ? apiData : (apiData.records ?? apiData.data ?? []);
  // Search for Atkinson
  const match = records.filter(r => {
    const name = (r.name || r.full_name || r.inmate_name || '').toUpperCase();
    return name.includes('ATKINSON');
  });
  console.log('Atkinson matches:', JSON.stringify(match.slice(0, 2), null, 2));
  console.log('Total records:', records.length);
  if (records.length > 0) console.log('Sample record keys:', Object.keys(records[0]));
} else {
  console.log('No API data captured');
}

await browser.close();
