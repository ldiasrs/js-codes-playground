# ⚡ Deploy Rápido no Fly.io - 5 Minutos

## 🎯 Pré-requisitos
- [ ] Conta no [Fly.io](https://fly.io) (gratuita)
- [ ] Fly CLI instalado

## 📦 Instalação Fly CLI

```bash
# macOS
brew install flyctl

# Linux/WSL
curl -L https://fly.io/install.sh | sh
```

## 🚀 Deploy em 5 Passos

### 1️⃣ Login
```bash
flyctl auth login
```

### 2️⃣ Ir para o diretório
```bash
cd n8n-financial-info
```

### 3️⃣ Launch (NÃO fazer deploy ainda)
```bash
flyctl launch --name n8n-financial-info --region gru --no-deploy
```

### 4️⃣ Criar volume e configurar secrets
```bash
# Criar volume para persistir dados
flyctl volumes create n8n_data --size 1 --region gru

# Configurar segurança
flyctl secrets set N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)
flyctl secrets set N8N_BASIC_AUTH_ACTIVE=true
flyctl secrets set N8N_BASIC_AUTH_USER=admin
flyctl secrets set N8N_BASIC_AUTH_PASSWORD=SuaSenhaForte123

# Configurar URLs
flyctl secrets set N8N_HOST=n8n-financial-info.fly.dev
flyctl secrets set WEBHOOK_URL=https://n8n-financial-info.fly.dev/

# Configurar Google Gemini API (substitua pela sua key)
flyctl secrets set GOOGLE_GEMINI_API_KEY=sua-key-aqui
```

### 5️⃣ Deploy!
```bash
flyctl deploy
```

## 🎉 Pronto!

Acesse: **https://n8n-financial-info.fly.dev**

Login:
- **User**: admin (ou o que você configurou)
- **Password**: SuaSenhaForte123 (ou o que você configurou)

## 📊 Comandos Úteis

```bash
# Ver logs em tempo real
flyctl logs

# Ver status
flyctl status

# Abrir no navegador
flyctl open

# SSH na máquina
flyctl ssh console

# Ver secrets configurados
flyctl secrets list

# Reiniciar
flyctl apps restart
```

## 🔧 Importar Workflow

1. Acesse https://n8n-financial-info.fly.dev
2. Login com suas credenciais
3. Menu → Workflows → Import from File
4. Selecione `financial-info-flow.json`
5. Configure as credenciais (Google Sheets, Gmail, Gemini)
6. Teste o workflow!

## 💾 Backup Automático

```bash
# Criar snapshot
flyctl volumes snapshots create n8n_data

# Listar snapshots
flyctl volumes snapshots list n8n_data
```

## 💰 Custo Estimado

**Configuração Atual** (512MB RAM):
- ~$1.94/mês
- 1GB volume: Grátis
- Transferência: Grátis

**Tier Gratuito** (256MB RAM):
- $0/mês (dentro do free tier)
- Edite `fly.toml` e mude memory para `256mb`

## 🐛 Problemas?

```bash
# Ver logs detalhados
flyctl logs

# Verificar configuração
flyctl config show

# Reiniciar do zero
flyctl apps destroy n8n-financial-info
# E recomece do passo 3
```

## 📝 Checklist

- [ ] Fly CLI instalado
- [ ] Login feito
- [ ] App criada (flyctl launch)
- [ ] Volume criado
- [ ] Secrets configurados
- [ ] Deploy feito
- [ ] App acessível no navegador
- [ ] Login funciona
- [ ] Workflow importado
- [ ] Credenciais configuradas

## 🎯 Próximos Passos

1. ✅ Configurar Google Sheets OAuth
2. ✅ Configurar Gmail OAuth
3. ✅ Criar planilha de ações
4. ✅ Testar workflow
5. ✅ Ativar agendamento

---

**Documentação completa**: [README-FLYIO.md](./README-FLYIO.md)

**Dúvidas?** Consulte a [documentação oficial do Fly.io](https://fly.io/docs)

