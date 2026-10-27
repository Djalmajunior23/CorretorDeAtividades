import express from "express";
import { describe, it, expect, vi, afterEach } from "vitest";
import { registerAcademicRoutes } from "../../server/academicRoutes";
import { AccessControlEngine } from "../security/AccessControlEngine";
import { generateJwtToken } from "../utils/security";

const servers: ReturnType<express.Application["listen"]>[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map(server=>new Promise<void>(resolve=>server.close(()=>resolve())))); });
async function fixture(pool: any, role="PROFESSOR") {
  const app=express(); app.use(express.json()); app.use(AccessControlEngine.authGuardMiddleware()); registerAcademicRoutes(app,pool);
  const server=app.listen(0); servers.push(server); await new Promise<void>(resolve=>server.once("listening",resolve));
  const url=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
  const headers={ "Content-Type":"application/json",Authorization:`Bearer ${generateJwtToken({id:"teacher-a",name:"A",email:"a@example.test",role})}` };
  return (path: string, method="GET", body?: unknown) => fetch(url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
}
describe("Persistência e autorização de turmas e alunos",()=>{
  it("não simula gravação quando o banco está ausente",async()=>{
    const request=await fixture(null);
    expect((await request("/api/classes","POST",{name:"A"})).status).toBe(503);
  });
  it("impede limpeza global por professor sem executar SQL",async()=>{
    const pool={query:vi.fn()}; const request=await fixture(pool);
    expect((await request("/api/classes/reset-all","POST",{})).status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("desativa limpeza global também para administradores",async()=>{
    const pool={query:vi.fn()}; const request=await fixture(pool,"ADMIN");
    expect((await request("/api/classes/reset-all","POST",{})).status).toBe(410);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("ignora professor forjado no corpo e persiste o dono autenticado",async()=>{
    const pool={query:vi.fn().mockResolvedValue({rows:[]})}; const request=await fixture(pool);
    expect((await request("/api/classes","POST",{name:"A",teacher_id:"teacher-b"})).status).toBe(200);
    expect(pool.query.mock.calls[0][1][1]).toBe("teacher-a");
  });
  it.each(["/api/classes/foreign","/api/students/foreign"])("não confirma exclusão de recurso de outro dono: %s",async path=>{
    const pool={query:vi.fn().mockResolvedValue({rows:[]})}; const request=await fixture(pool);
    expect((await request(path,"DELETE")).status).toBe(404);
    expect(pool.query.mock.calls[0][0]).toContain("teacher_id=$3");
    expect(pool.query.mock.calls[0][1]).toEqual(["foreign",false,"teacher-a"]);
  });
  it("não cria aluno em turma inacessível",async()=>{
    const pool={query:vi.fn().mockResolvedValue({rows:[]})}; const request=await fixture(pool);
    expect((await request("/api/students","POST",{name:"Aluno",class_id:"foreign"})).status).toBe(404);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  it("informa falha de consulta sem retornar lista vazia de sucesso",async()=>{
    const request=await fixture({query:vi.fn().mockRejectedValue(new Error("db unavailable"))});
    expect((await request("/api/classes")).status).toBe(503);
  });
  it("desfaz importação inteira quando uma gravação falha",async()=>{
    const client={query:vi.fn(async(sql:string)=>{
      if(sql.startsWith("SELECT")) return {rows:[{id:"class-a",teacher_id:"teacher-a"}]};
      if(sql.startsWith("INSERT")) throw new Error("constraint violation");
      return {rows:[]};
    }),release:vi.fn()};
    const request=await fixture({query:vi.fn().mockResolvedValue({rows:[{id:"class-a"}]}),connect:vi.fn().mockResolvedValue(client)});
    expect((await request("/api/students/import-csv","POST",{class_id:"class-a",csv_data:"nome;email\nAna;ana@example.test"})).status).toBe(503);
    expect(client.query.mock.calls.map(([sql])=>sql)).toContain("ROLLBACK");
    expect(client.query.mock.calls.map(([sql])=>sql)).not.toContain("COMMIT");
    expect(client.release).toHaveBeenCalledOnce();
  });
});
