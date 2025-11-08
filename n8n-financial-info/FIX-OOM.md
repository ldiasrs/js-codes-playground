# 🔧 Fix: Out of Memory (OOM) no Fly.io

## 🚨 Problema

O n8n está sendo morto por falta de memória (OOM - Out of Memory):
```
Out of memory: Killed process
total-vm:32301240kB, anon-rss:136180kB
```

**Causa**: 256MB RAM não é suficiente para n8n inicializar.

---

## ✅ Solução: Atualizar para 512MB

### Opção 1: Aceitar Custo Mínimo (~$2/mês)

```bash
# Atualizar fly.toml para 512MB
flyctl scale memory 512 -a n8n-financial-info

# Redeploy
flyctl deploy -a n8n-financial-info
```

**Custo**: ~$1.94/mês (fora do free tier)

### Opção 2: Migrar para DigitalOcean ($200 créditos)

Se não quer pagar mensalidade, use DigitalOcean:
- $200 em créditos grátis
- 33-50 meses grátis
- Melhor para n8n

```bash
# Ver guia DigitalOcean
cat DEPLOY-FREE.md  # Guia alternativas
```

---

## 🎯 Aplicar Fix Agora (512MB)

### 1. Atualizar configuração

O arquivo `fly.toml` já foi atualizado para 512MB.

### 2. Atualizar secrets para otimização

```bash
# Otimizações de memória
flyctl secrets set \
  NODE_OPTIONS="--max-old-space-size=200" \
  N8N_CONCURRENCY_PRODUCTION_LIMIT=1 \
  N8N_DIAGNOSTICS_ENABLED=false \
  N8N_VERSION_NOTIFICATIONS_ENABLED=false \
  N8N_TEMPLATES_ENABLED=false \
  N8N_LOG_LEVEL=warn \
  -a n8n-financial-info
```

### 3. Redeploy

```bash
flyctl deploy -a n8n-financial-info
```

### 4. Verificar

```bash
# Ver logs
flyctl logs -a n8n-financial-info

# Status
flyctl status -a n8n-financial-info
```

---

## 📊 Comparação de Memória

| Memória | Status | Custo | Recomendação |
|---------|--------|-------|--------------|
| 256MB | ❌ OOM | $0/mês | Não funciona |
| 512MB | ✅ Funciona | ~$2/mês | Mínimo necessário |
| 1GB | ✅ Ideal | ~$6/mês | Recomendado |

---

## 💡 Alternativas Gratuitas

### 1. DigitalOcean ($200 créditos)
- ✅ 1GB RAM
- ✅ $6/mês = 33 meses grátis
- ✅ Melhor performance

```bash
# Obter créditos
https://try.digitalocean.com/freetrialoffer/

# Ver guia
cat DEPLOY-FREE.md
```

### 2. Railway ($5 crédito mensal)
- ✅ $5/mês em créditos
- ✅ Suficiente para n8n leve
- ✅ Sempre ativo

### 3. Render (com limitações)
- ✅ Grátis
- ⚠️ Dorme após 15 min inatividade
- ⚠️ Não ideal para workflows agendados

---

## 🔍 Por que 256MB não funciona?

O n8n precisa de memória para:
1. **Node.js runtime**: ~40-60MB
2. **n8n core**: ~80-100MB
3. **Sistema operacional**: ~30-40MB
4. **Buffer/overhead**: ~20-30MB

**Total mínimo**: ~200MB

**256MB**: Insuficiente com overhead do sistema.

---

## ⚡ Quick Fix (Aceitar Custo)

```bash
# 1. Escalar para 512MB
flyctl scale memory 512 -a n8n-financial-info

# 2. Configurar otimizações
flyctl secrets set NODE_OPTIONS="--max-old-space-size=200" -a n8n-financial-info
flyctl secrets set N8N_CONCURRENCY_PRODUCTION_LIMIT=1 -a n8n-financial-info

# 3. Deploy
flyctl deploy -a n8n-financial-info

# 4. Verificar
flyctl logs -a n8n-financial-info
```

**Tempo**: 5 minutos  
**Custo**: ~$2/mês

---

## 🎯 Recomendação Final

### Para este projeto:

1. **Se quer 100% grátis permanente**:
   → Migre para **DigitalOcean** com $200 créditos
   → 33 meses grátis com 1GB RAM

2. **Se aceita $2/mês**:
   → Mantenha **Fly.io** com 512MB
   → Execute os comandos acima

3. **Melhor custo-benefício**:
   → **DigitalOcean** Droplet 1GB ($6/mês)
   → $200 créditos = 33 meses grátis
   → Melhor performance

---

## 📝 Checklist

Para aplicar o fix no Fly.io:

- [ ] Decidir se aceita ~$2/mês
- [ ] Executar `flyctl scale memory 512`
- [ ] Configurar otimizações (secrets)
- [ ] Fazer deploy: `flyctl deploy`
- [ ] Verificar logs: `flyctl logs`
- [ ] Testar acesso: `flyctl open`

Para migrar para DigitalOcean:

- [ ] Obter $200 créditos
- [ ] Seguir DEPLOY-FREE.md
- [ ] Deploy no DigitalOcean
- [ ] Deletar app do Fly.io

---

## 🆘 Ainda com Problemas?

```bash
# Ver uso de memória
flyctl ssh console -a n8n-financial-info
free -h
ps aux --sort=-%mem | head -10

# Ver configuração atual
flyctl config show -a n8n-financial-info

# Reset completo
flyctl apps destroy n8n-financial-info
# Recomeçar com 512MB
```

---

**Status**: O fly.toml foi atualizado para 512MB  
**Próximo passo**: Execute os comandos acima para aplicar o fix

