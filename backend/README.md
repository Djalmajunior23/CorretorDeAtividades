# CodeCheck AI - Backend

## Docker Sandbox
Para execução segura, o CodeCheck AI utiliza containers Docker.

### Pré-requisitos
- Docker instalado e rodando.

### Construção da imagem do Sandbox
```bash
docker build -t codecheck-python-sandbox backend/sandbox/python
```

## Como rodar

MVP de sistema autônomo para correção de atividades de programação.

1. Entre na pasta `backend`: `cd backend`
2. Crie um ambiente virtual: `python -m venv venv`
3. Ative o ambiente: `source venv/bin/activate` (Linux/Mac) ou `venv\Scripts\activate` (Windows)
4. Instale as dependências: `pip install -r requirements.txt`
5. Execute a aplicação: `uvicorn app.main:app --reload`

