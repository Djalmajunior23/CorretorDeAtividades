const { exec } = require('child_process');

exec('npx tsx server.ts', (error, stdout, stderr) => {
  console.log('STDOUT:', stdout);
  console.error('STDERR:', stderr);
});
