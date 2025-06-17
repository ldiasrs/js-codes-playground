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
npm run cli newCustomer -n "Nome do Cliente" -c "123.456.789-00" -e "cliente@email.com" -p "(11) 99999-9999"
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
   ID: 880e8400-e29b-41d4-a716-446655440003
   Tópico: Introdução ao TypeScript
   Email enviado para: joao.silva@email.com
   Conteúdo: Aqui está um resumo do que aprendemos sobre TypeScript...
```

## Comandos de Listagem (Debug)

### Listar Clientes
```bash
npm run cli listCustomers
```

### Listar Tópicos
```bash
npm run cli listTopics
```

### Listar Scheduled Tasks
```bash
npm run cli listTasks
```

## Fluxo Completo de Exemplo

Aqui está um exemplo completo de como usar todos os comandos em sequência:

```bash
# 1. Criar um cliente
npm run cli newCustomer -n "Maria Santos" -c "987.654.321-00" -e "maria.santos@email.com" -p "(11) 88888-8888"

# 2. Criar um tópico para o cliente (use o ID retornado no passo 1)
npm run cli newTopic -c "ID_DO_CLIENTE_RETORNADO" -s "Fundamentos de Clean Architecture"

# 3. Gerar e enviar um topic history manualmente
npm run cli generateAndSendTopicHistory -t "ID_DO_TOPICO_RETORNADO" -e "maria.santos@email.com"

# 4. Iniciar o sistema para executar as scheduled tasks
npm run cli start
```

## Estrutura do Banco de Dados

O banco de dados será criado automaticamente no diretório:
```
./data/production/led/
```

Arquivos criados:
- `customers.db` - Dados dos clientes
- `topics.db` - Dados dos tópicos
- `topic-histories.db` - Histórico de tópicos
- `scheduled-tasks.db` - Tarefas agendadas

## Expressões Cron Comuns

- `0 9 * * *` - Todos os dias às 9h
- `0 10 * * 1` - Toda segunda-feira às 10h
- `0 8,18 * * *` - Todos os dias às 8h e 18h
- `0 0 1 * *` - Primeiro dia de cada mês à meia-noite
- `*/15 * * * *` - A cada 15 minutos

## Tratamento de Erros

A CLI exibe mensagens de erro claras quando algo dá errado:

- **Cliente não encontrado**: Verifique se o ID do cliente está correto
- **Tópico não encontrado**: Verifique se o ID do tópico está correto
- **Erro de conexão**: Verifique as configurações de email e OpenAI
- **Erro de banco**: Verifique se o diretório `data/production/led` existe e tem permissões de escrita

## Comandos Disponíveis

Para ver todos os comandos disponíveis:
```bash
npm run cli --help
```

Para ver ajuda de um comando específico:
```bash
npm run cli [comando] --help
``` 