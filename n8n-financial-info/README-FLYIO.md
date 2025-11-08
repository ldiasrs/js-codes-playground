# 🚀 Deploy n8n no Fly.io

Guia completo para fazer deploy do n8n Financial Info no Fly.io.

## 📋 Pré-requisitos

- Conta no Fly.io (gratuita)
- CLI do Fly.io instalado
- Docker instalado (opcional, para testes locais)

## 🔧 Instalação do Fly CLI

### macOS
```bash
brew install flyctl
```

### Linux
```bash
curl -L https://fly.io/install.sh | sh
```

### Windows
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

## 🚀 Deploy Passo a Passo

### 1. Login no Fly.io
```bash
flyctl auth login
```

### 2. Criar aplicação
```bash
cd n8n-financial-info
flyctl launch
```

Quando perguntado:
- ✅ App name: `n8n-financial-info` (ou outro nome)
- ✅ Region: `gru` (São Paulo, Brasil)
- ❌ Setup Postgresql? **No** (usaremos volume)
- ❌ Deploy now? **No** (vamos configurar antes)

### 3. Criar volume para persistência
```bash
flyctl volumes create n8n_data --size 1 --region gru
```

### 4. Configurar secrets (variáveis de ambiente sensíveis)
```bash
# Gerar chave de criptografia
flyctl secrets set N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Configurar autenticação básica
flyctl secrets set N8N_BASIC_AUTH_ACTIVE=true
flyctl secrets set N8N_BASIC_AUTH_USER=admin
flyctl secrets set N8N_BASIC_AUTH_PASSWORD=sua-senha-forte

# URLs (ajustar com seu domínio)
flyctl secrets set N8N_HOST=n8n-financial-info.fly.dev
flyctl secrets set WEBHOOK_URL=https://n8n-financial-info.fly.dev/

# APIs do Google (se tiver)
flyctl secrets set GOOGLE_GEMINI_API_KEY=sua-key
```

### 5. Deploy!
```bash
flyctl deploy
```

### 6. Verificar status
```bash
flyctl status
flyctl logs
```

### 7. Abrir aplicação
```bash
flyctl open
```

Ou acesse: `https://n8n-financial-info.fly.dev`

## 📊 Comandos Úteis

### Ver logs em tempo real
```bash
flyctl logs -a n8n-financial-info
```

### Escalar recursos (se necessário)
```bash
# Aumentar memória
flyctl scale memory 1024

# Aumentar número de instâncias
flyctl scale count 2
```

### SSH na máquina
```bash
flyctl ssh console
```

### Ver variáveis de ambiente
```bash
flyctl secrets list
```

### Atualizar secrets
```bash
flyctl secrets set NOME_VARIAVEL=novo-valor
```

### Reiniciar aplicação
```bash
flyctl apps restart n8n-financial-info
```

## 💾 Backup dos Dados

### Criar snapshot do volume
```bash
flyctl volumes snapshots create n8n_data
```

### Listar snapshots
```bash
flyctl volumes snapshots list n8n_data
```

### Restaurar snapshot
```bash
flyctl volumes create n8n_data_restore --snapshot-id <snapshot-id>
```

## 🔒 Segurança

### SSL/TLS
✅ Automático via Fly.io (HTTPS forçado)

### Autenticação
Configure N8N_BASIC_AUTH para proteger a interface

### Firewall
Por padrão, apenas portas 80 e 443 são expostas

## 📈 Monitoramento

### Métricas
```bash
flyctl metrics -a n8n-financial-info
```

### Dashboard
https://fly.io/dashboard

## 💰 Custos

### Tier Gratuito Fly.io
- ✅ 3 máquinas compartilhadas (256MB RAM cada)
- ✅ 160GB de transferência
- ✅ 3GB de volume persistente

### Recursos Usados por Este Setup
- 1 máquina: 512MB RAM (~$1.94/mês)
- 1GB volume: Grátis (até 3GB)
- Transferência: Grátis (até 160GB)

**Total estimado**: ~$2/mês ou pode ser GRÁTIS se ajustar para 256MB RAM

### Para Usar Tier Gratuito (256MB RAM)
Edite `fly.toml`:
```toml
[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

## 🐛 Troubleshooting

### Aplicação não inicia
```bash
flyctl logs
# Verificar erros de memória ou configuração
```

### Volume cheio
```bash
flyctl volumes list
flyctl volumes extend <volume-id> --size 2
```

### Reset completo
```bash
# Deletar app
flyctl apps destroy n8n-financial-info

# Deletar volume
flyctl volumes delete <volume-id>

# Recomeçar
flyctl launch
```

## 🔄 Atualizar n8n

```bash
# Pull nova imagem e redeploy
flyctl deploy --image n8nio/n8n:latest
```

## 📞 Suporte

- Documentação Fly.io: https://fly.io/docs
- Community: https://community.fly.io
- n8n Docs: https://docs.n8n.io

---

## 🎯 Quick Start (Comandos Rápidos)

```bash
# 1. Login
flyctl auth login

# 2. Launch (no diretório do projeto)
flyctl launch --name n8n-financial-info --region gru --no-deploy

# 3. Criar volume
flyctl volumes create n8n_data --size 1 --region gru

# 4. Configurar secrets
flyctl secrets set N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)
flyctl secrets set N8N_BASIC_AUTH_ACTIVE=true
flyctl secrets set N8N_BASIC_AUTH_USER=admin
flyctl secrets set N8N_BASIC_AUTH_PASSWORD=SuaSenhaForte123
flyctl secrets set N8N_HOST=n8n-financial-info.fly.dev
flyctl secrets set WEBHOOK_URL=https://n8n-financial-info.fly.dev/

# 5. Deploy
flyctl deploy

# 6. Abrir
flyctl open
```

**Status**: ✅ Pronto para deploy!

---

**Versão**: 1.0  
**Última atualização**: Novembro 2025

