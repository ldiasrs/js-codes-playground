#!/bin/bash
# Comandos para deploy 100% GRATUITO no Fly.io

echo "🆓 Deploy Gratuito n8n no Fly.io"
echo "================================="
echo ""

# Verificar se já existe volume
if flyctl volumes list -a n8n-financial-info 2>/dev/null | grep -q "n8n_data"; then
    echo "✅ Volume n8n_data já existe"
else
    echo "📦 Criando volume n8n_data (1GB - GRÁTIS)..."
    flyctl volumes create n8n_data --size 1 --region gru -a n8n-financial-info
fi

echo ""
echo "🔐 Configurando secrets..."
echo ""

# Perguntar se quer gerar nova encryption key
read -p "Gerar nova N8N_ENCRYPTION_KEY? (y/n): " gen_key
if [ "$gen_key" = "y" ]; then
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    echo "Nova key gerada: $ENCRYPTION_KEY"
    flyctl secrets set N8N_ENCRYPTION_KEY="$ENCRYPTION_KEY" -a n8n-financial-info
fi

# Configurar autenticação
read -p "Username admin: " ADMIN_USER
read -sp "Password admin: " ADMIN_PASS
echo ""

flyctl secrets set \
    N8N_BASIC_AUTH_ACTIVE=true \
    N8N_BASIC_AUTH_USER="$ADMIN_USER" \
    N8N_BASIC_AUTH_PASSWORD="$ADMIN_PASS" \
    -a n8n-financial-info

# URLs
flyctl secrets set \
    N8N_HOST="n8n-financial-info.fly.dev" \
    WEBHOOK_URL="https://n8n-financial-info.fly.dev/" \
    -a n8n-financial-info

echo ""
echo "🚀 Fazendo deploy..."
flyctl deploy -a n8n-financial-info

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://n8n-financial-info.fly.dev"
echo "👤 User: $ADMIN_USER"
echo "🔑 Password: (a senha que você digitou)"

