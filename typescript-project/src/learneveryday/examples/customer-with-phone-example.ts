import { JsonCustomerRepository } from '../infrastructure/adapters/JsonCustomerRepository';
import { JsonTopicRepository } from '../infrastructure/adapters/JsonTopicRepository';

import { CreateCustomerCommand, CreateCustomerCommandData } from '../application/commands/customer/CreateCustomerCommand';
import { UpdateCustomerCommand, UpdateCustomerCommandData } from '../application/commands/customer/UpdateCustomerCommand';
import { CreateCustomerFeature } from '../domain/customer/features/CreateCustomerFeature';
import { UpdateCustomerFeature } from '../domain/customer/features/UpdateCustomerFeature';

import { CustomerDTO, CustomerDTOMapper } from '../application/dto/CustomerDTO';
import { Customer } from '../domain/customer/entities/Customer';
import { GovIdentificationType } from '../domain/shared/GovIdentification';

async function customerWithPhoneExample() {
  try {
    console.log('🚀 Starting Customer with Phone Number Example...\n');

    // Initialize repositories
    const customerRepository = new JsonCustomerRepository('./data');
    const topicRepository = new JsonTopicRepository('./data');

    // Initialize features
    const createCustomerFeature = new CreateCustomerFeature(customerRepository, topicRepository);
    const updateCustomerFeature = new UpdateCustomerFeature(customerRepository, topicRepository);

    // Example 1: Create customer with CPF, email, and phone
    console.log('📝 Example 1: Creating customer with CPF, email, and phone');
    const createCommandData: CreateCustomerCommandData = {
      customerName: 'João Silva',
      govIdentification: {
        type: 'CPF',
        content: '123.456.789-00'
      },
      email: 'joao.silva@email.com',
      phoneNumber: '+55 11 99999-9999'
    };

    const createCommand = new CreateCustomerCommand(createCommandData, createCustomerFeature);
    const createdCustomer: CustomerDTO = await createCommand.execute();

    console.log('✅ Customer created successfully!');
    console.log('📊 Customer Details:');
    console.log(`- ID: ${createdCustomer.id}`);
    console.log(`- Name: ${createdCustomer.customerName}`);
    console.log(`- Email: ${createdCustomer.email}`);
    console.log(`- Phone: ${createdCustomer.phoneNumber}`);
    console.log(`- Gov ID: ${createdCustomer.govIdentification.type}: ${createdCustomer.govIdentification.content}`);
    console.log(`- Date Created: ${createdCustomer.dateCreated}`);
    console.log(`- Topics: ${createdCustomer.topics.length}`);

    // Example 2: Create customer with other ID type, email, and phone
    console.log('\n📝 Example 2: Creating customer with other ID type, email, and phone');
    const createCommandData2: CreateCustomerCommandData = {
      customerName: 'Maria Santos',
      govIdentification: {
        type: 'OTHER',
        content: 'ABC123456'
      },
      email: 'maria.santos@email.com',
      phoneNumber: '+55 21 88888-8888'
    };

    const createCommand2 = new CreateCustomerCommand(createCommandData2, createCustomerFeature);
    const createdCustomer2: CustomerDTO = await createCommand2.execute();

    console.log('✅ Second customer created successfully!');
    console.log(`- Name: ${createdCustomer2.customerName}`);
    console.log(`- Email: ${createdCustomer2.email}`);
    console.log(`- Phone: ${createdCustomer2.phoneNumber}`);

    // Example 3: Update customer phone number
    console.log('\n📝 Example 3: Updating customer phone number');
    const updateCommandData: UpdateCustomerCommandData = {
      id: createdCustomer.id,
      phoneNumber: '+55 11 98765-4321'
    };

    const updateCommand = new UpdateCustomerCommand(updateCommandData, updateCustomerFeature);
    const updatedCustomer: CustomerDTO = await updateCommand.execute();

    console.log('✅ Customer phone updated successfully!');
    console.log(`- Old Phone: ${createdCustomer.phoneNumber}`);
    console.log(`- New Phone: ${updatedCustomer.phoneNumber}`);

    // Example 4: Update multiple fields including phone
    console.log('\n📝 Example 4: Updating multiple fields including phone');
    const updateCommandData2: UpdateCustomerCommandData = {
      id: createdCustomer2.id,
      customerName: 'Maria Santos Updated',
      email: 'maria.santos.updated@email.com',
      phoneNumber: '+55 21 77777-7777'
    };

    const updateCommand2 = new UpdateCustomerCommand(updateCommandData2, updateCustomerFeature);
    const updatedCustomer2: CustomerDTO = await updateCommand2.execute();

    console.log('✅ Customer updated successfully!');
    console.log(`- Old Name: ${createdCustomer2.customerName}`);
    console.log(`- New Name: ${updatedCustomer2.customerName}`);
    console.log(`- Old Email: ${createdCustomer2.email}`);
    console.log(`- New Email: ${updatedCustomer2.email}`);
    console.log(`- Old Phone: ${createdCustomer2.phoneNumber}`);
    console.log(`- New Phone: ${updatedCustomer2.phoneNumber}`);

    // Example 5: List all customers
    console.log('\n📝 Example 5: Listing all customers');
    const allCustomers = await customerRepository.findAll();
    console.log(`Total customers: ${allCustomers.length}`);
    
    allCustomers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.customerName} (${customer.email}) - ${customer.phoneNumber} - ${customer.getGovIdentificationFormatted()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Example using the Customer entity directly
async function directCustomerEntityExample() {
  try {
    console.log('\n🔧 Direct Customer Entity Example...');

    // Create customer with CPF
    const customer1 = Customer.createWithCPF('Pedro Costa', '987.654.321-00', 'pedro.costa@email.com', '+55 31 66666-6666');
    console.log('✅ Customer with CPF created:');
    console.log(`- Name: ${customer1.customerName}`);
    console.log(`- Email: ${customer1.email}`);
    console.log(`- Phone: ${customer1.phoneNumber}`);
    console.log(`- Gov ID: ${customer1.getGovIdentificationFormatted()}`);

    // Create customer with other ID
    const customer2 = Customer.createWithOtherId('Ana Oliveira', 'XYZ789012', 'ana.oliveira@email.com', '+55 41 55555-5555');
    console.log('\n✅ Customer with other ID created:');
    console.log(`- Name: ${customer2.customerName}`);
    console.log(`- Email: ${customer2.email}`);
    console.log(`- Phone: ${customer2.phoneNumber}`);
    console.log(`- Gov ID: ${customer2.getGovIdentificationFormatted()}`);

    // Create customer with constructor
    const customer3 = new Customer(
      'Carlos Ferreira',
      { type: GovIdentificationType.CPF, content: '111.222.333-44' },
      'carlos.ferreira@email.com',
      '+55 51 44444-4444'
    );
    console.log('\n✅ Customer with constructor created:');
    console.log(`- Name: ${customer3.customerName}`);
    console.log(`- Email: ${customer3.email}`);
    console.log(`- Phone: ${customer3.phoneNumber}`);
    console.log(`- Gov ID: ${customer3.getGovIdentificationFormatted()}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Export functions for use in other files
export { customerWithPhoneExample, directCustomerEntityExample };

// Run example if this file is executed directly
if (require.main === module) {
  customerWithPhoneExample();
} 