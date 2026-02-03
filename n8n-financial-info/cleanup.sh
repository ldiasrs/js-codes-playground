#!/bin/bash
# cleanup.sh - Remove and clean all Fly.io deployment resources to avoid costs
#
# Usage:
#   ./cleanup.sh          # Interactive (confirmações)
#   ./cleanup.sh --yes    # Não interativo (pula confirmações)

set -e

APP_NAME="n8n-financial-info"
FORCE_YES=false
[ "$1" = "--yes" ] || [ "$1" = "-y" ] && FORCE_YES=true

echo "🧹 Cleanup Fly.io - Remover deploy e evitar custos"
echo "================================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar flyctl
if ! command -v flyctl &> /dev/null; then
    error "flyctl não encontrado. Instale em: https://fly.io/docs/hands-on/install-flyctl/"
fi

# Verificar autenticação
if ! flyctl auth whoami &> /dev/null; then
    error "Não autenticado no Fly.io. Execute: flyctl auth login"
fi

# Verificar se app existe
if ! flyctl status -a "$APP_NAME" &> /dev/null 2>&1; then
    success "App $APP_NAME não existe ou já foi removido."
    echo ""
    echo "Limpando arquivos locais..."
    if [ -f .credentials.txt ]; then
        rm -f .credentials.txt
        success "Removido .credentials.txt"
    fi
    echo ""
    success "Nada mais para limpar. ✨"
    exit 0
fi

echo "App encontrado: $APP_NAME"
echo ""
echo "⚠️  Esta ação irá:"
echo "   • Deletar o app e todas as máquinas"
echo "   • Deletar volumes (dados do n8n serão perdidos)"
echo "   • Parar TODOS os custos no Fly.io"
echo ""

if [ "$FORCE_YES" = false ]; then
    read -p "Continuar? (y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Operação cancelada."
        exit 0
    fi
fi

echo ""

# 1. Parar máquinas (necessário para desanexar volumes)
echo "⏹️  Parando máquinas..."
flyctl scale count 0 -a "$APP_NAME" --yes 2>/dev/null || true
echo "   Aguardando desligamento (10s)..."
sleep 10

echo ""

# 2. Listar e deletar volumes (devem ser removidos antes do app)
echo "💾 Verificando volumes..."
VOLUMES=$(flyctl volumes list -a "$APP_NAME" 2>/dev/null | tail -n +2 | awk '{print $1}' || true)

if [ -n "$VOLUMES" ]; then
    for vol in $VOLUMES; do
        if [ -n "$vol" ]; then
            echo "   Deletando volume: $vol"
            flyctl volumes destroy "$vol" -a "$APP_NAME" --yes 2>/dev/null || warning "Volume $vol pode estar em uso ou já deletado"
        fi
    done
    success "Volumes removidos"
else
    echo "   Nenhum volume encontrado"
fi

echo ""

# 3. Destruir o app
echo "🗑️  Deletando app $APP_NAME..."
flyctl apps destroy "$APP_NAME" --yes || error "Falha ao deletar app"

success "App deletado"
echo ""

# 4. Remover credenciais locais
if [ -f .credentials.txt ]; then
    if [ "$FORCE_YES" = true ]; then
        rm -f .credentials.txt
        success "Removido .credentials.txt"
    else
        read -p "Remover .credentials.txt? (y/n) [y]: " rm_creds
        rm_creds=${rm_creds:-y}
        if [ "$rm_creds" = "y" ] || [ "$rm_creds" = "Y" ]; then
            rm -f .credentials.txt
            success "Removido .credentials.txt"
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CLEANUP CONCLUÍDO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💰 Custos no Fly.io foram interrompidos."
echo ""
echo "Para fazer deploy novamente: ./deploy.sh"
echo ""
