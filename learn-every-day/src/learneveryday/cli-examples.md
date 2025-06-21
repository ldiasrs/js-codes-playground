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
npm run cli newCustomer -n "Frodo Baggins" -c "123.456.789-00" -e "frodo@shire.com" -p "(11) 99999-9999"
```
**Saída esperada:**
```
👤 Criando novo cliente...
✅ Cliente criado com sucesso!
   ID: 550e8400-e29b-41d4-a716-446655440000
   Nome: Frodo Baggins
   Email: frodo@shire.com
```

### 3. Criar Novo Tópico (newTopic)

Cria um novo tópico para um cliente existente:

```bash
npm run cli newTopic -c "ID_DO_CLIENTE" -s "Assunto do Tópico"
```

**Exemplo:**
```bash
npm run cli -- newTopic -c "31b5be6f-6cf4-485e-9ab9-6e58a27cfb71" -s "Bitcoin"
npm run cli -- newTopic -c "31b5be6f-6cf4-485e-9ab9-6e58a27cfb71" -s "Estoicismo"
npm run cli -- newTopic -c "31b5be6f-6cf4-485e-9ab9-6e58a27cfb71" -s "Arquitetura de software"
npm run cli -- newTopic -c "31b5be6f-6cf4-485e-9ab9-6e58a27cfb71" -s "Comunicação efetiva"
```

**Saída esperada:**
```
📚 Criando novo tópico...
✅ Tópico criado com sucesso!
   ID: 660e8400-e29b-41d4-a716-446655440001
   Assunto: História dos Anéis de Poder
   Cliente: Frodo Baggins
```

### 4. Gerar e Enviar Topic History (generateAndSendTopicHistory)

Gera um novo topic history e envia por email:

```bash
npm run cli generateAndSendTopicHistory -t "ID_DO_TOPICO" -e "email@destino.com"
```

**Exemplo:**
```bash
npm run cli generateAndSendTopicHistory -t "660e8400-e29b-41d4-a716-446655440001" -e "frodo@shire.com"
```

**Saída esperada:**
```
📖 Gerando e enviando topic history...
✅ Topic history gerado e enviado com sucesso!
   ID: 770e8400-e29b-41d4-a716-446655440002
   Tópico: História dos Anéis de Poder
   Email enviado para: frodo@shire.com
   Conteúdo: Os Anéis de Poder foram forjados pelos Elfos sob a orientação de Sauron...
```

### 5. Listar Clientes (listCustomers)

Lista todos os clientes cadastrados:

```bash
npm run cli listCustomers
```

**Saída esperada:**
```
👥 Listando todos os clientes...
📋 Encontrados 3 clientes:
🆔 ID: 550e8400-e29b-41d4-a716-446655440000
   Nome: Frodo Baggins
   Email: frodo@shire.com
   CPF: 123.456.789-00
   Telefone: (11) 99999-9999
   Data de criação: 15/01/2024, 10:30:00
---
🆔 ID: 550e8400-e29b-41d4-a716-446655440001
   Nome: Gandalf, o Cinzento
   Email: gandalf@istari.com
   CPF: 987.654.321-00
   Telefone: (11) 88888-8888
   Data de criação: 15/01/2024, 11:45:00
---
🆔 ID: 550e8400-e29b-41d4-a716-446655440002
   Nome: Aragorn, filho de Arathorn
   Email: aragorn@rangers.com
   CPF: 456.789.123-00
   Telefone: (11) 77777-7777
   Data de criação: 15/01/2024, 12:15:00
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
📋 Encontrados 5 tópicos:
🆔 ID: 660e8400-e29b-41d4-a716-446655440001
   Assunto: História dos Anéis de Poder
   Cliente: Frodo Baggins (550e8400-e29b-41d4-a716-446655440000)
   Data de criação: 15/01/2024, 10:35:00
---
🆔 ID: 660e8400-e29b-41d4-a716-446655440002
   Assunto: Línguas Élficas: Quenya e Sindarin
   Cliente: Gandalf, o Cinzento (550e8400-e29b-41d4-a716-446655440001)
   Data de criação: 15/01/2024, 14:20:00
---
🆔 ID: 660e8400-e29b-41d4-a716-446655440003
   Assunto: Estratégias de Batalha na Terra-média
   Cliente: Aragorn, filho de Arathorn (550e8400-e29b-41d4-a716-446655440002)
   Data de criação: 15/01/2024, 16:10:00
---
🆔 ID: 660e8400-e29b-41d4-a716-446655440004
   Assunto: Herbalismo e Poções da Terra-média
   Cliente: Frodo Baggins (550e8400-e29b-41d4-a716-446655440000)
   Data de criação: 15/01/2024, 17:30:00
---
🆔 ID: 660e8400-e29b-41d4-a716-446655440005
   Assunto: Geografia de Gondor e Rohan
   Cliente: Aragorn, filho de Arathorn (550e8400-e29b-41d4-a716-446655440002)
   Data de criação: 15/01/2024, 18:45:00
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

### 11. Iniciar Scheduler (startScheduler)

Inicia o scheduler de task processes:

