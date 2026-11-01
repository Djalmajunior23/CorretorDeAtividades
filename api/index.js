import server from '../dist/server.cjs';

let initialization;

export default async function handler(req, res) {
  if (server.pool) {
    try {
      initialization ||= (async () => {
        await server.initDatabase();
        await server.initializeDatabase(server.pool, server.vaultPool);
      })();
      await initialization;
    } catch (e) {
      initialization = undefined;
      console.warn("[Vercel Serverless] DB initialization warning:", e);
      return res.status(503).json({ error: "Banco de dados temporariamente indisponível. Tente novamente." });
    }
  }

  // Pass the request to the compiled Express app
  return server.default(req, res);
}
