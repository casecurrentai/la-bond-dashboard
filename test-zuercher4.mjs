import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
});

// First get a session cookie
const page = await context.newPage();
await page.goto('https://stjohn-so-la.zuercherportal.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(1000);

const cookies = await context.cookies();
const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

// Now call the API directly with axios-style fetch
const response = await page.evaluate(async (cookieStr) => {
  const r = await fetch('https://stjohn-so-la.zuercherportal.com/api/portal/inmates/load', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      name: "JOHNSON",
      race: "all",
      sex: "all",
      cell_block: "all",
      held_for_agency: "any",
      in_custody: new Date().toISOString(),
      paging: { count: 50, start: 0 },
      sorting: { sort_by_column_tag: "name", sort_descending: false }
    })
  });
  return r.json();
}, cookieStr);

console.log('Search JOHNSON - total:', response.total_record_count, 'records:', response.records?.length);
if (response.records?.length > 0) {
  console.log('First match:', JSON.stringify({ name: response.records[0].name, hold_reasons: response.records[0].hold_reasons?.slice(0,100) }));
}

await browser.close();
