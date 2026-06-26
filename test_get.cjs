const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/questions',
  method: 'GET'
};
const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let responseData = '';
  res.on('data', d => responseData += d);
  res.on('end', () => console.log('Response:', responseData));
});
req.on('error', error => console.error(error));
req.end();
