#!/usr/bin/env bash
# ==============================================================================
# Script: Configuração do Banco Vault (Dados Pesados / Logs) na VPS
# Projeto: CodeCheck (Arquitetura Híbrida: Neon Core + VPS Vault)
#
# OBJETIVO:
# Cria o banco 'codecheck_vault' na VPS para armazenar submissões completas,
# cofre de correções (correction_vault), arquivos, telemetria e logs pesados,
# mantendo o banco Neon enxuto, rápido e com baixo consumo de armazenamento.
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
log_error() { echo -e "${RED}[ERRO]${NC} $1" >&2; }

if [[ $EUID -ne 0 ]]; then
   log_error "Este script deve ser executado como root ou com sudo."
   exit 1
fi

DOMAIN="db.edstudenthub.com"
DB_NAME="codecheck_vault"

echo "================================================================================"
echo "          CONFIGURAÇÃO DO BANCO VAULT NA VPS (CODECHECK)                        "
echo "================================================================================"
echo ""
echo "Escolha em qual porta/cluster do PostgreSQL deseja configurar o banco Vault:"
echo "1) Porta 5433 (PostgreSQL 18 - Cluster isolado recomendado)"
echo "2) Porta 5432 (PostgreSQL 16 - Cluster padrão atual)"
echo -n "Opção (1 ou 2, padrão: 1): "
read -r PORT_OPT

if [[ "${PORT_OPT}" == "2" ]]; then
    PG_PORT=5432
    CLUSTER_DIR="/etc/postgresql/16/main"
else
    PG_PORT=5433
    CLUSTER_DIR="/etc/postgresql/18/codecheck"
fi

log_info "Utilizando PostgreSQL na porta: ${PG_PORT}"

# 1. Criação do Banco de Dados
log_info "Verificando se o banco '${DB_NAME}' já existe..."
sudo -u postgres psql -p "${PG_PORT}" -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
    sudo -u postgres psql -p "${PG_PORT}" -c "CREATE DATABASE ${DB_NAME} ENCODING 'UTF8';"

log_success "Banco de dados '${DB_NAME}' pronto na porta ${PG_PORT}."

# 2. Configuração de Senha Segura para 'codecheck_app'
if [[ -z "${CODECHECK_APP_PASSWORD:-}" ]]; then
    echo -n "Defina uma senha forte para o usuário 'codecheck_app': "
    read -s CODECHECK_APP_PASSWORD
    echo ""
    if [[ -z "${CODECHECK_APP_PASSWORD}" ]]; then
        log_error "Senha não pode ser vazia."
        exit 1
    fi
fi

# Cria ou atualiza usuário codecheck_app
sudo -u postgres psql -p "${PG_PORT}" -c "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'codecheck_app') THEN
        CREATE ROLE codecheck_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${CODECHECK_APP_PASSWORD}';
    ELSE
        ALTER ROLE codecheck_app WITH PASSWORD '${CODECHECK_APP_PASSWORD}';
    END IF;
END
\$\$;
"

# 3. Concessão de Privilégios e Extensões
sudo -u postgres psql -p "${PG_PORT}" -d "${DB_NAME}" -c "
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

GRANT CONNECT ON DATABASE ${DB_NAME} TO codecheck_app;
GRANT USAGE, CREATE ON SCHEMA public TO codecheck_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO codecheck_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO codecheck_app;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO codecheck_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO codecheck_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO codecheck_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO codecheck_app;
"

log_success "Extensões e permissões configuradas no banco '${DB_NAME}'."

# 4. Liberação de Firewall UFW
if command -v ufw &>/dev/null && ufw status | grep -q "Status: active"; then
    ufw allow ${PG_PORT}/tcp comment 'PostgreSQL CodeCheck Vault'
    log_success "Porta ${PG_PORT}/tcp liberada no firewall UFW."
fi

# 5. Saída com a variável de ambiente pronta para a Vercel
echo ""
log_success "================================================================================"
log_success "              CONFIGURAÇÃO DO BANCO VAULT CONCLUÍDA!                            "
log_success "================================================================================"
echo ""
echo "No Painel da Vercel (Settings -> Environment Variables), adicione a variável:"
echo ""
echo "   VAULT_DATABASE_URL=\"postgresql://codecheck_app:${CODECHECK_APP_PASSWORD}@${DOMAIN}:${PG_PORT}/${DB_NAME}?sslmode=verify-full\""
echo ""
echo "A variável 'DATABASE_URL' (Neon) permanece intacta como banco principal."
echo "O CodeCheck passará a gravar submissões pesadas e histórico na VPS automaticamente!"
