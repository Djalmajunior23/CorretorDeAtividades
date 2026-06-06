import { spawn } from 'child_process';
const pythonBackend = spawn('python3', ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', '8081'], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: '.' }
});
pythonBackend.on('close', (code) => {
    console.log('Python backend exited with code', code);
});
setTimeout(() => pythonBackend.kill(), 3000);
