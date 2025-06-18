import { Command } from 'commander';
import { ContainerBuilder } from '../infrastructure/di/container';
import { TYPES } from '../infrastructure/di/types';
import { CreateCustomerCommand } from '../application/commands/customer/CreateCustomerCommand';
import { AddTopicCommand } from '../application/commands/topic/AddTopicCommand';
import { GenerateAndEmailTopicHistoryCommand } from '../application/commands/topic-history/GenerateAndEmailTopicHistoryCommand';
import { GetAllCustomersQuery } from '../application/queries/customer/GetAllCustomersQuery';
import { GetCustomerByIdQuery } from '../application/queries/customer/GetCustomerByIdQuery';
import { GetTopicByIdQuery } from '../application/queries/topic/GetTopicByIdQuery';
import { TriggerTaskProcessExecutorCron } from '../infrastructure/scheduler/TriggerTaskProcessExecutorCron';

export class LearnEverydayCLI {
  private program: Command;
  private dataDir: string = './data/production/led';
  private container: any;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('learneveryday')
      .description('LearnEveryday CLI - Sistema de gerenciamento de tópicos e clientes')
      .version('1.0.0');

    // New Customer command
    this.program
      .command('newCustomer')
      .description('Cria um novo cliente')
      .requiredOption('-n, --name <name>', 'Nome do cliente')
      .requiredOption('-c, --cpf <cpf>', 'CPF do cliente')
      .requiredOption('-e, --email <email>', 'Email do cliente')
      .requiredOption('-p, --phone <phone>', 'Telefone do cliente')
      .action(async (options) => {
        await this.createCustomer(options);
      });

    // New Topic command
    this.program
      .command('newTopic')
      .description('Cria um novo tópico para um cliente')
      .requiredOption('-c, --customerId <customerId>', 'ID do cliente')
      .requiredOption('-s, --subject <subject>', 'Assunto do tópico')
      .action(async (options) => {
        await this.createTopic(options);
      });

    // Generate and Send Topic History command
    this.program
      .command('generateAndSendTopicHistory')
      .description('Gera um novo topic history e envia por email')
      .requiredOption('-t, --topicId <topicId>', 'ID do tópico')
      .requiredOption('-e, --email <email>', 'Email para envio')
      .action(async (options) => {
        await this.generateAndSendTopicHistory(options);
      });

    // Start Scheduler command
    this.program
      .command('startScheduler')
      .description('Inicia o agendador de tarefas para processamento automático')
      .option('-c, --cron <cron>', 'Expressão cron personalizada (padrão: "0 * * * *" - a cada hora)', '0 * * * *')
      .option('-d, --dataDir <dataDir>', 'Diretório de dados (padrão: "./data/production/led")', './data/production/led')
      .action(async (options) => {
        await this.startScheduler(options);
      });

    // List commands for debugging
    this.program
      .command('listCustomers')
      .description('Lista todos os clientes')
      .action(async () => {
        await this.listCustomers();
      });

    this.program
      .command('listTopics')
      .description('Lista todos os tópicos')
      .action(async () => {
        await this.listTopics();
      });

    // List Tasks command
    this.program
      .command('listTasks')
      .description('Lista todas as tarefas ordenadas por processAt')
      .option('-l, --limit <limit>', 'Número máximo de tarefas a exibir (padrão: 50)', '50')
      .option('-s, --status <status>', 'Filtrar por status (pending, running, completed, failed, cancelled)')
      .option('-t, --type <type>', 'Filtrar por tipo (generate-topic-history, send-topic-history, regenerate-topic-history)')
      .action(async (options) => {
        await this.listTasks(options);
      });

    // Seed Data command
    this.program
      .command('seed')
      .description('Cria dados de exemplo: um cliente e dois tópicos')
      .action(async () => {
        await this.seedData();
      });

