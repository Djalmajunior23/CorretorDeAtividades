# IA, execução isolada e renovação TLS

## Serviço preparado

`scripts/vps/install.sh <SHA>` instala o serviço `codecheck-ops`, acessível pelo Traefik existente em `https://api.teacherjuniors.com.br/codecheck-ops`. Não publica uma porta adicional e não reinicia Traefik, backend ou banco. Precisa de Docker, Python, OpenSSL, curl e acesso aos repositórios de imagens/pacotes na VPS. Baixa os arquivos de uma revisão fixa do repositório GitHub.

A imagem do runner contém Node.js 24 e Python. JavaScript, TypeScript com remoção nativa de tipos e Python são suportados; Java/C/C++ e dependências externas não estão implementados nesta entrega. Cada caso de teste recebe um contêiner novo, sem rede nem volumes do backend, usuário 10001, filesystem somente leitura, diretórios temporários limitados, sem capabilities, sem elevação de privilégios, no máximo 32 processos, 256 MB e uma CPU. O worker impõe prazo externo além do timeout dentro do runner e remove trabalhos órfãos. O teste de saída esperada é feito no backend, não enviado ao programa do aluno. Execução manual sem casos de teste não recebe nota.

O gateway é um serviço confiável com acesso ao socket Docker, que equivale a privilégio administrativo na VPS. Somente esse gateway tem o socket: os contêineres dos alunos não o recebem. O token de acesso deve permanecer em arquivo root e nas variáveis sensíveis da Vercel. Contêineres compartilham o kernel do host; não constituem microVMs. Há no máximo dois trabalhos simultâneos; requisições excedentes recebem 429. Não foi instalado nenhum serviço pago adicional.

## IA

O mesmo gateway encaminha somente `/api/tags`, `/api/generate` e `/api/chat` ao Ollama local em `host.docker.internal:11434`. Rotas de criação, exclusão e download de modelos não são expostas. Chamadas exigem bearer token e usam HTTPS do domínio já configurado. O serviço local Ollama precisa estar instalado, escutando em endereço alcançável pela bridge Docker e ter modelos instalados. O instalador mostra somente os nomes dos modelos encontrados. As variáveis `AI_*_MODEL` devem apontar para modelos realmente presentes; inferência real ainda precisa ser validada.

O status de IA agora usa o mesmo token do provedor, verifica o protocolo de `/api/tags` e não aceita uma página HTML ou inventa catálogo de modelos.

## Certificado PostgreSQL

O instalador cria `codecheck-postgres-tls.timer`, executado a cada seis horas. Ele acompanha as renovações feitas pelo Traefik em `/opt/teacherjuniors/traefik/acme.json`, valida domínio, prazo, cadeia e correspondência da chave antes de atualizar o certificado do PostgreSQL 18 na porta 5432. Usa diretório root:postgres 750 e arquivos root:postgres 640; não imprime material privado. Recarrega o banco sem reinício, testa TLS local e tenta restaurar o par anterior em caso de falha.

Verificação operacional: `systemctl status codecheck-postgres-tls.timer`; logs: `journalctl -u codecheck-postgres-tls.service`. Nenhum hook acessa dados das tabelas.

## Ativação na Vercel

Depois que o instalador confirmar worker, execução Python e TLS:

- `ISOLATED_WORKER_URL=https://api.teacherjuniors.com.br/codecheck-ops`
- `ISOLATED_WORKER_TOKEN`: conteúdo de `/opt/codecheck-ops/ops.token` (sensível).
- `OLLAMA_BASE_URL=https://api.teacherjuniors.com.br/codecheck-ops/ollama`
- `OLLAMA_PROXY_TOKEN`: mesmo token (sensível).
- `AI_PROVIDER=ollama`; configurar modelos de acordo com a lista exibida pelo instalador.

Manter `DATABASE_URL` e as chaves existentes. Configurar tokens diretamente no painel Vercel; não enviar pelo chat. Fazer novo deploy do commit que contém o cliente do worker. Não ativar URLs/tokens antes de o serviço responder e não reabilitar processos locais no backend.

## Validação realizada

542 testes da aplicação, 3 testes do gateway, TypeScript e build aprovados. Testes cobrem autenticação, rejeição de rotas de mutação de modelos, payloads, configuração de isolamento, comparação de resultados no backend, recusa de respostas sem isolamento, ausência de nota para execução manual, token do status Ollama e recusa de HTML de proxy.

Um teste real de Docker com imagem disponível neste ambiente confirmou UID 10001, ausência de socket Docker, ausência de montagem do projeto, filesystem somente leitura e ausência de rotas de rede. O build das imagens Node/Python e a inferência Ollama reais ainda dependem da execução do instalador na VPS. O instalador contém testes reais do runner JavaScript e do gateway Python por HTTPS antes de anunciar sucesso. Não há acesso SSH à VPS nesta sessão.
