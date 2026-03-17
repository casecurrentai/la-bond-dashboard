import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
});
const page = await context.newPage();

// Intercept the exact request body sent to inmates/load
page.on('request', (request) => {
  const url = request.url();
  if (url.includes('inmates/load') || url.includes('inmates/init')) {
    console.log('REQUEST:', request.method(), url);
    console.log('  Headers:', JSON.stringify(request.headers(), null, 2).slice(0, 300));
    const body = request.postData();
    if (body) console.log('  Body:', body.slice(0, 500));
  }
});

page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('inmates/load')) {
    try {
      const json = await response.json();
      console.log('\nRESPONSE inmates/load:');
      console.log('  total:', json.total_record_count);
      console.log('  records count:', json.records?.length);
    } catch {}
  }
});

await page.goto('https://stjohn-so-la.zuercherportal.com/#/inmates', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2000);

await browser.close();
