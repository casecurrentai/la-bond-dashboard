import axios from 'axios';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

try {
  const resp = await axios.post(
    'https://stjohn-so-la.zuercherportal.com/api/portal/inmates/load',
    {
      name: 'ATKINSON',
      race: 'all', sex: 'all', cell_block: 'all', held_for_agency: 'any',
      in_custody: new Date().toISOString(),
      paging: { count: 10, start: 0 },
      sorting: { sort_by_column_tag: 'name', sort_descending: false },
    },
    {
      httpsAgent: agent,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Origin': 'https://stjohn-so-la.zuercherportal.com',
        'Referer': 'https://stjohn-so-la.zuercherportal.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }
  );
  console.log('Status:', resp.status);
  console.log('Data type:', typeof resp.data, Array.isArray(resp.data) ? 'array len=' + resp.data.length : '');
  if (Array.isArray(resp.data) && resp.data.length > 0) {
    console.log('Sample keys:', Object.keys(resp.data[0]));
  }
} catch (err) {
  console.log('Error:', err.code || err.message);
}
