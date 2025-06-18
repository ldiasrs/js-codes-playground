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

  public run(): void {
    this.program.parse();
  }
}