# 🚀 Quick Start - Versionamento e Testes n8n

Guia rápido para começar a versionar e testar código JavaScript dos seus nodos n8n.

## ✅ Instalação

```bash
cd n8n-financial-info
npm install
```

## 🧪 Testar

```bash
# Rodar todos os testes
npm test

# Rodar em modo watch (auto-reload)
npm run test:watch

# Ver cobertura
npm run test:coverage
```

## ✏️ Editar Código

Edite o arquivo:
```
src/nodes/FilterTasksToBeExecuted/index.js
```

## 🔄 Sincronizar com n8n

Após testar e validar:

```bash
npm run sync-nodes
```

## 📥 Importar no n8n

1. Abra n8n
2. Vá em Workflows
3. Import from file
4. Selecione `flows/task-flow.json`
5. Execute e teste!

## 📊 Resultados dos Testes

```
✅ 36 testes passando
✅ 89.87% de cobertura de linhas
✅ 88.57% de cobertura de branches
✅ 100% das funções principais testadas
```

## 🎯 Workflow Completo

1. **Editar** → `src/nodes/FilterTasksToBeExecuted/index.js`
2. **Testar** → `npm test`
3. **Validar** → Verificar se passou
4. **Sincronizar** → `npm run sync-nodes`
5. **Importar** → Abrir `flows/task-flow.json` no n8n
6. **Executar** → Testar no n8n
7. **Commit** → Git add, commit, push

## 📝 Exemplo Prático

### Antes (Editando direto no n8n) ❌
- ❌ Sem controle de versão
- ❌ Sem testes
- ❌ Difícil refatorar
- ❌ Bugs só aparecem em produção

### Agora (Com versionamento) ✅
- ✅ Git track de todas as mudanças
- ✅ Testes automatizados
- ✅ Refatoração segura
- ✅ Bugs descobertos antes

## 🛠️ Comandos Úteis

```bash
# Testar apenas um arquivo
npm test -- index.test.js

# Testar em modo verbose
npm test -- --verbose

# Ver cobertura em HTML
npm run test:coverage
open coverage/index.html

# Verificar se código sincroniza
npm run sync-nodes

# Restaurar backup se necessário
cp flows/task-flow.json.backup flows/task-flow.json
```

## 📚 Documentação Completa

Para mais detalhes, veja:
- **README-DEVELOPMENT.md** - Guia completo de desenvolvimento
- **src/nodes/FilterTasksToBeExecuted/index.js** - Código fonte
- **src/nodes/FilterTasksToBeExecuted/index.test.js** - Testes

## 🎉 Pronto!

Seu código JavaScript agora está:
- ✅ Versionado no Git
- ✅ Testado com Jest
- ✅ Documentado
- ✅ Sincronizável com n8n
- ✅ Profissional

**Happy coding! 🚀**

