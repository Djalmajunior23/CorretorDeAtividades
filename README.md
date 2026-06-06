# CodeCheck AI

O CodeCheck AI é um sistema avançado de correção, teste e execução segura de códigos.

## Tecnologias

- **Backend**: Python + FastAPI
- **Frontend**: React + Tailwind CSS + Monaco Editor
- **Banco de Dados**: Neon PostgreSQL
- **Deploy**: Fly.io (Backend) / Vercel (Frontend)

## 🚀 Como fazer Deploy do Backend no Fly.io (via GitHub)

1. Faça push do código para o GitHub.
2. Acesse o painel do [Fly.io](https://fly.io/).
3. Clique em **"Launch a new app"** e selecione a opção de deploy pelo GitHub.
4. Conecte sua conta do GitHub e selecione o repositório.
5. O Fly.io detectará automaticamente o `Dockerfile` na pasta `/backend` (ou pode importar o Dockerfile ajustando o build path).
6. Configure as variáveis de ambiente necessárias (Secrets):
   - `DATABASE_URL=postgresql://usuariodebanco...` (Sua string do Neon)
   - `JWT_SECRET=super-secreto`
   - `ENVIRONMENT=production`
7. Inicie o deploy. Seu backend ficará disponível em uma URL como `https://meu-app.fly.dev`.

## 🌐 Como fazer Deploy do Frontend na Vercel

1. Acesse [Vercel](https://vercel.com/) e crie um novo projeto importando o mesmo repositório do GitHub.
2. O Vercel detectará o frontend em React/Vite.
3. Configure as variáveis de ambiente:
   - `VITE_API_BASE_URL=https://meu-app.fly.dev` (URL do seu backend no Fly.io)
4. Dê deploy e a aplicação estará pronta!

## Desenvolvimento Local

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (React/Vite)

```bash
npm install
npm run dev
```
