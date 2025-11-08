# 🛠️ Development Guide - n8n Financial Info

Guia completo para desenvolver e testar código JavaScript dos nodos n8n de forma versionada e testável.

## 📁 Estrutura do Projeto

```
n8n-financial-info/
├── src/
│   └── nodes/
│       └── FilterTasksToBeExecuted/
│           ├── index.js           # ✅ Código principal (versionado)
│           ├── index.test.js      # ✅ Testes unitários
│           └── n8n-wrapper.js     # Wrapper para n8n
├── scripts/
│   └── sync-nodes.js              # ✅ Script de sincronização
├── flows/
│   └── task-flow.json             # Workflow n8n
├── jest.config.js                 # ✅ Configuração Jest
├── package.json                   # ✅ Dependências e scripts
└── README-DEVELOPMENT.md          # Este arquivo
```

## 🚀 Setup Inicial

### 1. Instalar Dependências

```bash
cd n8n-financial-info
npm install
```

### 2. Verificar Instalação

```bash
npm test
```

Você deve ver todos os testes passando! ✅

## 📝 Workflow de Desenvolvimento

### Passo 1: Editar Código

Edite o arquivo fonte:
```bash
src/nodes/FilterTasksToBeExecuted/index.js
```

### Passo 2: Rodar Testes

```bash
# Rodar todos os testes
npm test

# Rodar em modo watch (auto-reload)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

### Passo 3: Verificar Qualidade

Testes devem passar com boa cobertura:
- ✅ Branches: > 70%
- ✅ Functions: > 80%
- ✅ Lines: > 80%

### Passo 4: Sincronizar com n8n

Quando os testes passarem:

```bash
npm run sync-nodes
```

Isso irá:
1. Criar backup do workflow atual
2. Atualizar o código no `task-flow.json`
3. Mostrar estatísticas do código

### Passo 5: Testar no n8n

1. Importe o arquivo `flows/task-flow.json` no n8n
2. Execute o workflow
3. Verifique os logs

## 🧪 Escrevendo Testes

### Estrutura de um Teste

```javascript
describe('NomeDaFuncao', () => {
  it('deve fazer algo esperado', () => {
    // Arrange
    const input = 'valor';
    
    // Act
    const result = minhaFuncao(input);
    
    // Assert
    expect(result).toBe('esperado');
  });
});
```

### Testando com Datas

```javascript
it('deve verificar data de hoje', () => {
  const today = new Date(2025, 10, 8); // Data fixa
  const result = isToday(today, today);
  expect(result).toBe(true);
});
```

### Testando com Mocks

```javascript
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
});
```

## 📊 Cobertura de Testes

### Visualizar Relatório

Após rodar `npm run test:coverage`:

```bash
open coverage/index.html
```

Ou visualize em `coverage/lcov-report/index.html`

### Meta de Cobertura

Mantenha sempre:
- **Functions**: > 80%
- **Lines**: > 80%
- **Branches**: > 70%

## 🔄 Script de Sincronização

### Como Funciona

O script `sync-nodes.js`:

1. ✅ Lê o código fonte de `src/nodes/FilterTasksToBeExecuted/index.js`
2. ✅ Remove comentários JSDoc (mantém inline)
3. ✅ Remove `module.exports`
4. ✅ Adiciona wrapper n8n
5. ✅ Cria backup do workflow
6. ✅ Atualiza `flows/task-flow.json`

### Restaurar Backup

Se algo der errado:

```bash
cp flows/task-flow.json.backup flows/task-flow.json
```

## 🐛 Debugging

### Testes Falhando

```bash
# Rodar um teste específico
npm test -- index.test.js

# Rodar com mais informações
npm test -- --verbose

# Rodar apenas testes que falharam
npm test -- --onlyFailures
```

### Verificar Código n8n

Veja o código que será injetado no n8n:

```bash
npm run sync-nodes
cat flows/task-flow.json | grep -A 50 "FilterTasksToBeExecuted"
```

## 📦 Adicionando Novas Funções

### 1. Adicionar no src/

```javascript
// src/nodes/FilterTasksToBeExecuted/index.js

function novaFuncao(param) {
  // Sua lógica aqui
  return resultado;
}

// Exportar para testes
module.exports = {
  // ... outras funções
  novaFuncao
};
```

### 2. Criar Testes

```javascript
// src/nodes/FilterTasksToBeExecuted/index.test.js

describe('novaFuncao', () => {
  it('deve fazer X', () => {
    const result = novaFuncao('input');
    expect(result).toBe('esperado');
  });
});
```

### 3. Testar e Sincronizar

```bash
npm test
npm run sync-nodes
```

## 🎯 Boas Práticas

### ✅ DO

- ✅ Escreva testes ANTES de implementar (TDD)
- ✅ Mantenha funções pequenas e focadas
- ✅ Use nomes descritivos
- ✅ Documente funções complexas
- ✅ Rode testes antes de sincronizar
- ✅ Commit código e testes juntos

### ❌ DON'T

- ❌ NÃO edite `task-flow.json` diretamente
- ❌ NÃO sincronize sem rodar testes
- ❌ NÃO faça funções muito grandes
- ❌ NÃO esqueça de adicionar testes
- ❌ NÃO use variáveis globais

## 📚 Recursos Úteis

### Jest Documentation
- https://jestjs.io/docs/getting-started

### Matchers Úteis
```javascript
expect(value).toBe(expected)           // ===
expect(value).toEqual(expected)        // deep equal
expect(value).toBeNull()               // === null
expect(value).toBeTruthy()             // !!value
expect(value).toHaveProperty('key')    // tem propriedade
expect(array).toHaveLength(3)          // array.length === 3
expect(string).toContain('text')       // includes
```

## 🔧 Troubleshooting

### "Cannot find module"

```bash
npm install
```

### "Test failed to run"

Verifique o `jest.config.js`:
```javascript
testEnvironment: 'node'  // Certifique-se disso
```

### "Sync failed"

Verifique se os arquivos existem:
```bash
ls src/nodes/FilterTasksToBeExecuted/index.js
ls flows/task-flow.json
```

## 🎉 Exemplo Completo

### 1. Adicionar nova função

```javascript
// src/nodes/FilterTasksToBeExecuted/index.js
function calculateNextExecution(task, today = new Date()) {
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + task.ScheduledPeriod);
  return nextDate;
}
```

### 2. Adicionar teste

```javascript
// src/nodes/FilterTasksToBeExecuted/index.test.js
describe('calculateNextExecution', () => {
  it('deve calcular próxima execução', () => {
    const task = { ScheduledPeriod: 3 };
    const today = new Date(2025, 10, 8);
    const result = calculateNextExecution(task, today);
    expect(result.getDate()).toBe(11);
  });
});
```

### 3. Testar

```bash
npm test
```

### 4. Sincronizar

```bash
npm run sync-nodes
```

### 5. Deploy no n8n

Importe `flows/task-flow.json` no n8n! 🚀

---

## 💡 Dicas Pro

1. **Use `test:watch`** durante desenvolvimento
2. **Commit testes e código juntos**
3. **Revise cobertura regularmente**
4. **Documente casos edge**
5. **Mantenha testes rápidos** (< 1s cada)

---

**Happy coding! 🎯**

