import { afterEach, describe, expect, it, vi } from "vitest";
import { ExecutionService } from "../ai/services/sandbox/execution_service";
import { executeInSandbox } from "../../sandbox";
import { allowTrustedLocalExecution } from "../utils/executionPolicy";
afterEach(()=>vi.unstubAllEnvs());
describe("Fronteira de execução em produção",()=>{
  it("bloqueia ambos os executores mesmo com flag local habilitada",async()=>{
    vi.stubEnv("NODE_ENV","production");vi.stubEnv("ALLOW_TRUSTED_LOCAL_EXECUTION","true");
    const code="console.log('executed')";
    expect((await ExecutionService.run({language:"javascript",code})).status).toBe("security_blocked");
    const result=await executeInSandbox(code,"javascript");
    expect(result.status).toBe("SECURITY_VIOLATION");expect(result.stdout).toBe("");expect(result.isolationGuaranteed).toBe(false);
  });
  it("Vercel não executa processos locais mesmo fora do modo production",()=>{
    vi.stubEnv("NODE_ENV","development");vi.stubEnv("VERCEL","1");vi.stubEnv("ALLOW_TRUSTED_LOCAL_EXECUTION","true");
    expect(allowTrustedLocalExecution()).toBe(false);
  });
});
