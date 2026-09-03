const server = require("../dist/server.cjs");

let isDbInitialized = false;

module.exports = async function handler(req, res) {
  // Lazy initialize database schema in serverless context
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
};
