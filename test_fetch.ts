async function test() {
  const res = await fetch('http://127.0.0.1:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({email: 'test@codecheck.ai'})
  });
  console.log(await res.text());
}
test();
