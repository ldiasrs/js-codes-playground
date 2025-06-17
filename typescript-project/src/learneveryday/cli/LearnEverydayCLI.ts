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
      
      console.log('✅ Scheduling service inicializado');
      console.log('⏰ Scheduled tasks ativos');
      
      // Keep the process running
      console.log('🔄 Sistema rodando... (Pressione Ctrl+C para parar)');
      
      // Keep the process alive
      process.on('SIGINT', () => {
        console.log('\n🛑 Parando o sistema...');
        process.exit(0);
      });
      
    } catch (error) {
      console.error('❌ Erro ao iniciar o projeto:', error);
      process.exit(1);
    }
  }

  private async createCustomer(options: any): Promise<void> {
    try {
      console.log('👤 Criando novo cliente...');
      
      await this.initializeContainer();
      
      // Get repositories from container
      const customerRepository = this.container.get(TYPES.CustomerRepository);
      const topicRepository = this.container.get(TYPES.TopicRepository);
      
      // Create feature manually
      const createCustomerFeature = new CreateCustomerFeature(customerRepository, topicRepository);
      
      // Create command manually
      const command = new CreateCustomerCommand({
        customerName: options.name,
        govIdentification: {
          type: 'CPF',
          content: options.cpf
        },
        email: options.email,
        phoneNumber: options.phone
      }, createCustomerFeature);
      
      const customer = await command.execute();
      
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
      
      // Get repositories from container
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
      
      // Create feature manually
      const addTopicFeature = new AddTopicFeature(topicRepository, customerRepository);
      
      // Create command manually
      const command = new AddTopicCommand({
        customerId: options.customerId,
        subject: options.subject
      }, addTopicFeature);
      
      const topic = await command.execute();
      
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
      
      // Get repositories from container
      const topicRepository = this.container.get(TYPES.TopicRepository);
      const topicHistoryRepository = this.container.get(TYPES.TopicHistoryRepository);
      
      // Verify topic exists using query
      const getTopicQuery = new GetTopicByIdQuery(
        { topicId: options.topicId },
        topicRepository
      );
      const topic = await getTopicQuery.execute();
      
      if (!topic) {
        throw new Error(`Tópico com ID ${options.topicId} não encontrado`);
      }
      
      // Get ports from container
      const generateTopicHistoryPort = this.container.get(TYPES.GenerateTopicHistoryPort);
      const sendTopicHistoryByEmailPort = this.container.get(TYPES.SendTopicHistoryByEmailPort);
      
      // Create features manually
      const generateTopicHistoryFeature = new GenerateTopicHistoryFeature(
        topicRepository,
        topicHistoryRepository,
        generateTopicHistoryPort
      );
      
      const generateAndEmailTopicHistoryFeature = new GenerateAndEmailTopicHistoryFeature(
        generateTopicHistoryFeature,
        topicRepository,
        sendTopicHistoryByEmailPort
      );
      
      // Create command manually
      const command = new GenerateAndEmailTopicHistoryCommand({
        topicId: options.topicId,
        recipientEmail: options.email
      }, generateAndEmailTopicHistoryFeature);
      
      const result = await command.execute();
      
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
      console.log('⏰ Listando todas as scheduled tasks...');
      
      await this.initializeContainer();
      
      const scheduledTaskRepository = this.container.get(TYPES.ScheduledTaskRepository);
      const tasks = await scheduledTaskRepository.findAll();
      
      if (tasks.length === 0) {
        console.log('📭 Nenhuma scheduled task encontrada');
        return;
      }
      
      console.log(`📋 Total de tasks: ${tasks.length}\n`);
      
      tasks.forEach((task: any, index: number) => {
        console.log(`${index + 1}. ${task.taskType}`);
        console.log(`   ID: ${task.id}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Ativo: ${task.isActive ? 'Sim' : 'Não'}`);
        console.log(`   Cron: ${task.cronExpression}`);
        console.log(`   Próxima execução: ${task.nextRunAt?.toLocaleString() || 'Não agendado'}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar scheduled tasks:', error);
      process.exit(1);
    }
  }

  public run(): void {
    this.program.parse();
  }
}