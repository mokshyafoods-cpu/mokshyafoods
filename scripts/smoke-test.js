const http = require('http');

const checks = [
  { name: 'Frontend /', options: { host: '127.0.0.1', port: 3000, path: '/' } },
  { name: 'Frontend /about', options: { host: '127.0.0.1', port: 3000, path: '/about' } },
  { name: 'Frontend /contact', options: { host: '127.0.0.1', port: 3000, path: '/contact' } },
  { name: 'Frontend /products', options: { host: '127.0.0.1', port: 3000, path: '/products' } },
  { name: 'Backend /api/products', options: { host: '127.0.0.1', port: 5000, path: '/api/products' } },
];

function runCheck(check) {
  return new Promise((resolve) => {
    const req = http.request(check.options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        resolve({ name: check.name, status: res.statusCode, ok, length: body.length });
      });
    });
    req.on('error', (err) => resolve({ name: check.name, error: err.message }));
    req.setTimeout(5000, () => {
      req.abort();
      resolve({ name: check.name, error: 'timeout' });
    });
    req.end();
  });
}

(async () => {
  const results = [];
  for (const c of checks) {
    // eslint-disable-next-line no-await-in-loop
    const r = await runCheck(c);
    results.push(r);
    console.log(JSON.stringify(r));
  }
  const failed = results.filter((r) => r.error || !r.ok);
  console.log('\nSummary:');
  if (failed.length === 0) {
    console.log('All checks passed');
    process.exit(0);
  }
  console.log(`${failed.length} check(s) failed`);
  process.exit(2);
})();
