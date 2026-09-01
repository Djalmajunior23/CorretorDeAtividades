# Guia de Deploy & Persistência de Dados no Vercel - CodeCheck AI (SENAI)

Este guia explica passo a passo como garantir que **todos os dados cadastrados e salvos** (turmas, alunos, submissões, correções da IA, avaliações e relatórios pedagógicos) permaneçam permanentemente salvos e acessíveis no **Vercel**.

---

## 1. Como Funciona a Persistência de Dados na Nuvem

Como as instâncias do **Vercel** rodam em arquitetura *Serverless* (sem disco permanente local), o sistema utiliza um banco de dados **PostgreSQL em Nuvem** compartilhado.

Ao utilizar a mesma `DATABASE_URL`:
- Tudo o que for salvo no ambiente de desenvolvimento/preview é gravado no banco em nuvem.
- A sua aplicação publicada no Vercel acessará e atualizará **os mesmos dados em tempo real**.

---

## 2. Passo a Passo Rápido

### Passo 1: Criar Banco de Dados PostgreSQL Gratuito
Você pode utilizar qualquer provedor PostgreSQL em nuvem gratuito:
1. **Neon (Recomendado)**: [neon.tech](https://neon.tech) (Crie um projeto em 30 segundos e copie a Connection String).
2. **Supabase**: [supabase.com](https://supabase.com) (Crie um projeto e copie a URI PostgreSQL).
3. **Vercel Postgres**: Na aba *Storage* do seu dashboard Vercel, crie um Postgres database.

### Passo 2: Configurar Variáveis de Ambiente no Vercel
No painel do seu projeto no Vercel, vá em:
`Settings` -> `Environment Variables` e adicione:

| Variável | Valor Exemplo | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/codecheck?sslmode=require` | URL de conexão PostgreSQL |
| `GEMINI_API_KEY` | `AIzaSy...` | Chave da API do Google Gemini para correções pedagógicas |
| `NODE_ENV` | `production` | Ambiente de produção |

### Passo 3: Fazer o Deploy no Vercel
Os seguintes arquivos de configuração já estão incluídos no repositório:
- `vercel.json`: Regras de rewrite e roteamento para o frontend Vite e funções de backend.
- `api/index.ts`: Ponto de entrada Serverless que inicializa as tabelas do PostgreSQL e processa as requisições Express.

Ao conectar o repositório GitHub ao Vercel, o deploy é concluído de forma 100% automatizada.

---

## 3. Ferramentas Integradas de Sincronização e Backup

No cabeçalho da aplicação, clique no botão **"Nuvem & Vercel Sync"** para:
- **Verificar Status**: Conferir se o banco em nuvem está conectado e medir a latência.
- **Exportar Backup Completo (.JSON)**: Baixar um dump de todos os dados cadastrados.
- **Importar / Migrar Dados**: Restaurar dados de backup diretamente no PostgreSQL com um clique.
- **Sincronizar Dados Padrão**: Popular as turmas e matrizes curriculares do SENAI no banco de dados.
