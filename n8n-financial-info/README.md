# 🚀 n8n Financial Info - Deploy no Fly.io

Workflow automatizado do n8n para gerar relatórios de ações brasileiras (B3) e americanas (NYSE/NASDAQ).

## ⚡ Deploy Rápido (1 comando)

```bash
./deploy.sh
```

Esse script único faz **TUDO**:
- ✅ Cria aplicação no Fly.io
- ✅ Configura memória (resolve OOM)
- ✅ Cria volume para dados
- ✅ Configura secrets e otimizações
- ✅ Faz deploy
- ✅ Verifica saúde da app

---

## 📋 Pré-requisitos

1. **Conta Fly.io** (gratuita): https://fly.io/app/sign-up
2. **Fly CLI instalado**:
   ```bash
   # macOS
   brew install flyctl
   
   # Linux/WSL
   curl -L https://fly.io/install.sh | sh
   ```

---

## 🎯 Como Usar

### 1. Clone/baixe o projeto
```bash
cd n8n-financial-info
```

### 2. Execute o script
```bash
./deploy.sh
```

### 3. Siga as instruções
O script vai perguntar:
- Memória desejada (512MB ou 1GB)
- Username e senha do admin
- Se quer abrir no navegador após deploy

### 4. Pronto!
Acesse: `https://n8n-financial-info.fly.dev`

---

## 💰 Custos

| Memória | Funciona? | Custo/mês | Recomendação |
|---------|-----------|-----------|--------------|
| 256MB | ❌ OOM | $0 | Não use |
| 512MB | ✅ Sim | ~$2 | Mínimo OK |
| 1GB | ✅ Ideal | ~$6 | Recomendado |

**⚠️ IMPORTANTE**: 256MB causa **Out of Memory (OOM)**. Use mínimo 512MB.

---

## 📝 O Que Está Incluído

### Arquivos Principais
- 🚀 **deploy.sh** - Script único de deploy (USE ESTE!)
- 📄 **fly.toml** - Configuração do Fly.io
- 🐳 **Dockerfile** - Build customizado (opcional)
- 📊 **financial-info-flow.json** - Workflow do n8n

### Documentação
- 📖 **DEPLOY-FREE.md** - Guia completo
- 🔧 **FIX-OOM.md** - Documentação sobre OOM
- 📋 **README.md** - Este arquivo

---

## 🔧 Comandos Úteis

```bash
# Ver logs em tempo real
flyctl logs -a n8n-financial-info

# Ver status
flyctl status -a n8n-financial-info

# Abrir no navegador
flyctl open -a n8n-financial-info

# SSH na máquina
flyctl ssh console -a n8n-financial-info

# Reiniciar
flyctl apps restart -a n8n-financial-info

# Escalar memória
flyctl scale memory 1024 -a n8n-financial-info

# Deletar app
flyctl apps destroy n8n-financial-info
```

---

## 🐛 Troubleshooting

### App não inicia (OOM)
```bash
# Verificar logs
flyctl logs -a n8n-financial-info

# Se ver "Out of memory", aumentar memória:
flyctl scale memory 512 -a n8n-financial-info
flyctl deploy -a n8n-financial-info
```

### Esqueci a senha
```bash
# Ver credenciais salvas
cat .credentials.txt

# Ou reconfigurar
flyctl secrets set N8N_BASIC_AUTH_PASSWORD=NovaSenha -a n8n-financial-info
```

### App lenta
```bash
# Aumentar memória para 1GB
flyctl scale memory 1024 -a n8n-financial-info
```

---

## 🎯 Próximos Passos

Após o deploy:

1. ✅ Acesse o n8n no navegador
2. ✅ Faça login com suas credenciais
3. ✅ Importe o workflow: `financial-info-flow.json`
4. ✅ Configure credenciais:
   - Google Gemini API
   - Google Sheets OAuth2
   - Gmail OAuth2
5. ✅ Crie planilha Google Sheets com ações
6. ✅ Teste o workflow
7. ✅ Ative o agendamento

---

## 🌐 Alternativa Gratuita

Se não quer pagar mensalidade, use **DigitalOcean**:
- 💵 **$200 em créditos grátis**
- ⏰ Válidos por 60 dias
- 🎁 33-50 meses grátis dependendo do plano

**Como obter**: https://try.digitalocean.com/freetrialoffer/

**Guia**: Leia `DEPLOY-FREE.md` para mais informações.

---

## 📊 Estrutura do Projeto

```
n8n-financial-info/
├── deploy.sh                    # 🚀 SCRIPT ÚNICO (use este!)
├── fly.toml                     # Configuração Fly.io
├── Dockerfile                   # Build customizado
├── financial-info-flow.json     # Workflow n8n
├── README.md                    # Este arquivo
├── DEPLOY-FREE.md               # Guia completo
├── FIX-OOM.md                   # Fix para OOM
└── env.example                  # Template de variáveis
```

---

## 🤝 Suporte

- **Fly.io Docs**: https://fly.io/docs
- **n8n Docs**: https://docs.n8n.io
- **Issues**: Abra um issue no repositório

---

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

---

## 🎉 Conclusão

Deploy simplificado em **1 comando**:

```bash
./deploy.sh
```

**Tempo de setup**: ~10 minutos  
**Dificuldade**: Fácil ⭐⭐  
**Custo**: $2-6/mês (ou grátis no DigitalOcean)

---

**Boa sorte com seu deploy!** 🚀

Se tiver problemas, consulte `FIX-OOM.md` ou `DEPLOY-FREE.md`.

