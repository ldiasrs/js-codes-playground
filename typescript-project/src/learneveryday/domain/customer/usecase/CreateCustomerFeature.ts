import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Customer } from '../entities/Customer';
import { CustomerRepositoryPort } from '../ports/CustomerRepositoryPort';
import { TopicRepositoryPort } from '../../topic/ports/TopicRepositoryPort';
import { TaskProcessRepositoryPort } from '../../taskprocess/ports/TaskProcessRepositoryPort';
import { TaskProcess } from '../../taskprocess/entities/TaskProcess';
import { TYPES } from '../../../infrastructure/di/types';

export interface CreateCustomerFeatureData {
  customerName: string;
  govIdentification: {
    type: string;
    content: string;
  };
  email: string;
  phoneNumber: string;
}

@injectable()
export class CreateCustomerFeature {
  constructor(
    @inject(TYPES.CustomerRepository) private readonly customerRepository: CustomerRepositoryPort,
    @inject(TYPES.TopicRepository) private readonly topicRepository: TopicRepositoryPort,
    @inject(TYPES.TaskProcessRepository) private readonly taskProcessRepository: TaskProcessRepositoryPort
  ) {}

  /**
   * Executes the CreateCustomer feature
   * @param data The data containing customerName, govIdentification, email, and phoneNumber
   * @returns Promise<Customer> The created customer
   * @throws Error if customer creation fails
   */
  async execute(data: CreateCustomerFeatureData): Promise<Customer> {
    const { customerName, govIdentification, email, phoneNumber } = data;

    // Step 1: Create customer based on identification type
    let customer: Customer;
    if (govIdentification.type === 'CPF') {
      customer = Customer.createWithCPF(customerName, govIdentification.content, email, phoneNumber);
    } else {
      customer = Customer.createWithOtherId(customerName, govIdentification.content, email, phoneNumber);
    }

    // Step 2: Save the customer
    const savedCustomer = await this.customerRepository.save(customer);

    // Step 3: Create a TaskProcess for scheduling topic history generation
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes()); 
    
    const scheduleTaskProcess = new TaskProcess(
      savedCustomer.id, // Use the customer ID as entityId
      savedCustomer.id, // Use the customer ID as customerId
      'schedule-generation-topic-history',
      'pending',
      undefined, // id will be auto-generated
      undefined, // errorMsg
      scheduledTime // scheduledTo
    );

    // Step 4: Save the task process
    await this.taskProcessRepository.save(scheduleTaskProcess);

    console.log(`Created customer ${savedCustomer.id} and scheduled topic history generation task: ${scheduleTaskProcess.id} for: ${scheduledTime.toISOString()}`);

    return savedCustomer;
  }
} 