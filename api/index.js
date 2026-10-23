import server from '../dist/server.cjs';

let isDbInitialized = false;

export default async function handler(req, res) {
  const activePool = (server.getCorePool ? server.getCorePool() : server.pool) || null;
  const activeVault = (server.getVaultPool ? server.getVaultPool() : server.vaultPool) || null;

  if (!isDbInitialized && activePool) {
    try {
      if (typeof server.initializeDatabase === "function") {
        await server.initializeDatabase(activePool, activeVault);
      }
      if (typeof server.initDatabase === "function") {
        await server.initDatabase();
      }
      isDbInitialized = true;
    } catch (e) {
      console.warn("[Vercel Serverless] DB initialization warning:", e);
    }
  }

  // Pass the request to the compiled Express app
  const app = server.default || server;
  return app(req, res);
}

