import * as path from 'path';
import * as fs from 'fs';

// Infrastructure adapters
import { JsonCustomerRepository } from './infrastructure/adapters/JsonCustomerRepository';
import { JsonTopicRepository } from './infrastructure/adapters/JsonTopicRepository';
import { JsonTopicHistoryRepository } from './infrastructure/adapters/JsonTopicHistoryRepository';

// Domain features
import { CreateCustomerFeature } from './domain/customer/features/CreateCustomerFeature';
import { AddTopicFeature } from './domain/topic/features/AddTopicFeature';
import { AddTopicHistoryFeature } from './domain/topic-history/features/AddTopicHistoryFeature';

// DTOs
import { CustomerDTO, CustomerDTOMapper } from './application/dto/CustomerDTO';
import { TopicDTO, TopicDTOMapper } from './application/dto/TopicDTO';
import { TopicHistoryDTO, TopicHistoryDTOMapper } from './application/dto/TopicDTO';

// Domain entities
import { Customer } from './domain/customer/entities/Customer';
import { Topic } from './domain/topic/entities/Topic';
import { TopicHistory } from './domain/topic-history/entities/TopicHistory';

class LearnEverydayExample {
  private dataDir: string;
  private customerRepository: JsonCustomerRepository;
  private topicRepository: JsonTopicRepository;
  private topicHistoryRepository: JsonTopicHistoryRepository;

  // Domain features
  private createCustomerFeature: CreateCustomerFeature;
  private addTopicFeature: AddTopicFeature;
  private addTopicHistoryFeature: AddTopicHistoryFeature;

