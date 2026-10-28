# Correções operacionais — 27/10/2026

## Alterações

- Cadastro de turmas e alunos depende de PostgreSQL. Ausência/falha do banco retorna 503 e não confirma gravações em memória.
- As rotas de cadastro usam o professor da sessão verificada. Listagem, edição, exclusão, importação e cópia filtram o proprietário. Administradores mantêm acesso global explícito.
- Importação e cópia são transacionais. Erro em uma linha desfaz o lote.
- Limpeza global desativada. Inicialização não apaga registros acadêmicos.
- Interface não converte falhas de autorização/conexão em sucesso de cadastro local. Médias ausentes permanecem ausentes na API acadêmica.
- Inicialização serverless compartilha uma promessa, executa schema principal antes do complementar e propaga falhas.
- `/ready` e `/api/ready` retornam 503 se o banco não responde. As rotas `/health` e `/ready` são encaminhadas ao backend na Vercel.
- Execução local de código é bloqueada em produção/Vercel. Em desenvolvimento confiável exige `ALLOW_TRUSTED_LOCAL_EXECUTION=true`; testes mantêm suas fixtures locais. A remoção de variáveis de ambiente não é anunciada como isolamento de sistema de arquivos.
- Mudanças recentes da branch `security-hardening` foram conciliadas, preservando navegação, exportações compatíveis com o navegador e melhorias de interface sem reintroduzir limpezas automáticas e gravações fictícias.

## Validação

- 534 testes aprovados em 54 arquivos.
- TypeScript e build de produção aprovados. Permanecem avisos de tamanho do bundle e `import.meta` no bundle CommonJS.
- PostgreSQL real local, schema descartável: dois professores, persistência após reconectar, restrição de edição/exclusão cruzada, vínculos de alunos, rollback de CSV, cópia de turma e ausência de notas fictícias.
- Chromium com build de produção local: login, cadastro de turma/aluno por API autenticada, reinício do backend e consulta com mesma sessão; nenhuma exceção de página. Registros de teste foram removidos.
- O PostgreSQL local foi usado apenas para verificação; não substitui o Neon da implantação.

## Configuração Vercel

Projeto: `corretor-de-atividades`, equipe `djalmajunior23s-projects`.
A conexão existente `DATABASE_URL` permanece exclusiva de Production. Uma conexão Neon de desenvolvimento deve ser configurada para Preview antes da validação persistida desse ambiente. Não copiar credenciais de produção para previews de branches.

Configurados o provedor Ollama, sua URL HTTPS, timeouts e chaves sensíveis estáveis para sessão/cofre. Os valores sensíveis não integram o repositório. Alterações de ambiente só entram em vigor em um novo deploy.

## Dependências ainda necessárias para operação completa

1. Corrigir o certificado/cadeia HTTPS de `ollama.teacherjuniors.com.br`, listar modelos instalados e validar inferência real. A sondagem a partir deste ambiente retornou 503 com `CERTIFICATE_VERIFY_FAILED`; não há acesso administrativo à VPS nesta sessão.
2. Fornecer conexão Neon própria de Preview ou escolher uma implantação revisada com variáveis de Production. A conexão armazenada na Vercel é sensível e não foi exportada.
3. Provisionar worker isolado para executar programas de alunos. Bloquear processos locais é contenção, não implementação desse worker.
4. Configurar armazenamento durável para arquivos fora do filesystem efêmero da Vercel; preservar a chave do cofre. Validar backup/restauração e migrar exportações legadas antes de usar documentos confidenciais.
5. Estender autorização por proprietário aos demais módulos. Esta alteração cobre as rotas de gestão de turmas/alunos e não certifica isolamento de cada relatório, nota ou evidência.

Não foi executada limpeza global nem migração no Neon de produção.

## Preview publicado

Código disponibilizado no PR #4, branch `fix/operational-readiness-20261027`. A Vercel concluiu o build do commit `815b541` e o endpoint `/health` retornou JSON com status 200. `/api/ready` retornou 503 por ausência de conexão de banco no Preview; `/api/ai/status` continuou indicando IA indisponível. Esses resultados não validam login nem persistência no Neon publicado. Production e a implantação anterior não foram substituídas.
