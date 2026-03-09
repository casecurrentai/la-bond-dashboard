/**
 * BondCurrent - River Parish Probe Script
 * Probes all 6 river parishes using headless browser to map bond field availability.
 * Saves HTML snapshots, screenshots, and a structured probe report.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'outputs', 'evidence');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const PARISHES = [
  {
    name: 'jefferson',
    label: 'Jefferson Parish',
    url: 'https://apps.jpso.com/inmatesearch2',
    type: 'custom_spa',
    notes: 'JPSO custom inmate search app',
  },
  {
    name: 'orleans',
    label: 'Orleans Parish',
    url: 'https://www.opso.gov/246/Detainee-Search',
    type: 'cms',
    notes: 'Orleans Parish Sheriff detainee search',
  },
  {
    name: 'stbernard',
    label: 'St. Bernard Parish',
    url: 'http://stbernard.lavns.org/roster.aspx',
    type: 'lavine',
    notes: 'LA VINE ASP.NET roster',
  },
  {
    name: 'plaquemines',
    label: 'Plaquemines Parish',
    url: 'http://plaquemines.lavns.org/roster.aspx',
    type: 'lavine',
    notes: 'LA VINE ASP.NET roster',
  },
  {
    name: 'stjohn',
    label: 'St. John the Baptist Parish',
    url: 'https://stjohn-so-la.zuercherportal.com/inmates',
    type: 'zuercher',
    notes: 'Zuercher Portal SPA',
  },
  {
    name: 'stjames',
    label: 'St. James Parish',
    url: 'https://stjamesso.org/inmate-roster/filters/current/booking_time=desc/1',
    altUrls: [
      'https://www.stjamessheriff.org/inmate-roster/filters/current/booking_time=desc/1',
      'https://stjamessheriff.com/inmate-roster/filters/current/booking_time=desc/1',
    ],
    type: 'most_wanted_cms',
    notes: 'Most Wanted Government Websites CMS (same as St. Mary, Allen, Evangeline)',
  },
];

async function probeParish(browser, parish) {
  const result = {
    name: parish.name,
    label: parish.label,
    url: parish.url,
    type: parish.type,
    httpStatus: null,
    bondFieldPresent: false,
    fieldsDetected: [],
    inmateCount: 0,
    sampleInmates: [],
    apiEndpoints: [],
    extractionMethod: 'playwright',
    accessFriction: 'none',
    htmlPath: null,
    screenshotPath: null,
    error: null,
    notes: parish.notes,
  };

  const page = await browser.newPage();
  const apiRequests = [];

  // Intercept all network requests
  page.on('request', req => {
    const url = req.url();
    const method = req.method();
    if (
      url.includes('/api/') ||
      url.includes('.json') ||
      url.includes('search') ||
      url.includes('inmate') ||
      url.includes('detainee') ||
      url.includes('roster') ||
      url.includes('booking')
    ) {
      apiRequests.push({ url, method });
    }
  });

  try {
    // Try primary URL first
    let urlsToTry = [parish.url, ...(parish.altUrls || [])];
    let loaded = false;

    for (const tryUrl of urlsToTry) {
      try {
        const response = await page.goto(tryUrl, {
          timeout: 25000,
          waitUntil: 'domcontentloaded',
        });
        result.httpStatus = response?.status() || 0;
        result.url = tryUrl;
        if (result.httpStatus >= 200 && result.httpStatus < 400) {
          loaded = true;
          break;
        }
      } catch (e) {
        result.error = e.message;
      }
    }

    if (!loaded) {
      result.accessFriction = 'blocked';
      await page.close();
      return result;
    }

    // Wait for JS to render
    await page.waitForTimeout(4000);

    // Try to wait for content
    try {
      await page.waitForSelector('table, .inmate, .roster, .detainee, [class*="inmate"], [class*="booking"]', {
        timeout: 8000,
      });
    } catch (e) {
      // No specific selector found, continue anyway
    }

    // Get page content
    const html = await page.content();
    const text = await page.evaluate(() => document.body?.innerText || '');

    // Save HTML snapshot
    const htmlPath = path.join(OUTPUT_DIR, `${parish.name}_roster.html`);
    fs.writeFileSync(htmlPath, html);
    result.htmlPath = htmlPath;

    // Save screenshot
    const screenshotPath = path.join(OUTPUT_DIR, `${parish.name}_screenshot.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    result.screenshotPath = screenshotPath;

    // Detect bond fields
    const bondPatterns = [
      /bond[\s:$]+[\d,]+/gi,
      /bail[\s:$]+[\d,]+/gi,
      /bond amount/gi,
      /bail amount/gi,
      /\$[\d,]+\.?\d*\s*(bond|bail)/gi,
    ];

    for (const pattern of bondPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        result.bondFieldPresent = true;
        result.fieldsDetected.push('bond_amount');
        // Extract sample bond values
        const bondValues = text.match(/\$[\d,]+\.?\d*/g) || [];
        result.sampleInmates = bondValues.slice(0, 5).map(v => ({ bond: v }));
        break;
      }
    }

    // Detect other fields
    const fieldChecks = {
      name: /[A-Z]{2,},\s*[A-Z]{2,}/,
      booking_date: /booking\s*date|arrest\s*date/i,
      charges: /charge|offense/i,
      dob: /date of birth|dob|\d{2}\/\d{2}\/\d{4}/,
      race: /race|white|black|hispanic/i,
      gender: /gender|male|female/i,
    };

    for (const [field, pattern] of Object.entries(fieldChecks)) {
      if (pattern.test(text)) {
        if (!result.fieldsDetected.includes(field)) {
          result.fieldsDetected.push(field);
        }
      }
    }

    // Count inmates (look for name patterns)
    const nameMatches = text.match(/[A-Z]{2,},\s*[A-Z]{2,}/g) || [];
    result.inmateCount = nameMatches.length;

    // Sample inmate names
    if (nameMatches.length > 0 && result.sampleInmates.length === 0) {
      result.sampleInmates = nameMatches.slice(0, 5).map(n => ({ name: n }));
    }

    // Detect access friction
    if (text.toLowerCase().includes('captcha') || text.toLowerCase().includes('robot')) {
      result.accessFriction = 'captcha';
    } else if (text.toLowerCase().includes('login') || text.toLowerCase().includes('sign in')) {
      result.accessFriction = 'login';
    } else if (apiRequests.length > 0) {
      result.accessFriction = 'heavy_js';
    }

    // Record API endpoints found
    result.apiEndpoints = apiRequests.slice(0, 10);

    // Check for pagination
    if (text.toLowerCase().includes('next page') || text.toLowerCase().includes('page 1 of')) {
      result.accessFriction = result.accessFriction === 'none' ? 'pagination' : result.accessFriction;
    }

    console.log(`✓ ${parish.label}: HTTP ${result.httpStatus}, bond=${result.bondFieldPresent}, inmates=${result.inmateCount}, fields=${result.fieldsDetected.join(',')}`);

  } catch (e) {
    result.error = e.message;
    result.accessFriction = 'blocked';
    console.log(`✗ ${parish.label}: ERROR - ${e.message}`);
  }

  await page.close();
  return result;
}

