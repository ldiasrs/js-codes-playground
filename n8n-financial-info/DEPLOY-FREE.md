# 🆓 Deploy 100% GRATUITO no Fly.io

Este guia mostra como fazer deploy do n8n **completamente grátis** no Fly.io, sem precisar adicionar cartão de crédito.

## ⚠️ Importante: Tier Gratuito do Fly.io

O Fly.io oferece **GRATUITAMENTE**:
- ✅ 3 máquinas compartilhadas com 256MB RAM cada
- ✅ 3GB de storage persistente
- ✅ 160GB de transferência/mês
- ✅ SSL/TLS automático
- ❌ **Não precisa de cartão de crédito!**

## 🚀 Deploy Gratuito em 6 Passos

### 1️⃣ Instalar Fly CLI
```bash
# macOS
brew install flyctl

# Linux/WSL
curl -L https://fly.io/install.sh | sh
```

### 2️⃣ Login
```bash
flyctl auth login
```

### 3️⃣ Copiar configuração free tier
```bash
cd n8n-financial-info

# Usar a configuração free tier
cp fly-free.toml fly.toml
```

### 4️⃣ Criar aplicação (SEM deploy ainda)
```bash
flyctl launch --name n8n-financial-info --region gru --no-deploy --copy-config
```

Quando perguntado:
- ✅ Use existing fly.toml? **Yes**
- ❌ Setup Postgresql? **No**
- ❌ Deploy now? **No**

### 5️⃣ Criar volume (GRÁTIS até 3GB)
```bash
flyctl volumes create n8n_data --size 1 --region gru
```

### 6️⃣ Configurar secrets
```bash
# Gerar encryption key
flyctl secrets set N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Autenticação
flyctl secrets set N8N_BASIC_AUTH_ACTIVE=true
flyctl secrets set N8N_BASIC_AUTH_USER=admin
flyctl secrets set N8N_BASIC_AUTH_PASSWORD=SuaSenhaForte123

# URLs
flyctl secrets set N8N_HOST=n8n-financial-info.fly.dev
flyctl secrets set WEBHOOK_URL=https://n8n-financial-info.fly.dev/
```

### 7️⃣ Deploy!
```bash
flyctl deploy
```

## ✅ Sucesso!

Acesse: **https://n8n-financial-info.fly.dev**

## 💰 Confirmando que Está Grátis

```bash
# Ver recursos usados
flyctl status

# Deve mostrar:
# - 1 máquina com 256MB RAM ✅ GRÁTIS
# - Volume de 1GB ✅ GRÁTIS
```

## 🔧 Se Ainda Der Erro de Cartão

### Solução 1: Usar flyctl v2 (mais recente)
```bash
# Atualizar flyctl
brew upgrade flyctl  # macOS
# ou
curl -L https://fly.io/install.sh | sh  # Linux
```

### Solução 2: Verificar configuração
```bash
# Ver configuração atual
flyctl config show

# Deve ter memory = 256mb
```

### Solução 3: Deletar e recriar
```bash
# Deletar app existente
flyctl apps destroy n8n-financial-info

# Recomeçar do passo 4
flyctl launch --name n8n-financial-info --region gru --no-deploy
```

### Solução 4: Usar região diferente
Se `gru` (São Paulo) está tendo problemas, tente:
```bash
# Criar em outra região free tier
flyctl launch --name n8n-financial-info --region mia --no-deploy

# Regiões free tier: gru, mia, iad, lax, fra, syd
```

## 📊 Diferenças Free vs Pago

| Recurso | Free Tier | Pago |
|---------|-----------|------|
| RAM | 256MB | 512MB+ |
| Máquinas | 3 compartilhadas | Dedicadas |
| Volume | 3GB | Ilimitado |
| Transferência | 160GB/mês | Ilimitado |
| **Custo** | **$0/mês** | ~$2+/mês |

## 🎯 Performance do Free Tier

### É suficiente para n8n?
✅ **Sim!** Para uso pessoal/pequeno:
- Workflows simples a médios
- 5-10 workflows ativos
- Execuções a cada 15 minutos ou mais
- Processamento leve

⚠️ **Limitações**:
- Pode ser lento com workflows muito pesados
- Não recomendado para produção intensiva
- Máquina compartilhada (pode ter latência)

### Otimizações para Free Tier

1. **Reduzir concorrência**
```bash
flyctl secrets set N8N_CONCURRENCY_PRODUCTION_LIMIT=5
```

2. **Timeout menor**
```bash
flyctl secrets set EXECUTIONS_TIMEOUT=1800
flyctl secrets set EXECUTIONS_TIMEOUT_MAX=1800
```

3. **Logs mínimos**
```bash
flyctl secrets set N8N_LOG_LEVEL=warn
```

## 🐛 Troubleshooting Free Tier

### Erro: "requires credit card"
**Solução**: Certifique-se de que está usando **256MB RAM**
```bash
# Verificar fly.toml
cat fly.toml | grep memory
# Deve retornar: memory = "256mb"
```

### Erro: "insufficient resources"
**Solução**: Região pode estar cheia
```bash
# Tentar outra região
flyctl regions set mia  # Miami
# ou
flyctl regions set iad  # Virginia
```

### App muito lenta
**Solução**: É normal no free tier
- A primeira requisição pode demorar (cold start)
- Requisições subsequentes são mais rápidas
- Use ping service para manter ativo (opcional)

## 📈 Upgrade Futuro (Opcional)

Se precisar de mais recursos depois:
```bash
# Upgrade para 512MB (pago)
flyctl scale memory 512

# Voltar para free
flyctl scale memory 256
```

## ✅ Checklist Free Tier

- [ ] fly.toml com memory = "256mb"
- [ ] Volume de 1GB
- [ ] Região free tier (gru, mia, iad, lax)
- [ ] Nenhum add-on pago
- [ ] Deploy com sucesso
- [ ] App acessível
- [ ] **Custo: $0/mês** ✅

## 🎉 Pronto!

Seu n8n está rodando **100% grátis** no Fly.io!

**Custo mensal**: $0.00 🎊

---

## 📞 Ajuda

Se ainda tiver problemas:
1. Verifique [Fly.io Status](https://status.flyio.net/)
2. Veja [Fly.io Free Tier](https://fly.io/docs/about/pricing/)
3. Pergunte no [Fly.io Community](https://community.fly.io/)

---

**Versão Free Tier**: 1.0  
**Última atualização**: Novembro 2025

