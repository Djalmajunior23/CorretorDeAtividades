const http = require('http');
http.get('http://localhost:3000/api/questions', res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('HTTP', res.statusCode, JSON.parse(body).length));
});
