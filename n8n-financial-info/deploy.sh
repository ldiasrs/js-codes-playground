#!/bin/bash
# deploy.sh - Script ÚNICO para deploy n8n no Fly.io
# Versão otimizada com fix de OOM incluso

set -e

APP_NAME="n8n-financial-info"
REGION="gru"  # São Paulo, Brasil

echo "🚀 Deploy n8n no Fly.io (Free/Otimizado)"
echo "========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para erro
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Função para sucesso
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para aviso
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar se flyctl está instalado
if ! command -v flyctl &> /dev/null; then
    error "flyctl não encontrado. Instale em: https://fly.io/docs/hands-on/install-flyctl/"
fi

# Verificar se está logado
if ! flyctl auth whoami &> /dev/null; then
    echo "🔑 Fazendo login no Fly.io..."
    flyctl auth login || error "Falha no login"
fi

success "Autenticado no Fly.io"
echo ""

# Verificar se app já existe
APP_EXISTS=false
if flyctl status -a $APP_NAME &> /dev/null 2>&1; then
    APP_EXISTS=true
fi

if [ "$APP_EXISTS" = true ]; then
    echo "📦 App $APP_NAME já existe"
    echo ""
    echo "Escolha uma opção:"
    echo "1) Atualizar/Redeploy (resolver OOM se existir)"
    echo "2) Deletar e recriar do zero"
    echo "3) Cancelar"
    echo ""
    read -p "Opção (1/2/3): " option
    
    case $option in
        1)
            echo ""
            echo "🔄 Modo: Atualizar existente"
            echo ""
            ;;
        2)
            echo ""
            warning "Deletando app existente..."
            flyctl apps destroy $APP_NAME --yes || error "Falha ao deletar"
            APP_EXISTS=false
            success "App deletado"
            echo ""
            ;;
        3)
            echo ""
            echo "👋 Operação cancelada"
            exit 0
            ;;
        *)
            error "Opção inválida"
            ;;
    esac
fi

# Criar app se não existir
if [ "$APP_EXISTS" = false ]; then
    echo "🆕 Criando nova aplicação..."
    echo ""
    
    # Perguntar sobre memória
    warning "IMPORTANTE: O n8n precisa de MÍNIMO 512MB RAM"
    echo ""
    echo "Opções de memória:"
    echo "1) 256MB - ❌ NÃO FUNCIONA (OOM) - \$0/mês"
    echo "2) 512MB - ✅ FUNCIONA - ~\$2/mês"
    echo "3) 1GB   - ✅ IDEAL - ~\$6/mês"
    echo ""
    read -p "Escolha (1/2/3) [recomendado: 2]: " mem_option
    
    case $mem_option in
        1)
            warning "256MB causará Out of Memory! Não recomendado."
            read -p "Continuar mesmo assim? (y/n): " continue_256
            if [ "$continue_256" != "y" ]; then
                error "Deploy cancelado"
            fi
            MEMORY="256mb"
            ;;
        2)
            MEMORY="512mb"
            success "512MB selecionado (mínimo funcional)"
            ;;
        3)
            MEMORY="1gb"
            success "1GB selecionado (ideal)"
            ;;
        *)
            MEMORY="512mb"
            warning "Opção inválida, usando padrão: 512MB"
            ;;
    esac
    
    echo ""
    echo "🔧 Atualizando fly.toml com $MEMORY..."
    
    # Atualizar fly.toml com memória escolhida
    sed -i.bak "s/memory = '[0-9]*mb'/memory = '$MEMORY'/" fly.toml
    rm -f fly.toml.bak
    
    # Launch sem deploy
    flyctl launch --name $APP_NAME --region $REGION --no-deploy --copy-config || error "Falha no launch"
    success "App criada"
    echo ""
    
    # Criar volume
    echo "💾 Criando volume (1GB)..."
    flyctl volumes create n8n_data --size 1 --region $REGION -a $APP_NAME || error "Falha ao criar volume"
    success "Volume criado"
    echo ""
fi

# Configurar secrets
echo "🔐 Configurando secrets..."
echo ""

# Verificar se já tem encryption key
if flyctl secrets list -a $APP_NAME 2>/dev/null | grep -q "N8N_ENCRYPTION_KEY"; then
    echo "ℹ️  Secrets já configurados"
    read -p "Reconfigurar secrets? (y/n): " reconfig
    if [ "$reconfig" != "y" ]; then
        echo "Mantendo secrets existentes"
    else
        reconfig="y"
    fi
else
    reconfig="y"
fi

