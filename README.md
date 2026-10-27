# CodeCheck AI

O CodeCheck AI é um sistema avançado de correção, teste e execução segura de códigos.

## Tecnologias

- **Full-Stack Runtime**: Express (Node.js) + React + Vite
- **Banco de Dados**: Neon PostgreSQL
- **Integração IA**: Ollama (Rodando localmente em uma VPS) + Modelos (Qwen2.5-Coder, Llama 3.2, Phi-3, etc)

## Deploy na VPS (Docker + Ollama)

O backend foi preparado para rodar via Docker Compose apontando para o seu provedor Ollama local.

### Passos de Deploy na VPS:

1. Clone o repositório na VPS.
2. Certifique-se de que o Ollama está rodando localmente (porta 11434).
3. Crie um arquivo `.env` baseado em suas necessidades (vide `.env.example`).
4. Execute o deploy:

```bash
docker compose up -d --build
docker logs codecheck-backend -f
```

### Como testar se a IA está ativa:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/ai/status
```

### Configuração do Frontend (Vercel)

Na Vercel (onde o frontend está hospedado), atualize a variável de ambiente:

```env
VITE_API_BASE_URL=http://31.97.41.64:8080
```

## Desenvolvimento Local

Use Node.js 24 (ou uma versão aceita por `engines.node`) e Docker para o
PostgreSQL de desenvolvimento. A preparação do banco preserva uma conexão
externa já configurada; sem conexão, cria um banco local e grava sua credencial
gerada no arquivo ignorado `.env`, sem exibi-la no terminal.

```bash
# Instalar dependências
npm ci

# Preparar ou reiniciar PostgreSQL local (porta 55432)
npm run db:up

# Rodar em ambiente de desenvolvimento (Inicia Frontend e Backend integrados)
npm run dev

# Fazer o build de produção
npm run build

# Rodar a versão construída (Produção)
npm start
```

`npm test` isola as conexões de banco e as credenciais de IA para não acessar
serviços reais. Os testes do protocolo Ollama usam um servidor HTTP de teste;
isso não comprova inferência em uma VPS. `npm run lint` verifica TypeScript.

Em produção, configure `DATABASE_URL`, `JWT_SECRET` e as senhas dos usuários
administrativos nas variáveis do serviço. Senhas padrão de desenvolvimento não
são aceitas pelas contas de bootstrap em produção. Preserve também as chaves
geradas em `PERSISTENT_VOLUME_PATH/.keys`, ou configure `DATA_ENCRYPTION_KEY`:
perder a chave impede a leitura de arquivos confidenciais novos.

Para Ollama próprio, configure `AI_PROVIDER=ollama`, `OLLAMA_BASE_URL` com a URL
alcançável a partir do backend e, se necessário, `OLLAMA_PROXY_TOKEN`.
`AI_TIMEOUT_MS=30000` controla a geração; `AI_HEALTH_TIMEOUT_MS` permite ajustar
a sondagem de disponibilidade. Verifique `/api/ai/status` e uma geração real
antes de considerar a integração validada.

Consulte [a revisão técnica](docs/REVISAO_TECNICA.md) para as correções,
validações e limitações de produção identificadas.
