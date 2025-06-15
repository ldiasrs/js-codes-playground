import { CustomerFacade } from '../../application/facade/CustomerFacade';
import { JsonTopicRepository } from '../adapters/JsonTopicRepository';
import { JsonTopicHistoryRepository } from '../adapters/JsonTopicHistoryRepository';
import { JsonCustomerRepository } from '../adapters/JsonCustomerRepository';
import { TopicRepositoryPort } from '../../domain/ports/TopicRepositoryPort';
import { TopicHistoryRepositoryPort } from '../../domain/ports/TopicHistoryRepositoryPort';
import { CustomerRepositoryPort } from '../../domain/ports/CustomerRepositoryPort';

export class DependencyContainer {
  private static instance: DependencyContainer;
  private topicRepository: TopicRepositoryPort;
  private topicHistoryRepository: TopicHistoryRepositoryPort;
  private customerRepository: CustomerRepositoryPort;
  private customerFacade: CustomerFacade;

  private constructor(dataDir: string = './data') {
    // Initialize repositories
    this.topicRepository = new JsonTopicRepository(dataDir);
    this.topicHistoryRepository = new JsonTopicHistoryRepository(dataDir);
    this.customerRepository = new JsonCustomerRepository(dataDir);
    
    // Initialize facade (anti-corruption layer)
    this.customerFacade = new CustomerFacade(
      this.topicRepository,
      this.topicHistoryRepository,
      this.customerRepository
    );
  }

  public static getInstance(dataDir?: string): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer(dataDir);
    }
    return DependencyContainer.instance;
  }

  public getCustomerFacade(): CustomerFacade {
    return this.customerFacade;
  }

  public getTopicRepository(): TopicRepositoryPort {
    return this.topicRepository;
  }

  public getTopicHistoryRepository(): TopicHistoryRepositoryPort {
    return this.topicHistoryRepository;
  }

  public getCustomerRepository(): CustomerRepositoryPort {
    return this.customerRepository;
  }

  public static reset(): void {
    DependencyContainer.instance = undefined as any;
  }
} 