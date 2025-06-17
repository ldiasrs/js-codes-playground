# LearnEveryday CLI - Exemplos de Uso

Este documento contém exemplos de como usar cada comando da CLI do LearnEveryday.

## Pré-requisitos

Certifique-se de que o projeto está configurado com as variáveis de ambiente necessárias:
- `OPENAI_API_KEY` - Para geração de conteúdo
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - Para envio de emails

## Comandos Disponíveis

### 1. Iniciar o Sistema (start)

Inicia o projeto junto com os scheduled tasks:

```bash
npm run cli start
```

**Exemplo:**
```bash
npm run cli start
```

**Saída esperada:**
```
🚀 Iniciando LearnEveryday com scheduled tasks...
✅ Scheduling service inicializado
⏰ Scheduled tasks ativos
🔄 Sistema rodando... (Pressione Ctrl+C para parar)
```

### 2. Criar Novo Cliente (newCustomer)

Cria um novo cliente no sistema:

```bash
npm run cli newCustomer -n "Nome do Cliente" -c "123.456.789-00" -e "email@cliente.com" -p "(11) 99999-9999"
```

**Exemplo:**
```bash
npm run cli newCustomer -n "João Silva" -c "123.456.789-00" -e "joao.silva@email.com" -p "(11) 99999-9999"
```

**Saída esperada:**
```
👤 Criando novo cliente...
✅ Cliente criado com sucesso!
   ID: 550e8400-e29b-41d4-a716-446655440000
   Nome: João Silva
   Email: joao.silva@email.com
```

### 3. Criar Novo Tópico (newTopic)

Cria um novo tópico para um cliente existente:

```bash
npm run cli newTopic -c "ID_DO_CLIENTE" -s "Assunto do Tópico"
```

**Exemplo:**
```bash
npm run cli newTopic -c "550e8400-e29b-41d4-a716-446655440000" -s "Introdução ao TypeScript"
```

**Saída esperada:**
```
📚 Criando novo tópico...
✅ Tópico criado com sucesso!
   ID: 660e8400-e29b-41d4-a716-446655440001
   Assunto: Introdução ao TypeScript
   Cliente: João Silva
```

### 4. Gerar e Enviar Topic History (generateAndSendTopicHistory)

Gera um novo topic history e envia por email:

```bash
npm run cli generateAndSendTopicHistory -t "ID_DO_TOPICO" -e "email@destino.com"
```

**Exemplo:**
```bash
npm run cli generateAndSendTopicHistory -t "660e8400-e29b-41d4-a716-446655440001" -e "joao.silva@email.com"
```

**Saída esperada:**
```
📖 Gerando e enviando topic history...
✅ Topic history gerado e enviado com sucesso!
   ID: 770e8400-e29b-41d4-a716-446655440002
   Tópico: Introdução ao TypeScript
   Email enviado para: joao.silva@email.com
   Conteúdo: TypeScript é um superset do JavaScript que adiciona tipagem estática...
```

### 5. Listar Clientes (listCustomers)

Lista todos os clientes cadastrados:

```bash
npm run cli listCustomers
```

**Saída esperada:**
```
👥 Listando todos os clientes...
📋 Encontrados 2 clientes:
🆔 ID: 550e8400-e29b-41d4-a716-446655440000
   Nome: João Silva
   Email: joao.silva@email.com
   CPF: 123.456.789-00
   Telefone: (11) 99999-9999
   Data de criação: 15/01/2024, 10:30:00
---
🆔 ID: 550e8400-e29b-41d4-a716-446655440001
   Nome: Maria Santos
   Email: maria.santos@email.com
   CPF: 987.654.321-00
   Telefone: (11) 88888-8888
   Data de criação: 15/01/2024, 11:45:00
---
```

### 6. Listar Tópicos (listTopics)

Lista todos os tópicos cadastrados:

```bash
npm run cli listTopics
```

**Saída esperada:**
```
📚 Listando todos os tópicos...
📋 Encontrados 3 tópicos:
🆔 ID: 660e8400-e29b-41d4-a716-446655440001
   Assunto: Introdução ao TypeScript
   Cliente: João Silva (550e8400-e29b-41d4-a716-446655440000)
   Data de criação: 15/01/2024, 10:35:00
---
🆔 ID: 660e8400-e29b-41d4-a716-446655440002
   Assunto: React Hooks
   Cliente: João Silva (550e8400-e29b-41d4-a716-446655440000)
   Data de criação: 15/01/2024, 14:20:00
---
🆔 ID: 660e8400-e29b-41d4-a716-446655440003
   Assunto: Node.js Express
   Cliente: Maria Santos (550e8400-e29b-41d4-a716-446655440001)
   Data de criação: 15/01/2024, 16:10:00
---
```

## Comandos de Scheduled Tasks

### Tipos de Task Disponíveis

O sistema suporta dois tipos de scheduled tasks:

