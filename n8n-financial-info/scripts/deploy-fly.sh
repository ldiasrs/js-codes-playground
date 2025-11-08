#!/bin/bash
# scripts/deploy-fly.sh
# Script automatizado de deploy no Fly.io

set -e

echo "🚀 Deploy n8n no Fly.io"
echo "======================="

# Verificar se flyctl está instalado
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl não encontrado. Instale em: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Verificar se está logado
if ! flyctl auth whoami &> /dev/null; then
    echo "🔑 Fazendo login..."
    flyctl auth login
fi

# Nome da app
APP_NAME="n8n-financial-info"

# Verificar se app existe
if flyctl status -a $APP_NAME &> /dev/null; then
    echo "📦 App $APP_NAME já existe. Fazendo deploy..."
    flyctl deploy
else
    echo "🆕 Criando nova app..."
    
    # Launch interativo
    flyctl launch --name $APP_NAME --region gru --no-deploy
    
    # Criar volume
    echo "💾 Criando volume..."
    flyctl volumes create n8n_data --size 1 --region gru -a $APP_NAME
    
    # Configurar secrets
    echo "🔐 Configurando secrets..."
    
    # Gerar encryption key
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    flyctl secrets set N8N_ENCRYPTION_KEY="$ENCRYPTION_KEY" -a $APP_NAME
    
    # Configurar autenticação
    read -p "Username admin n8n: " ADMIN_USER
    read -sp "Senha admin n8n: " ADMIN_PASS
    echo
    
    flyctl secrets set \
        N8N_BASIC_AUTH_ACTIVE=true \
        N8N_BASIC_AUTH_USER="$ADMIN_USER" \
        N8N_BASIC_AUTH_PASSWORD="$ADMIN_PASS" \
        -a $APP_NAME
    
    # URLs
    flyctl secrets set \
        N8N_HOST="${APP_NAME}.fly.dev" \
        WEBHOOK_URL="https://${APP_NAME}.fly.dev/" \
        -a $APP_NAME
    
    # Deploy
    echo "🚀 Fazendo deploy..."
    flyctl deploy
fi

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://${APP_NAME}.fly.dev"
echo ""
echo "📊 Comandos úteis:"
echo "  - Ver logs: flyctl logs -a $APP_NAME"
echo "  - Ver status: flyctl status -a $APP_NAME"
echo "  - Abrir app: flyctl open -a $APP_NAME"

