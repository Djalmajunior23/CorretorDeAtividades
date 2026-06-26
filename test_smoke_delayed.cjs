const http = require('http');

setTimeout(async () => {
  function test(path, method = 'GET') {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method
      };
      const req = http.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`${method} ${path} -> ${res.statusCode}`);
          resolve();
        });
      });
      req.on('error', e => {
        console.error(`${method} ${path} -> Error: ${e.message}`);
        resolve();
      });
      req.end();
    });
  }

  await test('/health');
  await test('/api/classes');
}, 5000);
