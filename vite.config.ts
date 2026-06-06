import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isAIStudio = process.env.DISABLE_HMR === 'true';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: isAIStudio ? 3000 : 5173,
      strictPort: true,
      hmr: isAIStudio ? false : {
        protocol: "ws",
        host: "localhost",
        port: 5173
      }
    },
  };
});