1. **GenerateTopicHistoriesForOldTopics**
   - **Propósito**: Gera automaticamente novos topic histories para tópicos que não foram atualizados recentemente
   - **Parâmetros específicos**: `limit` (limite por cliente), `hours` (horas desde última atualização)
   - **Uso típico**: Manter conteúdo atualizado automaticamente

2. **SendLastTopicHistory**
   - **Propósito**: Envia por email o último topic history de cada cliente
   - **Parâmetros específicos**: Nenhum (usa apenas descrição)
   - **Uso típico**: Enviar resumos de aprendizado por email

### 7. Listar Scheduled Tasks (listTasks)

Lista todas as scheduled tasks cadastradas:

```bash
npm run cli listTasks
```

**Saída esperada:**
```
📋 Listando scheduled tasks...
📋 Encontradas 2 scheduled tasks:
🆔 ID: 880e8400-e29b-41d4-a716-446655440001
📝 Tipo: GenerateTopicHistoriesForOldTopics
⏰ Cron: 0 * * * *
📊 Status: completed
✅ Ativo: Sim
🕐 Última execução: 15/01/2024, 15:00:00
⏭️ Próxima execução: 15/01/2024, 16:00:00
📄 Dados: {"limit":10,"hoursSinceLastUpdate":24,"description":"Generate topic histories for topics with old histories"}
---
🆔 ID: 880e8400-e29b-41d4-a716-446655440002
📝 Tipo: SendLastTopicHistory
⏰ Cron: 0 9 * * *
📊 Status: pending
✅ Ativo: Sim
⏭️ Próxima execução: 16/01/2024, 09:00:00
📄 Dados: {"description":"Send last topic history to all customers"}
---
```

### 8. Registrar Task (registerTask)

Registra uma nova scheduled task (genérico para todos os tipos de task):

```bash
npm run cli registerTask [opções]
```

**Opções obrigatórias:**
- `-t, --type <type>` - Tipo da task (GenerateTopicHistoriesForOldTopics | SendLastTopicHistory)
- `-c, --cron <cron>` - Expressão cron (ex: "0 * * * *" para a cada hora)

**Opções opcionais:**
- `-l, --limit <limit>` - Limite de tópicos por cliente (apenas para GenerateTopicHistoriesForOldTopics, padrão: 10)
- `-h, --hours <hours>` - Horas desde a última atualização (apenas para GenerateTopicHistoriesForOldTopics, padrão: 24)
- `-d, --description <description>` - Descrição da task

**Exemplos:**

**Task de geração que roda a cada hora:**
```bash
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 * * * *"
```

**Task de geração que roda a cada 30 minutos:**
```bash
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "*/30 * * * *"
```

**Task de geração que roda diariamente às 8h da manhã:**
```bash
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 8 * * *"
```

**Task de geração com configurações personalizadas:**
```bash
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 */2 * * *" -l 5 -h 12 -d "Gera topic histories a cada 2 horas"
```

**Task de envio que roda diariamente às 9h (padrão):**
```bash
npm run cli registerTask -t SendLastTopicHistory -c "0 9 * * *"
```

**Task de envio que roda às 18h todos os dias:**
```bash
npm run cli registerTask -t SendLastTopicHistory -c "0 18 * * *"
```

**Task de envio que roda às 9h apenas em dias úteis:**
```bash
npm run cli registerTask -t SendLastTopicHistory -c "0 9 * * 1-5"
```

**Task de envio com descrição personalizada:**
```bash
npm run cli registerTask -t SendLastTopicHistory -c "0 9 * * *" -d "Envia resumo diário de aprendizado"
```

**Saída esperada (task de geração):**
```
📝 Registrando task...
✅ Task registrada com sucesso!
   ID: 880e8400-e29b-41d4-a716-446655440003
   Tipo: GenerateTopicHistoriesForOldTopics
   Cron: 0 */2 * * *
   Limite: 5 tópicos por cliente
   Horas: 12 horas desde última atualização
   Descrição: Gera topic histories a cada 2 horas
```

**Saída esperada (task de envio):**
```
📝 Registrando task...
✅ Task registrada com sucesso!
   ID: 880e8400-e29b-41d4-a716-446655440004
   Tipo: SendLastTopicHistory
   Cron: 0 9 * * *
   Descrição: Envia resumo diário de aprendizado
```

### 9. Remover Task (removeTask)

Remove uma scheduled task pelo ID:

```bash
npm run cli removeTask -i "ID_DA_TASK"
```

**Exemplo:**
```bash
npm run cli removeTask -i "880e8400-e29b-41d4-a716-446655440003"
```

**Saída esperada:**
```
🗑️ Removendo task 880e8400-e29b-41d4-a716-446655440003...
✅ Task removida com sucesso!
```

### 10. Executar Task Manualmente (executeTask)

Executa uma task manualmente pelo ID:

```bash
npm run cli executeTask -i "ID_DA_TASK"
```

**Exemplo:**
```bash
npm run cli executeTask -i "880e8400-e29b-41d4-a716-446655440001"
```