async function main() {
  console.log('BondCurrent - River Parish Probe');
  console.log('=================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = [];

  for (const parish of PARISHES) {
    console.log(`Probing ${parish.label}...`);
    const result = await probeParish(browser, parish);
    results.push(result);
    // Polite delay between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();

  // Save JSON report
  const reportPath = path.join(OUTPUT_DIR, 'probe_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Save CSV
  const csvHeader = 'parish,url,source_type,http_status,bond_field_present,fields_detected,inmate_count,extraction_method,access_friction,api_endpoints,html_path,screenshot_path,error';
  const csvRows = results.map(r => [
    r.label,
    r.url,
    r.type,
    r.httpStatus,
    r.bondFieldPresent,
    r.fieldsDetected.join(';'),
    r.inmateCount,
    r.extractionMethod,
    r.accessFriction,
    r.apiEndpoints.map(a => a.url).join(';').substring(0, 100),
    r.htmlPath || '',
    r.screenshotPath || '',
    r.error || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

  const csvPath = path.join(OUTPUT_DIR, 'parish_probe.csv');
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'));

  // Print summary
  console.log('\n=== PROBE SUMMARY ===');
  for (const r of results) {
    const status = r.bondFieldPresent ? '✅ BOND' : (r.httpStatus === 200 ? '⚠️  NO BOND' : '❌ BLOCKED');
    console.log(`${status} | ${r.label} | HTTP ${r.httpStatus} | ${r.inmateCount} inmates | ${r.fieldsDetected.join(', ')}`);
  }

  console.log(`\nReport saved to: ${reportPath}`);
  console.log(`CSV saved to: ${csvPath}`);

  return results;
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
