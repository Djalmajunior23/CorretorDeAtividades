import server from '../dist/server.cjs';

let isDbInitialized = false;

export default async function handler(req, res) {
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

  // Pass the request to the compiled Express app
  return server.default(req, res);
}
