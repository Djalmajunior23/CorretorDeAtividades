# Preparação da atualização de Production

Decisão do responsável: preparar a atualização da implantação de Production existente, sem replicar sua conexão de banco em Preview.

## Destino e origem

| Item | Valor confirmado |
| --- | --- |
| Equipe | `djalmajunior23s-projects` / `team_O6xIrNwMeKmhRtsOOs5BiOPW` |
| Projeto | `corretor-de-atividades` / `prj_qdVCP2mepJOjWKAwPF64VYdMMUG1` |
| Endereço de produção | `https://corretor-de-atividades.vercel.app` |
| Branch de entrega | `fix/operational-readiness-20261027` |
| Revisão | PR #4 |
| Commit de código validado | `815b54129fd81e0ae40592241f11337e30726d18` |
| Commit com documentação validado no Preview | `a0919d2f5011a9341b5a4d4a470dcc95af6cfcb9` |
| Runtime | Node.js 24 / Vite + Express |
| Última implantação Production observada | `dpl_3ZQHEWFbz9bwKxAXPtooqKR5uA9m` |
| URL imutável da versão anterior | `https://corretor-de-atividades-npg4d8w57-djalmajunior23s-projects.vercel.app` |

Antes da publicação, confirmar novamente o HEAD da branch e o destino de produção. O commit que acrescenta este documento não altera o código executável.

## Configuração conferida

A Vercel lista as seguintes variáveis para Production, sem que seus valores sensíveis tenham sido lidos ou exportados:

- `DATABASE_URL`: conexão já existente; permanece exclusiva de Production.
- `JWT_SECRET`: chave estável para todas as instâncias.
- `DATA_ENCRYPTION_KEY`: chave estável do cofre novo; preservar permanentemente.
- `AI_PROVIDER`, `OLLAMA_BASE_URL`, `AI_TIMEOUT_MS`, `AI_HEALTH_TIMEOUT_MS`.

A presença da variável não comprova que a conexão funciona, que o provedor é Neon ou que o schema implantado é compatível. Essa confirmação depende da execução do candidato com as variáveis de Production.

## Bloqueio confirmado em Production

A leitura passiva dos logs recentes da implantação `dpl_3ZQHEWFbz9bwKxAXPtooqKR5uA9m`, em 27/10/2026, encontrou falhas repetidas em `/api/submissions` durante `initializeDatabase`:

```text
Your account or project has exceeded the quota. Upgrade your plan to increase limits.
PostgreSQL SQLSTATE: 53000
```

O banco responde, mas o provedor recusa operações por cota da conta/projeto. O log não identifica qual franquia foi excedida: computação, armazenamento ou outra limitação. Não concluir que se trata de falha de senha, TLS do banco ou cota da Vercel. Conferir Usage/Billing no projeto Neon responsável pela conexão existente e restabelecer a disponibilidade. Não apagar dados nem contratar plano como tentativa automática de correção. Sem acesso ao painel desse banco nesta sessão, não foi possível inspecionar a franquia exata ou resolver a limitação.

Este bloqueio impede considerar o candidato pronto para publicação funcional. O build aprovado não supera uma restrição de cota no provedor de dados.

## Sequência de publicação

1. Resolver a cota do banco identificada acima. Conferir a revisão do PR e seu commit exato. Partir de checkout limpo da branch de entrega; não usar arquivos locais adicionais, `.env`, dados ou credenciais.
2. No diretório desse checkout, conferir o vínculo com o projeto e equipe acima. A publicação deve usar a conexão já armazenada na Vercel, sem copiá-la para o terminal, para Git ou para Preview.
3. Criar uma implantação **Production sem atribuir domínios**, pela CLI autenticada: `vercel deploy --prod --skip-domain --scope djalmajunior23s-projects`. A CLI deve resolver o projeto acima antes desse comando. Não usar o endpoint de criação de deployment como substituto se ele não permitir impedir a atribuição automática de domínios.
4. Aguardar `READY`, conferir SHA/equipe/projeto/target e guardar a URL imutável do candidato.
5. Consultar `/health` e `/api/ready` no candidato usando o acesso autenticado da Vercel. Readiness precisa responder JSON com HTTP 200 e banco `READY`. HTML com HTTP 200 não comprova saúde da API. A primeira requisição ao candidato executa as migrações idempotentes da aplicação: o build sozinho não as executa. Não promover se houver erro de schema ou conexão.
6. Validar login com conta existente e consulta de turmas. Não trocar a senha de usuários, não limpar registros e não criar cadastros de teste no banco real sem uma finalidade operacional definida. A validação automatizada de gravação já foi feita em PostgreSQL local descartável; isso não substitui a confirmação de uso no banco publicado.
7. Consultar `/api/ai/status`. Indisponibilidade de IA precisa continuar explícita; não declarar a correção automática com IA operacional enquanto não houver inferência real.
8. Depois da validação do candidato, promover **esse mesmo deployment Production** com `vercel promote <URL-DO-CANDIDATO> --scope djalmajunior23s-projects`. Isso é a etapa que troca o endereço de produção. Não promover o Preview esperando reutilizar as mesmas variáveis de ambiente.
9. Conferir a atribuição de domínio, `/health`, `/api/ready`, login e logs recentes após a promoção.

## Recuperação

A versão anterior está identificada na tabela acima. Antes de reverter a aplicação, avaliar compatibilidade do schema e os logs: rollback de deployment não desfaz migrações nem recupera dados. A versão anterior continha rotinas de limpeza na inicialização e não deve ser reinvocada como mecanismo de recuperação de registros. Nunca usar reset-all como procedimento de publicação ou rollback. Para problemas de dados, usar o backup/recuperação do banco, após verificar sua disponibilidade com o responsável pelo Neon.

## Limitações conhecidas

- Certificado HTTPS do endpoint Ollama precisa de correção na VPS; não houve inferência real validada.
- Execução local de programas dos alunos permanece bloqueada em produção. É necessário um worker isolado para habilitar essa funcionalidade.
- Arquivos confidenciais precisam de armazenamento durável fora do disco efêmero da Vercel; exportações legadas e recuperação de backup ainda exigem validação.
- A autorização por proprietário corrigida nesta entrega cobre gestão de turmas/alunos; não certifica todos os relatórios e módulos do sistema.

## Estado desta preparação

534 testes, TypeScript, build local e build de Preview aprovados; teste Chromium local com persistência após reinício aprovado. Nenhuma implantação Production foi criada ou promovida nesta etapa de preparação. Nenhuma migração, exclusão ou troca de senha foi executada no banco de produção. A conexão real com o Neon e o login no novo candidato Production permanecem por validar. A versão atual já registra falhas de cota no PostgreSQL; elas foram observadas nos logs, sem provocar requisições adicionais à aplicação antiga.
