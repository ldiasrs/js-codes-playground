# 🔄 Feature: Histórico de Execuções no Prompt

## Objetivo

Evitar que o AI gere respostas repetitivas fornecendo contexto das últimas execuções diretamente no prompt.

## Como Funciona

Quando o nodo `FilterTasksToBeExecuted` identifica uma task que deve ser executada, ele:

1. Busca as **últimas 3 execuções** dessa task no histórico
2. Extrai o campo `Saida` (resposta do AI) de cada execução
3. **Enriquece o prompt original** adicionando essas respostas como contexto
4. Adiciona instruções explícitas para evitar repetição

## Exemplo Prático

### Prompt Original da Task
```
Me dê 5 ideias de jantas
```

### Prompt Enriquecido (Enviado ao AI)
```
Me dê 5 ideias de jantas

---

📋 HISTÓRICO DAS ÚLTIMAS EXECUÇÕES:
Para evitar repetição, considere as respostas anteriores abaixo:

1. Execução em 07/11/2025 13:00:00:
1. Frango grelhado com legumes assados
2. Macarrão à carbonara
3. Salmão com purê de batatas
4. Strogonoff de carne
5. Pizza caseira

2. Execução em 06/11/2025 13:00:00:
1. Risoto de cogumelos
2. Tacos mexicanos
3. Lasanha de berinjela
4. Peixe assado com arroz
5. Hambúrguer artesanal

3. Execução em 05/11/2025 13:00:00:
1. Feijoada completa
2. Sushi variado
3. Churrasco misto
4. Pad Thai
5. Bacalhau ao forno

⚠️ IMPORTANTE: Gere uma resposta diferente e criativa, evitando repetir as ideias acima.
```

### Resultado Esperado
O AI agora tem contexto de 15 ideias já sugeridas e pode:
- Evitar repetir essas sugestões
- Gerar ideias mais variadas
- Explorar diferentes culinárias e estilos
- Manter a diversidade ao longo do tempo

## Implementação Técnica

### Função: `getLastNExecutions()`
```javascript
function getLastNExecutions(taskId, executions, n = 3) {
  const taskExecutions = executions
    .filter(exec => exec.Id === taskId)
    .map(exec => ({
      date: parseExecutionDate(exec.ExecutionTime),
      dateStr: exec.ExecutionTime,
      output: exec.Saida
    }))
    .sort((a, b) => b.date - a.date)
    .slice(0, n);
  
  return taskExecutions;
}
```

**O que faz:**
- Filtra execuções pelo ID da task
- Mapeia para um objeto com data parseada, string de data e saída
- Ordena do mais recente para o mais antigo
- Retorna as N primeiras (padrão: 3)

### Função: `buildPromptWithHistory()`
```javascript
function buildPromptWithHistory(task, lastExecutions) {
  let prompt = task.Prompt;
  
  if (lastExecutions.length > 0) {
    prompt += '\n\n---\n\n';
    prompt += '📋 HISTÓRICO DAS ÚLTIMAS EXECUÇÕES:\n';
    prompt += 'Para evitar repetição, considere as respostas anteriores abaixo:\n\n';
    
    lastExecutions.forEach((exec, index) => {
      prompt += `${index + 1}. Execução em ${exec.dateStr}:\n`;
      prompt += `${exec.output}\n\n`;
    });
    
    prompt += '⚠️ IMPORTANTE: Gere uma resposta diferente e criativa, evitando repetir as ideias acima.';
  }
  
  return prompt;
}
```

**O que faz:**
- Começa com o prompt original da task
- Se houver execuções anteriores:
  - Adiciona separador visual
  - Adiciona cabeçalho do histórico
  - Itera sobre cada execução, mostrando data e resposta
  - Adiciona instrução de não repetição
- Retorna o prompt enriquecido

## Integração no Workflow

### Antes (Sem Histórico)
```
GetExecutions → FilterTasksToBeExecuted → AI-Process
                      ↓
                 Retorna: { Prompt: "Me dê 5 ideias de jantas" }
```

### Agora (Com Histórico)
```
GetExecutions → FilterTasksToBeExecuted → AI-Process
                      ↓
                 Retorna: { 
                   Prompt: "Me dê 5 ideias de jantas\n\n---\n\n📋 HISTÓRICO...",
                   HistoryCount: 3
                 }
```

## Configuração

### Alterar Número de Execuções no Histórico

No código do `FilterTasksToBeExecuted`, localize:

```javascript
const lastExecutions = getLastNExecutions(task.Id, executions, 3);
```

Altere o número `3` para o desejado:
- `5` - Últimas 5 execuções
- `10` - Últimas 10 execuções
- `1` - Apenas última execução

**⚠️ Atenção:** Mais execuções = prompt maior = mais tokens consumidos

## Benefícios

### 1. Variedade de Respostas
O AI não repete as mesmas ideias/sugestões

### 2. Contexto Temporal
O AI sabe o que foi sugerido recentemente

### 3. Sem Configuração Adicional
Funciona automaticamente para todas as tasks

### 4. Controle de Custos
Histórico limitado a 3 execuções evita prompts muito grandes

### 5. Transparência
Logs mostram quantas execuções foram incluídas no histórico

## Logs de Exemplo

Ao executar o workflow, você verá nos logs:

```
📅 Verificando tasks para: 08/11/2025
📊 Total de tasks: 3
📊 Total de execuções: 15

✅ Task "Jantas da Semana" deve ser executada

🎯 Total de tasks para executar: 1

📝 Task "Jantas da Semana" - Histórico: 3 execuções anteriores
```

## Casos de Uso Ideais

### ✅ Recomendado Para:
- Ideias criativas (receitas, livros, filmes)
- Dicas e sugestões variadas
- Conteúdo que deve ser diferente a cada execução
- Tasks com execução frequente (DAILY)

### ⚠️ Menos Útil Para:
- Relatórios factuais (dados não mudam)
- Análises numéricas
- Tasks que devem ter saída consistente
- Tasks executadas raramente (MOUNTHLY)

## Futuras Melhorias

Possíveis melhorias para esta feature:

1. **Histórico Configurável por Task**: Permitir definir o número de execuções no histórico por task
2. **Filtro de Relevância**: Incluir apenas execuções acima de certa data
3. **Resumo Inteligente**: Resumir o histórico para economizar tokens
4. **Feedback Loop**: Avaliar se as respostas estão realmente diferentes
5. **Exclusão de Padrões**: Detectar e excluir automaticamente ideias repetidas

## Conclusão

Esta feature transforma o workflow de um simples executor de prompts em um sistema inteligente que aprende e evolui a cada execução, garantindo respostas sempre frescas e variadas! 🎯

