let isDbInitialized = false;

export default async function handler(req, res) {
  const server = await import('../dist/server.cjs');
  
  if (!isDbInitialized && server.pool) {
    try {
      if (typeof server.initDatabase === "function") {
        await server.initDatabase();
      }
      if (typeof server.initializeDatabase === "function") {
        await server.initializeDatabase(server.pool);
      }
      isDbInitialized = true;
    } catch (e) {
      console.warn("[Vercel Serverless] DB initialization warning:", e);
    }
  }
  
  // server.default represents the Express app instance
  return server.default(req, res);
}
