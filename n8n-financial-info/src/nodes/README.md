# n8n Nodes - Estrutura e Desenvolvimento

## 📁 Estrutura de Arquivos

Cada node segue uma estrutura padronizada:

```
src/nodes/
├── FilterTasksToBeExecuted/
│   ├── index.js           # Lógica principal (testável)
│   ├── n8n-wrapper.js     # Wrapper para n8n
│   ├── index.test.js      # Testes unitários
│   └── dev.test.js        # Testes de desenvolvimento
└── SplitByEmails/
    ├── index.js           # Lógica principal (testável)
    ├── n8n-wrapper.js     # Wrapper para n8n
    └── index.test.js      # Testes unitários
```

## 🎯 Propósito de Cada Arquivo

### `index.js` - Lógica Principal
- Contém todas as funções de negócio
- Código puro JavaScript (sem dependências do n8n)
- 100% testável com Jest
- Exporta todas as funções para testes

**Exemplo:**
```javascript
function splitByEmails(tasks) {
  // Lógica pura
  return processedTasks;
}

module.exports = { splitByEmails };
```

### `n8n-wrapper.js` - Integração n8n
- Adapta a lógica para o formato do n8n
- Acessa nodes com `$()`
- Retorna dados no formato n8n
- Usa `require()` para importar do `index.js`

**Exemplo:**
```javascript
const { splitByEmails } = require('./index');

function executeN8nNode() {
  const items = $input.all();
  const tasks = items.map(item => item.json);
  const result = splitByEmails(tasks);
  
  return result.map((item, index) => ({
    json: item,
    pairedItem: { item: index }
  }));
}
```

### `index.test.js` - Testes Unitários
- Testa todas as funções isoladamente
- Usa Jest
- Garante qualidade do código

### `dev.test.js` - Testes de Desenvolvimento
- Testes rápidos para casos específicos
- Dados podem ser editados manualmente
- Útil para debugging

## 🔄 Sincronização com n8n

### Script de Sincronização

O script `scripts/sync-nodes.js` sincroniza automaticamente os nodes:

```bash
npm run sync-nodes
```

### O que o script faz:

1. **Lê** `index.js` e `n8n-wrapper.js`
2. **Remove** comentários JSDoc, requires e exports
3. **Combina** lógica + wrapper
4. **Atualiza** o arquivo `flows/task-flow.json`
5. **Cria** backup automático

### Configuração

Adicione novos nodes em `scripts/sync-nodes.js`:

```javascript
const NODES_CONFIG = [
  {
    name: 'FilterTasksToBeExecuted',
    indexPath: path.join(__dirname, '../src/nodes/FilterTasksToBeExecuted/index.js'),
    wrapperPath: path.join(__dirname, '../src/nodes/FilterTasksToBeExecuted/n8n-wrapper.js')
  },
  {
    name: 'SplitByEmails',
    indexPath: path.join(__dirname, '../src/nodes/SplitByEmails/index.js'),
    wrapperPath: path.join(__dirname, '../src/nodes/SplitByEmails/n8n-wrapper.js')
  }
  // Adicione novos nodes aqui
];
```

## 📝 Criando um Novo Node

### 1. Crie a Estrutura

```bash
mkdir -p src/nodes/MeuNovoNode
```

### 2. Crie `index.js`

```javascript
/**
 * MeuNovoNode - Core Logic
 * Descrição do que o node faz
 */

function minhaFuncao(dados) {
  // Lógica pura aqui
  return resultado;
}

module.exports = {
  minhaFuncao
};
```

### 3. Crie `n8n-wrapper.js`

```javascript
/**
 * Wrapper para n8n
 */

const { minhaFuncao } = require('./index');

function executeN8nNode() {
  const items = $input.all();
  const dados = items.map(item => item.json);
  const resultado = minhaFuncao(dados);
  
  return resultado.map((item, index) => ({
    json: item,
    pairedItem: { item: index }
  }));
}

module.exports = {
  executeN8nNode
};
```

### 4. Crie `index.test.js`

```javascript
const { minhaFuncao } = require('./index');

describe('MeuNovoNode', () => {
  it('deve fazer algo', () => {
    const resultado = minhaFuncao([]);
    expect(resultado).toBeDefined();
  });
});
```

### 5. Adicione ao Script de Sincronização

Edite `scripts/sync-nodes.js` e adicione:

```javascript
{
  name: 'MeuNovoNode',
  indexPath: path.join(__dirname, '../src/nodes/MeuNovoNode/index.js'),
  wrapperPath: path.join(__dirname, '../src/nodes/MeuNovoNode/n8n-wrapper.js')
}
```

### 6. Execute os Testes

```bash
npm test
```

### 7. Sincronize com n8n

```bash
npm run sync-nodes
```

## ✅ Benefícios desta Abordagem

### 🧪 Testabilidade
- Código puro JavaScript separado do n8n
- Testes unitários rápidos
- Desenvolvimento TDD facilitado

### 🔧 Manutenibilidade
- Código organizado e modular
- Fácil de entender e modificar
- Princípios SOLID aplicados

### 🚀 Produtividade
- Sincronização automática
- Não precisa copiar/colar código
- Backup automático antes de atualizar

### 📊 Qualidade
- Clean Code
- Alta coesão, baixo acoplamento
- Funções pequenas e focadas

## 🎓 Princípios Seguidos

### Single Responsibility Principle (SRP)
Cada função tem uma única responsabilidade clara.

### Don't Repeat Yourself (DRY)
Lógica compartilhada em funções reutilizáveis.

### Separation of Concerns
Lógica de negócio separada da integração com n8n.

### Testability First
Código escrito para ser facilmente testável.

## 🛠️ Comandos Úteis

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm test -- --watch

# Executar testes de um arquivo específico
npm test -- FilterTasksToBeExecuted

# Sincronizar nodes com n8n
npm run sync-nodes
```

## 📚 Nodes Disponíveis

### FilterTasksToBeExecuted
Filtra tasks que devem ser executadas com base em agendamento, histórico e emails.

**Funções principais:**
- `filterTasksToExecute()` - Função principal
- `shouldExecuteTask()` - Verifica se deve executar
- `enrichTask()` - Adiciona histórico e emails
- `getTaskEmails()` - Obtém emails únicos

### SplitByEmails
Divide tasks em múltiplos itens, um para cada email destinatário.

**Funções principais:**
- `splitByEmails()` - Função principal
- `splitTaskByEmails()` - Divide uma task
- `createTaskForEmail()` - Cria item para email
- `hasEmails()` - Verifica se tem emails

## 🔍 Debugging

### Console Logs
Todos os nodes incluem logs informativos:

```javascript
console.log('✅ Processado com sucesso');
console.log('⚠️ Aviso importante');
console.log('❌ Erro encontrado');
```

### Testes de Desenvolvimento
Use `dev.test.js` para testar casos específicos:

```javascript
it('deve testar cenário específico', () => {
  const tasks = [
    // Dados reais aqui
  ];
  const result = minhaFuncao(tasks);
  console.log(result); // Ver resultado
});
```

## 📞 Suporte

Para adicionar novos nodes ou modificar existentes, siga o padrão estabelecido e mantenha os testes atualizados.

