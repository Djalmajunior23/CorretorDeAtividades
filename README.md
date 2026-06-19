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

```bash
# Instalar dependências
npm install

# Rodar em ambiente de desenvolvimento (Inicia Frontend e Backend integrados)
npm run dev

# Fazer o build de produção
npm run build

# Rodar a versão construída (Produção)
npm start
```
