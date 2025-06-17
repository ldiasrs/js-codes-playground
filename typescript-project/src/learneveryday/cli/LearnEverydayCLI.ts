import { Command } from 'commander';
import { ContainerBuilder } from '../infrastructure/di/container';
import { TYPES } from '../infrastructure/di/types';
import { NedbDatabaseManager } from '../infrastructure/database/NedbDatabaseManager';
import { CreateCustomerCommand } from '../application/commands/customer/CreateCustomerCommand';
import { AddTopicCommand } from '../application/commands/topic/AddTopicCommand';
import { GenerateAndEmailTopicHistoryCommand } from '../application/commands/topic-history/GenerateAndEmailTopicHistoryCommand';
import { GetAllCustomersQuery } from '../application/queries/customer/GetAllCustomersQuery';
import { GetCustomerByIdQuery } from '../application/queries/customer/GetCustomerByIdQuery';
import { GetTopicByIdQuery } from '../application/queries/topic/GetTopicByIdQuery';
import { CreateCustomerFeature } from '../domain/customer/features/CreateCustomerFeature';
import { AddTopicFeature } from '../domain/topic/features/AddTopicFeature';
import { GenerateTopicHistoryFeature } from '../domain/topic-history/features/GenerateTopicHistoryFeature';
import { GenerateAndEmailTopicHistoryFeature } from '../domain/topic-history/features/GenerateAndEmailTopicHistoryFeature';
import { TopicHistoryGeneratorFactory } from '../infrastructure/factories/TopicHistoryGeneratorFactory';
import { EmailSenderFactory } from '../infrastructure/factories/EmailSenderFactory';

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

    // Start command - Inicia o projeto com scheduled tasks
    this.program
      .command('start')
      .description('Inicia o projeto junto com os scheduled tasks')
      .action(async () => {
        await this.startProject();
      });

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

    this.program
      .command('listTasks')
      .description('Lista todas as scheduled tasks')
      .action(async () => {
        await this.listScheduledTasks();
      });

    // Register Task command (generic)
    this.program
      .command('registerTask')
      .description('Registra uma nova scheduled task')
      .requiredOption('-t, --type <type>', 'Tipo da task (GenerateTopicHistoriesForOldTopics | SendLastTopicHistory)')
      .requiredOption('-c, --cron <cron>', 'Expressão cron (ex: "0 * * * *" para a cada hora)')
      .option('-l, --limit <limit>', 'Limite de tópicos por cliente (apenas para GenerateTopicHistoriesForOldTopics, padrão: 10)', '10')
      .option('-h, --hours <hours>', 'Horas desde a última atualização (apenas para GenerateTopicHistoriesForOldTopics, padrão: 24)', '24')
      .option('-d, --description <description>', 'Descrição da task')
      .action(async (options) => {
        await this.registerTask(options);
      });

    // Remove Task command
    this.program
      .command('removeTask')
      .description('Remove uma scheduled task pelo ID')
      .requiredOption('-i, --id <id>', 'ID da task para remover')
      .action(async (options) => {
        await this.removeScheduledTask(options);
      });

    // Execute Task command
    this.program
      .command('executeTask')
      .description('Executa uma task manualmente pelo ID')
      .requiredOption('-i, --id <id>', 'ID da task para executar')
      .action(async (options) => {
        await this.executeScheduledTask(options);
      });
  }

  private async initializeContainer(): Promise<void> {
    if (!this.container) {
      this.container = ContainerBuilder.build(this.dataDir);
    }
  }

  private async startProject(): Promise<void> {
    try {
      console.log('🚀 Iniciando LearnEveryday com scheduled tasks...');
      
      await this.initializeContainer();
      
      // Get scheduling service from container
      const schedulingService = this.container.get(TYPES.SchedulingService);
      
      await schedulingService.start();

      console.log('✅ Scheduling service inicializado');
      console.log('⏰ Scheduled tasks ativos');


      
      // Keep the process running
      console.log('🔄 Sistema rodando... (Pressione Ctrl+C para parar)');
      
      // Keep the process alive
      process.on('SIGINT', () => {
        console.log('\n🛑 Parando o sistema...');
        process.exit(0);
      });

      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error('❌ Erro ao iniciar o projeto:', error);
      process.exit(1);
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
      
      const topicRepository = this.container.get(TYPES.TopicRepository);
      const topics = await topicRepository.findAll();
      
      if (topics.length === 0) {
        console.log('📭 Nenhum tópico encontrado');
        return;
      }
      
      console.log(`📋 Total de tópicos: ${topics.length}\n`);
      
      topics.forEach((topic: any, index: number) => {
        console.log(`${index + 1}. ${topic.subject}`);
        console.log(`   ID: ${topic.id}`);
        console.log(`   Cliente ID: ${topic.customerId}`);
        console.log(`   Criado em: ${topic.dateCreated.toLocaleDateString()}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar tópicos:', error);
      process.exit(1);
    }
  }

  private async listScheduledTasks(): Promise<void> {
    try {
      console.log('📋 Listando scheduled tasks...');
      
      await this.initializeContainer();
      
      // Get scheduling service from container
      const schedulingService = this.container.get(TYPES.SchedulingService);
      
      // Get scheduled task repository from container
      const scheduledTaskRepository = this.container.get(TYPES.ScheduledTaskRepository);
      
      const tasks = await scheduledTaskRepository.findAll();
      
      if (tasks.length === 0) {
        console.log('📭 Nenhuma scheduled task encontrada');
        return;
      }
      
      console.log(`📋 Encontradas ${tasks.length} scheduled tasks:`);
      console.log('');
      
      tasks.forEach((task: any) => {
        console.log(`🆔 ID: ${task.id}`);
        console.log(`📝 Tipo: ${task.taskType}`);
        console.log(`⏰ Cron: ${task.cronExpression}`);
        console.log(`📊 Status: ${task.status}`);
        console.log(`✅ Ativo: ${task.isActive ? 'Sim' : 'Não'}`);
        if (task.lastRunAt) {
          console.log(`🕐 Última execução: ${new Date(task.lastRunAt).toLocaleString()}`);
        }
        if (task.nextRunAt) {
          console.log(`⏭️ Próxima execução: ${new Date(task.nextRunAt).toLocaleString()}`);
        }
        if (task.taskData && Object.keys(task.taskData).length > 0) {
          console.log(`📄 Dados: ${JSON.stringify(task.taskData)}`);
        }
        console.log('---');
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar scheduled tasks:', error);
      process.exit(1);
    }
  }

  private async registerTask(options: any): Promise<void> {
    try {
      console.log('📝 Registrando task...');
      
      await this.initializeContainer();
      
      // Validate task type
      const validTaskTypes = ['GenerateTopicHistoriesForOldTopics', 'SendLastTopicHistory'];
      if (!validTaskTypes.includes(options.type)) {
        throw new Error(`Tipo de task inválido: ${options.type}. Tipos válidos: ${validTaskTypes.join(', ')}`);
      }
      
      // Get scheduling service from container
      const schedulingService = this.container.get(TYPES.SchedulingService);
      
      // Create task data based on type
      let taskData: any = {};
      let defaultDescription = '';
      
      if (options.type === 'GenerateTopicHistoriesForOldTopics') {
        taskData = {
          limit: parseInt(options.limit),
          hoursSinceLastUpdate: parseInt(options.hours),
          description: options.description || 'Generate topic histories for topics with old histories'
        };
        defaultDescription = 'Generate topic histories for topics with old histories';
      } else if (options.type === 'SendLastTopicHistory') {
        taskData = {
          description: options.description || 'Send last topic history to all customers'
        };
        defaultDescription = 'Send last topic history to all customers';
      }
      
      // Create scheduled task
      const { ScheduledTask } = await import('../domain/scheduling/entities/ScheduledTask');
      const task = new ScheduledTask(
        options.type,
        taskData,
        options.cron
      );
      
      // Schedule the task
      await schedulingService.scheduleTask(task);
      
      console.log('✅ Task registrada com sucesso!');
      console.log(`   ID: ${task.id}`);
      console.log(`   Tipo: ${task.taskType}`);
      console.log(`   Cron: ${task.cronExpression}`);
      
      // Show additional info based on task type
      if (options.type === 'GenerateTopicHistoriesForOldTopics') {
        console.log(`   Limite: ${taskData.limit} tópicos por cliente`);
        console.log(`   Horas: ${taskData.hoursSinceLastUpdate} horas desde última atualização`);
      }
      
      if (options.description) {
        console.log(`   Descrição: ${options.description}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao registrar task:', error);
      process.exit(1);
    }
  }

  private async removeScheduledTask(options: any): Promise<void> {
    try {
      console.log(`🗑️ Removendo task ${options.id}...`);
      
      await this.initializeContainer();
      
      // Get scheduling service from container
      const schedulingService = this.container.get(TYPES.SchedulingService);
      
      // Remove the task
      await schedulingService.removeTask(options.id);
      
      console.log('✅ Task removida com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao remover task:', error);
      process.exit(1);
    }
  }

  private async executeScheduledTask(options: any): Promise<void> {
    try {
      console.log(`▶️ Executando task ${options.id}...`);
      
      await this.initializeContainer();
      
      // Get scheduled task repository from container
      const scheduledTaskRepository = this.container.get(TYPES.ScheduledTaskRepository);
      
      // Find the task
      const task = await scheduledTaskRepository.findById(options.id);
      
      if (!task) {
        throw new Error(`Task com ID ${options.id} não encontrada`);
      }
      
      // Get scheduling service from container
      const schedulingService = this.container.get(TYPES.SchedulingService);
      
      // Execute the task manually
      await schedulingService.executeTask(task);
      
      console.log('✅ Task executada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao executar task:', error);
      process.exit(1);
    }
  }

  public run(): void {
    this.program.parse();
  }
}