```bash
npm run cli startScheduler [opções]
```

**Opções opcionais:**
- `-c, --cron <cron>` - Expressão cron para execução (padrão: "*/5 * * * *" - a cada 5 minutos)
- `-d, --dataDir <path>` - Diretório para dados (padrão: "./data")

**Exemplo:**
```bash
npm run cli startScheduler -c "*/10 * * * *" -d "./lotr-data"
```

**Saída esperada:**
```
⏰ Iniciando scheduler de task processes...
📁 Diretório de dados: ./lotr-data
🔄 Cron expression: */10 * * * * (a cada 10 minutos)
✅ Scheduler iniciado com sucesso!
🔄 Executando... (Pressione Ctrl+C para parar)
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

### Cenário 1: Academia de Magos da Terra-média

```bash
# 1. Criar clientes (mestres)
npm run cli newCustomer -n "Gandalf, o Cinzento" -c "123.456.789-00" -e "gandalf@istari.com" -p "(11) 99999-9999"
npm run cli newCustomer -n "Saruman, o Branco" -c "987.654.321-00" -e "saruman@istari.com" -p "(11) 88888-8888"
npm run cli newCustomer -n "Radagast, o Castanho" -c "456.789.123-00" -e "radagast@istari.com" -p "(11) 77777-7777"

# 2. Criar tópicos de estudo
npm run cli newTopic -c "ID_GANDALF" -s "História dos Istari e suas Missões"
npm run cli newTopic -c "ID_GANDALF" -s "Magia de Proteção e Encantamentos"
npm run cli newTopic -c "ID_SARUMAN" -s "Estudo dos Palantíri e Comunicação"
npm run cli newTopic -c "ID_RADAGAST" -s "Herbalismo e Poções da Terra-média"

# 3. Configurar task de geração automática (a cada 4 horas)
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 */4 * * *" -l 3 -h 8 -d "Gera conhecimentos mágicos a cada 4 horas"

# 4. Configurar task de envio diário (às 18h)
npm run cli registerTask -t SendLastTopicHistory -c "0 18 * * *" -d "Resumo diário de estudos mágicos"

# 5. Iniciar o sistema
npm run cli start
```

### Cenário 2: Escola de Estratégia Militar de Gondor

```bash
# 1. Criar clientes (comandantes)
npm run cli newCustomer -n "Aragorn, filho de Arathorn" -c "111.222.333-00" -e "aragorn@rangers.com" -p "(11) 66666-6666"
npm run cli newCustomer -n "Boromir, filho de Denethor" -c "222.333.444-00" -e "boromir@gondor.com" -p "(11) 55555-5555"
npm run cli newCustomer -n "Faramir, filho de Denethor" -c "333.444.555-00" -e "faramir@gondor.com" -p "(11) 44444-4444"

# 2. Criar tópicos de estratégia
npm run cli newTopic -c "ID_ARAGORN" -s "Táticas de Guerrilha dos Rangers"
npm run cli newTopic -c "ID_BOROMIR" -s "Defesa de Minas Tirith"
npm run cli newTopic -c "ID_FARAMIR" -s "Estratégias de Reconhecimento"

# 3. Configurar task de geração (a cada 6 horas)
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 */6 * * *" -l 5 -h 12 -d "Gera estratégias militares a cada 6 horas"

# 4. Configurar task de envio semanal (domingo às 10h)
npm run cli registerTask -t SendLastTopicHistory -c "0 10 * * 0" -d "Resumo semanal de estratégias militares"

# 5. Iniciar o sistema
npm run cli start
```

### Cenário 3: Biblioteca de Conhecimento do Condado

```bash
# 1. Criar clientes (hobbits estudiosos)
npm run cli newCustomer -n "Frodo Baggins" -c "444.555.666-00" -e "frodo@shire.com" -p "(11) 33333-3333"
npm run cli newCustomer -n "Samwise Gamgee" -c "555.666.777-00" -e "sam@shire.com" -p "(11) 22222-2222"
npm run cli newCustomer -n "Merry Brandybuck" -c "666.777.888-00" -e "merry@shire.com" -p "(11) 11111-1111"
npm run cli newCustomer -n "Pippin Took" -c "777.888.999-00" -e "pippin@shire.com" -p "(11) 00000-0000"

# 2. Criar tópicos de conhecimento
npm run cli newTopic -c "ID_FRODO" -s "História dos Anéis de Poder"
npm run cli newTopic -c "ID_SAM" -s "Agricultura e Jardinagem do Condado"
npm run cli newTopic -c "ID_MERRY" -s "Geografia da Terra-média"
npm run cli newTopic -c "ID_PIPPIN" -s "História dos Reis de Gondor"

# 3. Configurar task de geração intensiva (a cada hora)
npm run cli registerTask -t GenerateTopicHistoriesForOldTopics -c "0 * * * *" -l 2 -h 6 -d "Gera conhecimentos a cada hora"

# 4. Configurar task de envio (3x por dia)
npm run cli registerTask -t SendLastTopicHistory -c "0 8,14,20 * * *" -d "Resumo de aprendizado do Condado"

# 5. Iniciar o sistema
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