  constructor() {
    // Setup data directory
    this.dataDir = path.join(process.cwd(), 'data', 'learneveryday');
    this.ensureDataDir();

    // Initialize repositories
    this.customerRepository = new JsonCustomerRepository(this.dataDir);
    this.topicRepository = new JsonTopicRepository(this.dataDir);
    this.topicHistoryRepository = new JsonTopicHistoryRepository(this.dataDir);

    // Initialize domain features
    this.createCustomerFeature = new CreateCustomerFeature(
      this.customerRepository,
      this.topicRepository
    );

    this.addTopicFeature = new AddTopicFeature(
      this.topicRepository,
      this.customerRepository
    );

    this.addTopicHistoryFeature = new AddTopicHistoryFeature(
      this.topicRepository,
      this.topicHistoryRepository
    );
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Create a customer with the given name and CPF
  async createCustomer(name: string, cpf: string): Promise<CustomerDTO> {
    console.log(`\n=== Creating Customer: ${name} ===`);
    
    const result = await this.createCustomerFeature.execute({
      customerName: name,
      govIdentification: {
        type: 'CPF',
        content: cpf
      }
    });

    const customerDTO = CustomerDTOMapper.toDTO(result.customer, result.topics);
    console.log(`✅ Customer created successfully:`, {
      id: customerDTO.id,
      name: customerDTO.customerName,
      cpf: customerDTO.govIdentification.content
    });

    return customerDTO;
  }

  // Add a topic to a customer
  async addTopic(customerId: string, subject: string): Promise<TopicDTO> {
    console.log(`\n=== Adding Topic: ${subject} ===`);
    
    const topic = await this.addTopicFeature.execute({
      customerId: customerId,
      subject: subject
    });

    const topicDTO = TopicDTOMapper.toDTO(topic);
    console.log(`✅ Topic added successfully:`, {
      id: topicDTO.id,
      subject: topicDTO.subject,
      dateCreated: topicDTO.dateCreated
    });

    return topicDTO;
  }

  // Add topic history entries
  async addTopicHistories(topicId: string, histories: string[]): Promise<TopicHistoryDTO[]> {
    console.log(`\n=== Adding Topic Histories for Topic: ${topicId} ===`);
    
    const historyDTOs: TopicHistoryDTO[] = [];

    for (const content of histories) {
      const history = await this.addTopicHistoryFeature.execute({
        topicId: topicId,
        content: content
      });

      const historyDTO = TopicHistoryDTOMapper.toDTO(history);
      historyDTOs.push(historyDTO);
      console.log(`✅ History added: ${content.substring(0, 50)}...`);
    }

    return historyDTOs;
  }

  // Fetch and display all customers
  async fetchAllCustomers(): Promise<CustomerDTO[]> {
    console.log('\n=== Fetching All Customers ===');
    
    const customers = await this.customerRepository.findAll();
    const customerDTOs: CustomerDTO[] = [];

    for (const customer of customers) {
      const topics = await this.topicRepository.findByCustomerId(customer.id || '');
      
      // Fetch histories for each topic
      const topicsWithHistories = await Promise.all(
        topics.map(async (topic) => {
          const histories = await this.topicHistoryRepository.findByTopicId(topic.id);
          return TopicDTOMapper.toDTO(topic, histories);
        })
      );
      
      const customerDTO = CustomerDTOMapper.toDTO(customer, topics);
      // Replace the topics with the ones that include histories
      customerDTO.topics = topicsWithHistories;
      customerDTOs.push(customerDTO);
    }

    console.log(`\n📋 Found ${customerDTOs.length} customers:`);
    
    customerDTOs.forEach((customer, index) => {
      console.log(`\n${index + 1}. Customer: ${customer.customerName}`);
      console.log(`   ID: ${customer.id}`);
      console.log(`   CPF: ${customer.govIdentification.content}`);
      console.log(`   Created: ${customer.dateCreated.toISOString()}`);
      console.log(`   Topics: ${customer.topics.length}`);
    });

    return customerDTOs;
  }

  // Fetch and display topics and history for a customer
  async fetchCustomerTopicsAndHistory(customerId: string): Promise<void> {
    console.log(`\n=== Fetching Topics and History for Customer: ${customerId} ===`);
    
    // Get customer details
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      console.log(`❌ Customer with ID ${customerId} not found`);
      return;
    }

    const topics = await this.topicRepository.findByCustomerId(customerId);
    const customerDTO = CustomerDTOMapper.toDTO(customer, topics);

    console.log(`\n👤 Customer: ${customerDTO.customerName}`);
    console.log(`   CPF: ${customerDTO.govIdentification.content}`);
    console.log(`   Total Topics: ${customerDTO.topics.length}`);

    // Fetch topics and their histories
    for (const topic of topics) {
      const histories = await this.topicHistoryRepository.findByTopicId(topic.id);
      const topicDTO = TopicDTOMapper.toDTO(topic, histories);
      
      console.log(`\n📚 Topic: ${topicDTO.subject}`);
      console.log(`   ID: ${topicDTO.id}`);
      console.log(`   Created: ${topicDTO.dateCreated}`);
      console.log(`   History Entries: ${topicDTO.history.length}`);

      if (topicDTO.history.length > 0) {
        console.log(`   📝 History:`);
        topicDTO.history.forEach((history, index) => {
          console.log(`      ${index + 1}. ${history.content}`);
          console.log(`         Created: ${history.createdAt}`);
        });
      }
    }
  }

