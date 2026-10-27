import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { generateJwtToken } from "../utils/security";
import { AccessControlEngine } from "../security/AccessControlEngine";
import { setupTeacherAPIs } from "../../server-apis-addon";

describe("Cadastro acadêmico sem banco não anuncia sucesso", () => {
  let server: ReturnType<express.Application["listen"]>;
  let base: string;
  const teacher=generateJwtToken({id:"prof_djalma",name:"Professor",email:"prof@example.test",role:"PROFESSOR"});
  beforeAll(async()=>{
    const app=express();app.use(express.json());app.use(AccessControlEngine.authGuardMiddleware());
    setupTeacherAPIs(app,null,null,{initializeSchema:false});
    server=app.listen(0);await new Promise<void>(resolve=>server.once("listening",resolve));
    base=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
  });
  afterAll(async()=>new Promise<void>(resolve=>server.close(()=>resolve())));
  it("catálogo exige sessão",async()=>expect((await fetch(base+"/api/classes")).status).toBe(401));
  it.each(["/api/classes","/api/students"])("não salva %s no cache volátil",async path=>{
    const response=await fetch(base+path,{method:"POST",headers:{Authorization:`Bearer ${teacher}`,"Content-Type":"application/json"},body:JSON.stringify({name:"Registro"})});
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("Nenhum dado foi salvo");
  });
});
