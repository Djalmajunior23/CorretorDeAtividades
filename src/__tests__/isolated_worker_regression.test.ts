import { afterEach, describe, expect, it, vi } from "vitest";
import { ExecutionService } from "../ai/services/sandbox/execution_service";
import { executeInSandbox } from "../../sandbox";
import { workerHealth } from "../ai/services/sandbox/isolatedWorker";
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
function setup(results: unknown[]) {
  vi.stubEnv("NODE_ENV","production");
  vi.stubEnv("ISOLATED_WORKER_URL","https://worker.example.test/codecheck-ops");
  vi.stubEnv("ISOLATED_WORKER_TOKEN","test-only-secret");
  const fetch=vi.fn(async(_input: unknown, _init?: RequestInit)=>new Response(JSON.stringify(results.shift()),{status:200,headers:{"Content-Type":"application/json"}}));
  vi.stubGlobal("fetch",fetch);return fetch;
}
const result=(stdout="42\n")=>({status:"accepted",stdout,stderr:"",execution_time_ms:10,isolation_guaranteed:true});
describe("Executor isolado em produção",()=>{
  it("executa no worker autenticado e compara resultados no backend",async()=>{
    const fetch=setup([result(),result("wrong")]);
    const r=await ExecutionService.run({language:"python",code:"print(42)",test_cases:[{name:"A",stdin:"",expected_stdout:"42"},{name:"B",stdin:"",expected_stdout:"42"}]});
    expect(r.status).toBe("wrong_answer");expect(r.score).toBe(50);
    expect(fetch.mock.calls[0][0]).toBe("https://worker.example.test/codecheck-ops/run");
    const options=fetch.mock.calls[0][1] as RequestInit;
    expect((options.headers as Record<string,string>).Authorization).toBe("Bearer test-only-secret");
    expect(options.redirect).toBe("error");
    expect(options.body).not.toContain("expected_stdout");
  });
  it("recusa executor sem garantia de isolamento",async()=>{
    setup([{...result(),isolation_guaranteed:false}]);
    const r=await ExecutionService.run({language:"javascript",code:"console.log(42)"});
    expect(r.success).toBe(false);expect(r.score).toBe(0);
  });
  it("o adaptador legado usa o mesmo worker sem processo local",async()=>{
    setup([result()]);const r=await executeInSandbox("print(42)","python");
    expect(r.status).toBe("ACCEPTED");expect(r.isolationGuaranteed).toBe(true);
  });
  it("não atribui nota a execução manual sem testes",async()=>{
    setup([result()]);const r=await ExecutionService.run({language:"python",code:"print(42)"});
    expect(r.success).toBe(true);expect(r.score).toBe(0);
  });
  it("não aceita redirecionar credenciais nem protocolo HTTP",async()=>{
    const fetch=setup([]);vi.stubEnv("ISOLATED_WORKER_URL","http://worker.example.test");
    expect((await ExecutionService.run({language:"python",code:"pass"})).success).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("saúde depende da resposta real do serviço",async()=>{
    setup([{status:"ready",isolation:"docker",network:"none"}]);expect(await workerHealth()).toBe(true);
  });
  it("reutiliza credencial apenas quando Ollama pertence exatamente ao mesmo gateway",async()=>{
    const fetch=setup([{status:"ready",isolation:"docker",network:"none"}]);
    vi.stubEnv("OLLAMA_BASE_URL","https://worker.example.test/codecheck-ops/ollama");
    vi.stubEnv("OLLAMA_PROXY_TOKEN","shared-gateway-fixture");
    expect(await workerHealth()).toBe(true);
    expect((fetch.mock.calls[0][1]?.headers as Record<string,string>).Authorization).toBe("Bearer shared-gateway-fixture");
  });
  it("não envia a credencial de IA a outro serviço",async()=>{
    const fetch=setup([{status:"ready",isolation:"docker",network:"none"}]);
    vi.stubEnv("OLLAMA_BASE_URL","https://other.example.test/ollama");
    vi.stubEnv("OLLAMA_PROXY_TOKEN","must-not-leak");
    expect(await workerHealth()).toBe(true);
    expect((fetch.mock.calls[0][1]?.headers as Record<string,string>).Authorization).toBe("Bearer test-only-secret");
  });
});
