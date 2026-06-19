# Deploy do CodeCheck Backend em VPS (Linux + Docker)

Este documento contém as instruções para o deploy do backend do CodeCheck em uma VPS usando Docker e Docker Compose, utilizando um provedor Ollama local (na mesma VPS).

## Pré-requisitos na VPS

1. **Docker e Docker Compose** instalados.
2. **Ollama** instalado e rodando (por padrão na porta `11434`).
3. Modelos necessários já baixados no Ollama. Ex:
   ```bash
   ollama run qwen2.5-coder:3b
   ollama run llama3.2:3b
   ollama run phi3:mini
   ```

## Configuração do Backend

1. **Clone do repositório** na VPS.
2. Acesse o diretório do projeto: `cd codecheck-backend` (ou o nome do seu diretório).
3. **Configure as Variáveis de Ambiente**:
   Crie um arquivo `.env` na raiz do projeto, baseado no `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Edite o `.env` e configure pelo menos a string de conexão com o banco de dados e ajuste os modelos (caso queira alterar algum):
   ```env
   DATABASE_URL="postgres://user:pass@host/nome_do_banco?sslmode=require"
   # Modelos suportados e instalados no Ollama:
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://host.docker.internal:11434
   AI_CODE_MODEL=qwen2.5-coder:3b
   AI_GENERAL_MODEL=llama3.2:3b
   AI_FEEDBACK_MODEL=llama3.2:3b
   AI_ACTIVITY_MODEL=qwen2.5-coder:3b
   AI_REPORT_MODEL=phi3:mini
   ```

## Iniciando a Aplicação

Execute o seguinte comando para construir a imagem e iniciar o contêiner em _background_:

```bash
docker compose up -d --build
```

Para monitorar os logs de inicialização e verificar se não houve erros, execute:

```bash
docker logs codecheck-backend -f
```

*(Pressione `Ctrl+C` para sair dos logs)*

## Testando o Backend e a IA

O backend expõe duas rotas úteis para validar o status da aplicação e a conexão com o Ollama:

1. **Health check básico do Backend:**
   ```bash
   curl http://localhost:8080/health
   ```
   Deve retornar algo como: `{"status":"ok","timestamp":"..."}`

2. **Teste de conectividade da IA (Comunicação Backend -> Ollama):**
   ```bash
   curl http://localhost:8080/api/ai/status
   ```
   Deve retornar os atributos de disponibilidade e a lista de modelos identificados do Ollama.

## Integração com o Frontend (Vercel)

No painel de configurações da Vercel (onde está o Frontend), certifique-se de atualizar a variável `VITE_API_BASE_URL` para apontar para o IP/domínio da VPS.

Exemplo de variável na Vercel:
```env
VITE_API_BASE_URL=http://<IP_DA_SUA_VPS>:8080
```
Se for HTTPS através de Nginx/Traefik na VPS:
```env
VITE_API_BASE_URL=https://api.codecheck.com.br
```

---

**Isso é tudo! O backend não depende mais do Fly.io e passa a ser servido 100% de forma independente com a integração local da IA.**