**Saída esperada:**
```
▶️ Executando task 880e8400-e29b-41d4-a716-446655440001...
🎯 Executing task: 880e8400-e29b-41d4-a716-446655440001 (GenerateTopicHistoriesForOldTopics)
🚀 Executing GenerateTopicHistoriesForOldTopicsTask for task ID: 880e8400-e29b-41d4-a716-446655440001
📊 Configuration: limit=10, hoursSinceLastUpdate=24
📈 Task Results:
   - Processed topics: 3
   - Successful generations: 3
   - Failed generations: 0
✅ GenerateTopicHistoriesForOldTopicsTask completed for task ID: 880e8400-e29b-41d4-a716-446655440001
✅ Task 880e8400-e29b-41d4-a716-446655440001 completed successfully
✅ Task executada com sucesso!
```

## Expressões Cron Comuns

### Padrões de Agendamento

| Expressão | Descrição |
|-----------|-----------|
| `0 * * * *` | A cada hora (minuto 0) |
| `*/30 * * * *` | A cada 30 minutos |
| `0 */2 * * *` | A cada 2 horas |
| `0 9 * * *` | Diariamente às 9h |
| `0 9,18 * * *` | Diariamente às 9h e 18h |
| `0 9 * * 1-5` | Dias úteis às 9h |
| `0 0 1 * *` | Primeiro dia do mês à meia-noite |
| `0 0 * * 0` | Todo domingo à meia-noite |

### Estrutura da Expressão Cron

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Dia da semana (0-7, domingo = 0 ou 7)
│ │ │ └──── Mês (1-12)
│ │ └────── Dia do mês (1-31)
│ └──────── Hora (0-23)
└────────── Minuto (0-59)
```

## Exemplos de Configuração Completa

### Cenário 1: Sistema de Aprendizado Diário

```bash
# 1. Criar cliente
npm run cli newCustomer -n "João Silva" -c "123.456.789-00" -e "joao@email.com" -p "(11) 99999-9999"

# 2. Criar tópicos
npm run cli newTopic -c "ID_DO_CLIENTE" -s "TypeScript Avançado"
npm run cli newTopic -c "ID_DO_CLIENTE" -s "React Hooks"
npm run cli -- newTopic -c "19c49cd9-61f4-42c1-ae49-258bf301f8d7" -s "Receitas fitness para janta"

# 3. Configurar task de geração automática (a cada 2 horas)
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 */2 * * *" -l 5 -h 6

# 4. Configurar task de envio diário (às 18h)
npm run cli registerTask -t SendLastTopicHistory -c "0 18 * * *" -d "Resumo diário de aprendizado"

# 5. Iniciar o sistema
npm run cli start
```

### Cenário 2: Sistema de Revisão Semanal

```bash
# 1. Configurar task de geração (a cada 6 horas)
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 */6 * * *" -l 10 -h 48

# 2. Configurar task de envio semanal (domingo às 10h)
npm run cli registerTask -t SendLastTopicHistory -c "0 10 * * 0" -d "Resumo semanal de aprendizado"

# 3. Iniciar o sistema
npm run cli start
```

### Cenário 3: Sistema de Aprendizado Intensivo

```bash
# 1. Configurar task de geração (a cada hora)
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 * * * *" -l 3 -h 12

# 2. Configurar task de envio (3x por dia)
npm run cli registerTask -t SendLastTopicHistory -c "0 8,14,20 * * *" -d "Resumo de aprendizado"

# 3. Iniciar o sistema
npm run cli start
```

## Monitoramento e Manutenção

### Verificar Status das Tasks

```bash
# Listar todas as tasks
npm run cli listTasks

# Executar task manualmente para teste
npm run cli executeTask -i "ID_DA_TASK"
```

### Remover Tasks Desnecessárias

```bash
# Remover task específica
npm run cli removeTask -i "ID_DA_TASK"
```

### Ajustar Configurações

Para ajustar configurações, você precisa:
1. Remover a task atual
2. Criar uma nova task com as configurações desejadas

```bash
# Remover task antiga
npm run cli removeTask -i "ID_DA_TASK_ANTIGA"

# Criar nova task com configurações ajustadas
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 */4 * * *" -l 8 -h 18
```

## Troubleshooting

### Problemas Comuns

1. **Task não está executando:**
   - Verifique se o sistema está rodando: `npm run cli start`
   - Verifique se a task está ativa: `npm run cli listTasks`
   - Execute manualmente para testar: `npm run cli executeTask -i "ID"`

2. **Erro na expressão cron:**
   - Use um validador online para verificar a sintaxe
   - Teste com expressões simples primeiro

3. **Task falhando:**
   - Execute manualmente para ver o erro detalhado
   - Verifique as configurações de email e API keys

### Logs e Debug

Os logs detalhados são exibidos no console quando:
- Tasks são executadas
- Erros ocorrem
- Sistema é iniciado/parado

Para debug adicional, execute tasks manualmente para ver logs detalhados. 