    // Trigger Task Processing command
    this.program
      .command('triggerTaskProcessing')
      .description('Executa manualmente o processamento de tarefas agendadas')
      .action(async () => {
        await this.triggerTaskProcessing();
      });
  }

  private async initializeContainer(): Promise<void> {
    if (!this.container) {
      this.container = ContainerBuilder.build(this.dataDir);
    }
  }

  private async createCustomer(options: any): Promise<void> {
    try {
      console.log('👤 Criando novo cliente...');
      
      await this.initializeContainer();
      
      // Get feature from container
      const createCustomerFeature = this.container.get(TYPES.CreateCustomerFeature);
      
      // Create command with data
      const createCustomerCommand = new CreateCustomerCommand({
        customerName: options.name,
        govIdentification: {
          type: 'CPF',
          content: options.cpf
        },
        email: options.email,
        phoneNumber: options.phone
      }, createCustomerFeature);
      
      const customer = await createCustomerCommand.execute();
      
      console.log('✅ Cliente criado com sucesso!');
      console.log(`   ID: ${customer.id}`);
      console.log(`   Nome: ${customer.customerName}`);
      console.log(`   Email: ${customer.email}`);
      
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      process.exit(1);
    }
  }

  private async createTopic(options: any): Promise<void> {
    try {
      console.log('📚 Criando novo tópico...');
      
      await this.initializeContainer();
      
      // Get repositories from container for customer verification
      const customerRepository = this.container.get(TYPES.CustomerRepository);
      const topicRepository = this.container.get(TYPES.TopicRepository);
      
      // Verify customer exists using query
      const getCustomerQuery = new GetCustomerByIdQuery(
        { customerId: options.customerId },
        customerRepository,
        topicRepository
      );
      const customer = await getCustomerQuery.execute();
      
      if (!customer) {
        throw new Error(`Cliente com ID ${options.customerId} não encontrado`);
      }
      
      // Get feature from container
      const addTopicFeature = this.container.get(TYPES.AddTopicFeature);
      
      // Create command with data
      const addTopicCommand = new AddTopicCommand({
        customerId: options.customerId,
        subject: options.subject
      }, addTopicFeature);
      
      const topic = await addTopicCommand.execute();
      
      console.log('✅ Tópico criado com sucesso!');
      console.log(`   ID: ${topic.id}`);
      console.log(`   Assunto: ${topic.subject}`);
      console.log(`   Cliente: ${customer.customerName}`);
      
    } catch (error) {
      console.error('❌ Erro ao criar tópico:', error);
      process.exit(1);
    }
  }

  private async generateAndSendTopicHistory(options: any): Promise<void> {
    try {
      console.log('📖 Gerando e enviando topic history...');
      
      await this.initializeContainer();
      
      // Get repositories from container for topic verification
      const topicRepository = this.container.get(TYPES.TopicRepository);
      
      // Verify topic exists using query
      const getTopicQuery = new GetTopicByIdQuery(
        { topicId: options.topicId },
        topicRepository
      );
      const topic = await getTopicQuery.execute();
      
      if (!topic) {
        throw new Error(`Tópico com ID ${options.topicId} não encontrado`);
      }
      
      // Get feature from container
      const generateAndEmailTopicHistoryFeature = this.container.get(TYPES.GenerateAndEmailTopicHistoryFeature);
      
      // Create command with data
      const generateAndEmailTopicHistoryCommand = new GenerateAndEmailTopicHistoryCommand({
        topicId: options.topicId,
        recipientEmail: options.email
      }, generateAndEmailTopicHistoryFeature);
      
      const result = await generateAndEmailTopicHistoryCommand.execute();
      
      console.log('✅ Topic history gerado e enviado com sucesso!');
      console.log(`   ID: ${result.id}`);
      console.log(`   Tópico: ${topic.subject}`);
      console.log(`   Email enviado para: ${options.email}`);
      console.log(`   Conteúdo: ${result.content.substring(0, 100)}...`);
      
    } catch (error) {
      console.error('❌ Erro ao gerar e enviar topic history:', error);
      process.exit(1);
    }
  }

  private async listCustomers(): Promise<void> {
    try {
      console.log('👥 Listando todos os clientes...');
      
      await this.initializeContainer();
      
      // Get repositories from container
      const customerRepository = this.container.get(TYPES.CustomerRepository);
      const topicRepository = this.container.get(TYPES.TopicRepository);
      
      // Create query manually
      const query = new GetAllCustomersQuery(customerRepository, topicRepository);
      const customers = await query.execute();
      
      if (customers.length === 0) {
        console.log('📭 Nenhum cliente encontrado');
        return;
      }
      
      console.log(`📋 Total de clientes: ${customers.length}\n`);
      
      customers.forEach((customer: any, index: number) => {
        console.log(`${index + 1}. ${customer.customerName}`);
        console.log(`   ID: ${customer.id}`);
        console.log(`   Email: ${customer.email}`);
        console.log(`   CPF: ${customer.govIdentification.content}`);
        console.log(`   Tópicos: ${customer.topics?.length || 0}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar clientes:', error);
      process.exit(1);
    }
  }

  private async listTopics(): Promise<void> {
    try {
      console.log('📚 Listando todos os tópicos...');
      
      await this.initializeContainer();
      
      // Get repository from container
      const topicRepository = this.container.get(TYPES.TopicRepository);
      const customerRepository = this.container.get(TYPES.CustomerRepository);
      
      // Get all topics
      const topics = await topicRepository.findAll();
      
      if (topics.length === 0) {
        console.log('📭 Nenhum tópico encontrado.');
        return;
      }
      
      console.log(`📚 Encontrados ${topics.length} tópicos:`);
      console.log('');
      
      for (const topic of topics) {
        // Get customer info for each topic
        const customer = await customerRepository.findById(topic.customerId);
        const customerName = customer ? customer.customerName : 'Cliente não encontrado';
        
        console.log(`   ID: ${topic.id}`);
        console.log(`   Assunto: ${topic.subject}`);
        console.log(`   Cliente: ${customerName} (${topic.customerId})`);
        console.log(`   Criado em: ${topic.dateCreated.toLocaleString('pt-BR')}`);
        console.log('');
      }
      
    } catch (error) {
      console.error('❌ Erro ao listar tópicos:', error);
      process.exit(1);
    }
  }

  private async listTasks(options: any): Promise<void> {
    try {
      console.log('📋 Listando tarefas ordenadas por processAt...');
      
      await this.initializeContainer();
      
      // Get repository from container
      const taskProcessRepository = this.container.get(TYPES.TaskProcessRepository);
      
      // Get all tasks
      let tasks = await taskProcessRepository.findAll();
      
      // Apply filters if provided
      if (options.status) {
        tasks = tasks.filter(task => task.status === options.status);
      }
      
      if (options.type) {
        tasks = tasks.filter(task => task.type === options.type);
      }
      
      // Sort by processAt (null values last)
      tasks.sort((a, b) => {
        if (!a.processAt && !b.processAt) return 0;
        if (!a.processAt) return 1;
        if (!b.processAt) return -1;
        return new Date(b.processAt).getTime() - new Date(a.processAt).getTime();
      });
      
      // Apply limit
      const limit = parseInt(options.limit);
      if (limit > 0) {
        tasks = tasks.slice(0, limit);
      }
      
      if (tasks.length === 0) {
        console.log('📭 Nenhuma tarefa encontrada.');
        return;
      }
      
      console.log(`📋 Encontradas ${tasks.length} tarefas:`);
      console.log('');
      
      tasks.forEach((task, index) => {
        const statusEmoji = {
          'pending': '⏳',
          'running': '🔄',
          'completed': '✅',
          'failed': '❌',
          'cancelled': '🚫'
        }[task.status] || '❓';
        
        const typeEmoji = {
          'generate-topic-history': '📚',
          'send-topic-history': '📧',
          'regenerate-topic-history': '🔄'
        }[task.type] || '📋';
        
        console.log(`${index + 1}. ${statusEmoji} ${typeEmoji} ${task.type}`);
        console.log(`   ID: ${task.id}`);
        console.log(`   Entity ID: ${task.entityId}`);
        console.log(`   Customer ID: ${task.customerId}`);
        console.log(`   Status: ${task.status}`);
        
        if (task.scheduledTo) {
          console.log(`   Scheduled: ${task.scheduledTo.toLocaleString('pt-BR')}`);
        }
        
        if (task.processAt) {
          console.log(`   Processed: ${task.processAt.toLocaleString('pt-BR')}`);
        } else {
          console.log(`   Processed: Não processado`);
        }
        
        console.log(`   Created: ${task.createdAt.toLocaleString('pt-BR')}`);
        
        if (task.errorMsg) {
          console.log(`   Error: ${task.errorMsg}`);
        }
        
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar tarefas:', error);
      process.exit(1);
    }
  }

  private async seedData(): Promise<void> {
    try {
      console.log('🌱 Iniciando seed de dados...');
      
      await this.initializeContainer();
      
      // Get features from container
      const createCustomerFeature = this.container.get(TYPES.CreateCustomerFeature);
      const addTopicFeature = this.container.get(TYPES.AddTopicFeature);
      
      // Step 1: Create customer
      console.log('👤 Criando cliente de exemplo...');
      
      const createCustomerCommand = new CreateCustomerCommand({
        customerName: 'João Silva',
        govIdentification: {
          type: 'CPF',
          content: '123.456.789-00'
        },
        email: 'ldias.rs@gmail.com',
        phoneNumber: '(11) 99999-9999'
      }, createCustomerFeature);
      
      const customer = await createCustomerCommand.execute();
      
      console.log('✅ Cliente criado com sucesso!');
      console.log(`   ID: ${customer.id}`);
      console.log(`   Nome: ${customer.customerName}`);
      console.log(`   Email: ${customer.email}`);
      console.log('');
      
      // Step 2: Create first topic - Bitcoin
      console.log('📚 Criando primeiro tópico: Bitcoin...');
      
      const addTopicCommand1 = new AddTopicCommand({
        customerId: customer.id,
        subject: 'Bitcoin'
      }, addTopicFeature);
      
      const topic1 = await addTopicCommand1.execute();
      
      console.log('✅ Tópico "Bitcoin" criado com sucesso!');
      console.log(`   ID: ${topic1.id}`);
      console.log(`   Assunto: ${topic1.subject}`);
      console.log('');
      
      // Step 3: Create second topic - Receitas fitness para jantar
      console.log('📚 Criando segundo tópico: Receitas fitness para jantar...');
      
      const addTopicCommand2 = new AddTopicCommand({
        customerId: customer.id,
        subject: 'Receitas fitness para jantar'
      }, addTopicFeature);
      
      const topic2 = await addTopicCommand2.execute();
      
      console.log('✅ Tópico "Receitas fitness para jantar" criado com sucesso!');
      console.log(`   ID: ${topic2.id}`);
      console.log(`   Assunto: ${topic2.subject}`);
      console.log('');
      
      // Step 4: Summary
      console.log('🎉 Seed de dados concluído com sucesso!');
      console.log('📊 Resumo:');
      console.log(`   👤 Cliente: ${customer.customerName} (${customer.id})`);
      console.log(`   📚 Tópico 1: ${topic1.subject} (${topic1.id})`);
      console.log(`   📚 Tópico 2: ${topic2.subject} (${topic2.id})`);
      console.log('');
      console.log('💡 Agora você pode usar os comandos:');
      console.log('   npm run cli listCustomers');
      console.log('   npm run cli listTopics');
      console.log('   npm run cli listTasks');
      
    } catch (error) {
      console.error('❌ Erro ao executar seed de dados:', error);
      process.exit(1);
    }
  }

  private async startScheduler(options: any): Promise<void> {
    try {
      console.log('🚀 Iniciando o agendador de tarefas...');
      console.log(`📅 Cron: ${options.cron}`);
      console.log(`📁 Data Directory: ${options.dataDir}`);
      
      // Update data directory if provided
      if (options.dataDir !== this.dataDir) {
        this.dataDir = options.dataDir;
        this.container = null; // Reset container to use new data directory
      }
      
      await this.initializeContainer();
      
      // Get scheduler from container
      const scheduler = this.container.get(TYPES.TriggerTaskProcessExecutorCron);
      
      // Start the scheduler
      scheduler.start(options.cron);
      
      console.log('✅ Agendador iniciado com sucesso!');
      console.log('⏰ O sistema agora processará tarefas automaticamente');
      console.log('📝 Para parar o agendador, pressione Ctrl+C');
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n🛑 Parando o agendador...');
        scheduler.stop();
        console.log('✅ Agendador parado com sucesso!');
        process.exit(0);
      });
      
      // Keep the process alive
      setInterval(() => {
        // This keeps the process running
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao iniciar agendador:', error);
      process.exit(1);
    }
  }

  private async triggerTaskProcessing(): Promise<void> {
    try {
      console.log('🚀 Executando processamento manual de tarefas...');
      
      await this.initializeContainer();
      
      // Get scheduler from container
      const triggerTaskProcessExecutorCron = this.container.get(TYPES.TriggerTaskProcessExecutorCron);
      
      // Trigger the task processing
      await triggerTaskProcessExecutorCron.triggerNow();
      
      console.log('✅ Processamento de tarefas executado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao executar processamento de tarefas:', error);
      process.exit(1);
    }
  }

  public run(): void {
    this.program.parse();
  }
}