import { describe, expect, it, afterEach, vi } from "vitest";
import http from "node:http";
import { app } from "../../server";
afterEach(()=>vi.unstubAllEnvs());
describe("Status de IA autenticado e baseado no catálogo real",()=>{
  it.each([true,false])("não usa HTML nem catálogo inventado; protocolo válido=%s",async valid=>{
    let rootRequests=0; const authorizations: unknown[]=[];
    const upstream=http.createServer((req,res)=>{
      if(req.url==="/")rootRequests++;
      authorizations.push(req.headers.authorization);
      res.setHeader("Content-Type",valid?"application/json":"text/html");
      res.end(valid?JSON.stringify({models:[{name:"installed-model:1"}]}):"<html>Proxy login</html>");
    });
    await new Promise<void>(resolve=>upstream.listen(0,"127.0.0.1",resolve));
    vi.stubEnv("AI_PROVIDER","ollama");vi.stubEnv("OLLAMA_PROXY_TOKEN","fixture-token");
    vi.stubEnv("OLLAMA_BASE_URL",`http://127.0.0.1:${(upstream.address() as {port:number}).port}`);
    const server=app.listen(0);await new Promise<void>(resolve=>server.once("listening",resolve));
    try{
      const response=await fetch(`http://127.0.0.1:${(server.address() as {port:number}).port}/api/ai/status`);
      const body=await response.json();expect(body.ai_available).toBe(valid);
      if(valid)expect(body.models).toEqual(["installed-model:1"]);
      expect(rootRequests).toBe(0);expect(authorizations.length).toBeGreaterThan(0);
      expect(authorizations.every(value=>value==="Bearer fixture-token")).toBe(true);
    }finally{await Promise.all([new Promise<void>(resolve=>server.close(()=>resolve())),new Promise<void>(resolve=>upstream.close(()=>resolve()))]);}
  });
});