  // Generate sample topic histories based on topic subject
  generateTopicHistories(subject: string): string[] {
    const histories: { [key: string]: string[] } = {
      'One Ring': [
        'Started studying the ancient texts about the One Ring',
        'Learned about its creation by Sauron in the fires of Mount Doom',
        'Discovered the inscription in Black Speech and its translation',
        'Studied the history of Isildur and how he cut the ring from Sauron\'s hand',
        'Explored the concept of the ring\'s corrupting influence on its bearers'
      ],
      'Saruman': [
        'Began research on Saruman the White, head of the White Council',
        'Studied his transformation from wise wizard to corrupted servant of Sauron',
        'Learned about his creation of the Uruk-hai and his industrial complex at Isengard',
        'Explored his betrayal of Gandalf and the White Council',
        'Analyzed his ultimate downfall and the destruction of Isengard'
      ],
      'Mordor': [
        'Started comprehensive study of Mordor, the Dark Land',
        'Learned about its geography: the Plateau of Gorgoroth, Mount Doom, and the Black Gate',
        'Studied the history of Sauron\'s return and the rebuilding of Barad-dûr',
        'Explored the various creatures and armies that inhabit Mordor',
        'Analyzed the strategic importance of Mordor in the War of the Ring'
      ],
      'IA': [
        'Started learning about Artificial Intelligence fundamentals',
        'Explored machine learning algorithms and neural networks',
        'Studied different types of AI: narrow AI vs general AI',
        'Learned about AI applications in various industries',
        'Researched the current state of AI development and future prospects'
      ],
      'How I will loose my job from IA': [
        'Analyzed which jobs are most at risk from AI automation',
        'Studied the timeline predictions for job displacement by AI',
        'Researched specific industries vulnerable to AI disruption',
        'Explored the economic implications of widespread AI adoption',
        'Investigated case studies of companies already using AI to replace human workers'
      ],
      'How can I keep my job with IA': [
        'Identified skills that complement AI rather than compete with it',
        'Studied the importance of creativity, emotional intelligence, and complex problem-solving',
        'Explored opportunities to work alongside AI as a collaborator',
        'Researched emerging job roles created by AI technology',
        'Developed strategies for continuous learning and skill adaptation'
      ]
    };

    return histories[subject] || [
      `Started learning about ${subject}`,
      `Made progress in understanding ${subject}`,
      `Completed initial research on ${subject}`,
      `Advanced to intermediate level in ${subject}`,
      `Achieved mastery in key concepts of ${subject}`
    ];
  }

  // Run the complete example
  async runExample(): Promise<void> {
    console.log('🚀 Starting LearnEveryday Example with Real Implementations\n');

    try {
      // Create Gandolf customer
      const gandolf = await this.createCustomer('Gandolf', '100.200.300-30');
      
      // Add topics for Gandolf
      const oneRingTopic = await this.addTopic(gandolf.id, 'One Ring');
      const sarumanTopic = await this.addTopic(gandolf.id, 'Saruman');
      const mordorTopic = await this.addTopic(gandolf.id, 'Mordor');

      // Add topic histories for Gandolf's topics
      await this.addTopicHistories(oneRingTopic.id, this.generateTopicHistories('One Ring'));
      await this.addTopicHistories(sarumanTopic.id, this.generateTopicHistories('Saruman'));
      await this.addTopicHistories(mordorTopic.id, this.generateTopicHistories('Mordor'));

      // Create VibeCodeDev customer
      const vibeCodeDev = await this.createCustomer('VibeCodeDev', '200.300.400-50');
      
      // Add topics for VibeCodeDev
      const iaTopic = await this.addTopic(vibeCodeDev.id, 'IA');
      const loseJobTopic = await this.addTopic(vibeCodeDev.id, 'How I will loose my job from IA');
      const keepJobTopic = await this.addTopic(vibeCodeDev.id, 'How can I keep my job with IA');

      // Add topic histories for VibeCodeDev's topics
      await this.addTopicHistories(iaTopic.id, this.generateTopicHistories('IA'));
      await this.addTopicHistories(loseJobTopic.id, this.generateTopicHistories('How I will loose my job from IA'));
      await this.addTopicHistories(keepJobTopic.id, this.generateTopicHistories('How can I keep my job with IA'));

      // Fetch and display all customers
      const allCustomers = await this.fetchAllCustomers();

      // Fetch and display topics and history for each customer
      for (const customer of allCustomers) {
        await this.fetchCustomerTopicsAndHistory(customer.id);
      }

      console.log('\n✅ Example completed successfully!');
      console.log(`📁 Data saved to: ${this.dataDir}`);

    } catch (error) {
      console.error('\n❌ Example failed:', error);
      throw error;
    }
  }
}

// Export for use in other files
export { LearnEverydayExample };

// Run the example if this file is executed directly
if (require.main === module) {
  const example = new LearnEverydayExample();
  example.runExample().catch(console.error);
} 