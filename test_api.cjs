const http = require('http');
const data = JSON.stringify({
  title: "Soma de dois números",
  description: "Crie um programa que leia dois números e imprima a soma.",
  language: "python",
  difficulty: "Iniciante",
  starter_code: "a=int(input())\nb=int(input())\nprint(a+b)",
  test_cases: [{"input":"2\n3","expected_output":"5"}],
  rubric: {"logic":40,"syntax":30,"tests":30}
});
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/questions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let responseData = '';
  res.on('data', d => responseData += d);
  res.on('end', () => console.log('Response:', responseData));
});
req.on('error', error => console.error(error));
req.write(data);
req.end();
