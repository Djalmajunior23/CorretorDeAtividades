const http = require('http');
const data = JSON.stringify({topic: "Estrutura Condicional", language: "python", difficulty: "Iniciante"});
const req = http.request('http://localhost:3000/api/questions/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('HTTP', res.statusCode, body));
});
req.write(data);
req.end();
