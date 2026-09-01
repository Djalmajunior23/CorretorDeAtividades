import type { Request, Response } from "express";
import app, { pool, initDatabase, initializeDatabase } from "../server";

let isDbInitialized = false;

export default async function handler(req: Request, res: Response) {
  // Lazy initialize database schema in serverless context
  if (!isDbInitialized && pool) {
    try {
      await initDatabase();
      await initializeDatabase(pool);
      isDbInitialized = true;
    } catch (e) {
      console.warn("[Vercel Serverless] DB initialization warning:", e);
    }
  }

  return app(req, res);
}
