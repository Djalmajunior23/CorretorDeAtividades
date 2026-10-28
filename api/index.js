import server from '../dist/server.cjs';

export default async function handler(req, res) {
  try {
    // Shared promise prevents simultaneous cold-start requests racing migrations.
    await server.initializeApplicationDatabase();
  } catch (error) {
    console.error("[Vercel Serverless] Database initialization failed:", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ success: false, error: "Banco de dados indisponível. Tente novamente." }));
  }

  // Pass the request to the compiled Express app
  return server.default(req, res);
}
