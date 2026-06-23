const http = require('http');

http.get('http://localhost:3000/api/settings/linting', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data.slice(0, 100));
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