if [ "$reconfig" = "y" ]; then
    # Gerar encryption key
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    # Pedir credenciais
    read -p "Username admin [admin]: " ADMIN_USER
    ADMIN_USER=${ADMIN_USER:-admin}
    
    read -sp "Password admin: " ADMIN_PASS
    echo ""
    
    if [ -z "$ADMIN_PASS" ]; then
        ADMIN_PASS=$(openssl rand -base64 12)
        echo "Senha gerada automaticamente: $ADMIN_PASS"
    fi
    
    # Configurar secrets básicos
    flyctl secrets set \
        N8N_ENCRYPTION_KEY="$ENCRYPTION_KEY" \
        N8N_BASIC_AUTH_ACTIVE=true \
        N8N_BASIC_AUTH_USER="$ADMIN_USER" \
        N8N_BASIC_AUTH_PASSWORD="$ADMIN_PASS" \
        N8N_HOST="${APP_NAME}.fly.dev" \
        WEBHOOK_URL="https://${APP_NAME}.fly.dev/" \
        -a $APP_NAME || error "Falha ao configurar secrets"
    
    # Configurar otimizações de memória
    flyctl secrets set \
        NODE_OPTIONS="--max-old-space-size=200" \
        N8N_CONCURRENCY_PRODUCTION_LIMIT=1 \
        N8N_DIAGNOSTICS_ENABLED=false \
        N8N_VERSION_NOTIFICATIONS_ENABLED=false \
        N8N_TEMPLATES_ENABLED=false \
        N8N_LOG_LEVEL=warn \
        -a $APP_NAME || warning "Falha ao configurar otimizações (não crítico)"
    
    success "Secrets configurados"
    echo ""
    
    # Salvar credenciais em arquivo local
    cat > .credentials.txt << EOF
App: $APP_NAME
URL: https://${APP_NAME}.fly.dev
User: $ADMIN_USER
Password: $ADMIN_PASS
Encryption Key: $ENCRYPTION_KEY
EOF
    
    success "Credenciais salvas em .credentials.txt"
    echo ""
fi

# Verificar se precisa escalar memória (fix OOM)
echo "🔍 Verificando configuração de memória..."
CURRENT_MEM=$(flyctl config show -a $APP_NAME 2>/dev/null | grep -o 'memory.*mb' | grep -o '[0-9]*' || echo "0")

if [ "$CURRENT_MEM" -lt 512 ] 2>/dev/null; then
    warning "Memória atual: ${CURRENT_MEM}MB (insuficiente)"
    echo ""
    echo "Escalando para 512MB (mínimo necessário)..."
    flyctl scale memory 512 -a $APP_NAME --yes || warning "Falha ao escalar (será feito no deploy)"
    success "Memória configurada para 512MB"
    echo ""
fi

# Deploy
echo "🚀 Fazendo deploy..."
echo ""
flyctl deploy -a $APP_NAME || error "Falha no deploy"

success "Deploy concluído!"
echo ""

# Aguardar app inicializar
echo "⏳ Aguardando app inicializar (30 segundos)..."
sleep 30

# Verificar status
echo ""
echo "📊 Status da aplicação:"
flyctl status -a $APP_NAME

# Verificar health
echo ""
echo "🏥 Verificando health..."
sleep 5

if flyctl status -a $APP_NAME | grep -q "healthy"; then
    success "App está saudável!"
else
    warning "App pode não estar 100% saudável ainda. Verificando logs..."
    echo ""
    echo "Últimas linhas do log:"
    flyctl logs -a $APP_NAME --limit 20
fi

# Resumo final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOY CONCLUÍDO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 URL: https://${APP_NAME}.fly.dev"
echo "👤 User: $ADMIN_USER (ver .credentials.txt)"
echo "🔑 Password: (ver .credentials.txt)"
echo ""
echo "📝 Comandos úteis:"
echo "   flyctl logs -a $APP_NAME          # Ver logs"
echo "   flyctl status -a $APP_NAME        # Ver status"
echo "   flyctl open -a $APP_NAME          # Abrir no browser"
echo "   flyctl ssh console -a $APP_NAME   # SSH na máquina"
echo "   flyctl apps restart -a $APP_NAME  # Reiniciar"
echo ""
echo "💾 Credenciais salvas em: .credentials.txt"
echo ""

# Perguntar se quer abrir
read -p "Abrir app no navegador? (y/n): " open_browser
if [ "$open_browser" = "y" ]; then
    flyctl open -a $APP_NAME
fi

echo ""
success "Tudo pronto! 🎉"
echo ""
echo "⚠️  Lembre-se:"
echo "   - 512MB RAM = ~\$2/mês"
echo "   - 1GB RAM = ~\$6/mês"
echo "   - Alternativa grátis: DigitalOcean (\$200 créditos)"
echo ""

