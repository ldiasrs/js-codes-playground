#!/usr/bin/env ts-node

import { Customer, CustomerTier } from '../src/learneveryday/domain/customer/entities/Customer';
import { SQLCustomerRepository } from '../src/learneveryday/infrastructure/adapters/repositories/SQLCustomerRepository';

/**
 * Test script to verify tier functionality
 */
class TierFunctionalityTest {
  private customerRepository: SQLCustomerRepository;

  constructor() {
    this.customerRepository = new SQLCustomerRepository();
  }

  /**
   * Runs all tier functionality tests
   */
  async runTests(): Promise<void> {
    try {
      console.log('🧪 Starting tier functionality tests...\n');

      // Test 1: Create customers with different tiers
      await this.testCreateCustomersWithTiers();

      // Test 2: Query customers by tier
      await this.testQueryByTier();

      // Test 3: Search customers with tier criteria
      await this.testSearchWithTierCriteria();

      // Test 4: Verify default tier behavior
      await this.testDefaultTierBehavior();

      console.log('✅ All tier functionality tests passed!');

    } catch (error) {
      console.error('❌ Tier functionality test failed:', error);
      throw error;
    }
  }

  /**
   * Test creating customers with different tiers
   */
  private async testCreateCustomersWithTiers(): Promise<void> {
    console.log('📝 Test 1: Creating customers with different tiers...');

    // Create customers with different tiers
    const basicCustomer = Customer.createWithCPF(
      'John Basic',
      '12345678901',
      'john.basic@example.com',
      '+1234567890',
      undefined,
      CustomerTier.Basic
    );

    const standardCustomer = Customer.createWithCPF(
      'Jane Standard',
      '98765432109',
      'jane.standard@example.com',
      '+0987654321',
      undefined,
      CustomerTier.Standard
    );

    const premiumCustomer = Customer.createWithCPF(
      'Bob Premium',
      '55566677788',
      'bob.premium@example.com',
      '+1122334455',
      undefined,
      CustomerTier.Premium
    );

    // Save customers
    const savedBasic = await this.customerRepository.save(basicCustomer);
    const savedStandard = await this.customerRepository.save(standardCustomer);
    const savedPremium = await this.customerRepository.save(premiumCustomer);

    console.log(`  ✓ Created Basic customer: ${savedBasic.customerName} (${savedBasic.tier})`);
    console.log(`  ✓ Created Standard customer: ${savedStandard.customerName} (${savedStandard.tier})`);
    console.log(`  ✓ Created Premium customer: ${savedPremium.customerName} (${savedPremium.tier})`);
  }

  /**
   * Test querying customers by tier
   */
  private async testQueryByTier(): Promise<void> {
    console.log('\n🔍 Test 2: Querying customers by tier...');

    const basicCustomers = await this.customerRepository.findByTier('Basic');
    const standardCustomers = await this.customerRepository.findByTier('Standard');
    const premiumCustomers = await this.customerRepository.findByTier('Premium');

    console.log(`  ✓ Found ${basicCustomers.length} Basic customers`);
    console.log(`  ✓ Found ${standardCustomers.length} Standard customers`);
    console.log(`  ✓ Found ${premiumCustomers.length} Premium customers`);

    // Verify tier values
    basicCustomers.forEach(customer => {
      if (customer.tier !== CustomerTier.Basic) {
        throw new Error(`Customer ${customer.customerName} has wrong tier: ${customer.tier}`);
      }
    });

    standardCustomers.forEach(customer => {
      if (customer.tier !== CustomerTier.Standard) {
        throw new Error(`Customer ${customer.customerName} has wrong tier: ${customer.tier}`);
      }
    });

    premiumCustomers.forEach(customer => {
      if (customer.tier !== CustomerTier.Premium) {
        throw new Error(`Customer ${customer.customerName} has wrong tier: ${customer.tier}`);
      }
    });
  }

  /**
   * Test searching customers with tier criteria
   */
  private async testSearchWithTierCriteria(): Promise<void> {
    console.log('\n🔎 Test 3: Searching customers with tier criteria...');

    // Search for Premium customers
    const premiumSearch = await this.customerRepository.search({
      tier: 'Premium'
    });

    console.log(`  ✓ Search for Premium tier returned ${premiumSearch.length} customers`);

    // Search for customers with name containing "John" and Basic tier
    const johnBasicSearch = await this.customerRepository.search({
      customerName: 'John',
      tier: 'Basic'
    });

    console.log(`  ✓ Search for "John" with Basic tier returned ${johnBasicSearch.length} customers`);

    // Verify search results
    premiumSearch.forEach(customer => {
      if (customer.tier !== CustomerTier.Premium) {
        throw new Error(`Search result has wrong tier: ${customer.tier}`);
      }
    });

    johnBasicSearch.forEach(customer => {
      if (customer.tier !== CustomerTier.Basic || !customer.customerName.includes('John')) {
        throw new Error(`Search result doesn't match criteria: ${customer.customerName} (${customer.tier})`);
      }
    });
  }

  /**
   * Test default tier behavior
   */
  private async testDefaultTierBehavior(): Promise<void> {
    console.log('\n⚙️ Test 4: Testing default tier behavior...');

    // Create customer without specifying tier (should default to Basic)
    const defaultCustomer = Customer.createWithCPF(
      'Default User',
      '11122233344',
      'default@example.com',
      '+1555666777'
    );

    const savedDefault = await this.customerRepository.save(defaultCustomer);

    console.log(`  ✓ Default customer tier: ${savedDefault.tier}`);

    if (savedDefault.tier !== CustomerTier.Basic) {
      throw new Error(`Default tier should be Basic, but got: ${savedDefault.tier}`);
    }

    // Test static factory methods with default tier
    const factoryCustomer = Customer.createWithOtherId(
      'Factory User',
      '99988877766',
      'factory@example.com',
      '+1999888777'
    );

    const savedFactory = await this.customerRepository.save(factoryCustomer);

    console.log(`  ✓ Factory customer tier: ${savedFactory.tier}`);

    if (savedFactory.tier !== CustomerTier.Basic) {
      throw new Error(`Factory default tier should be Basic, but got: ${savedFactory.tier}`);
    }
  }

  /**
   * Clean up test data
   */
  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test data...');

    const allCustomers = await this.customerRepository.findAll();
    const testCustomers = allCustomers.filter(customer => 
      customer.customerName.includes('John Basic') ||
      customer.customerName.includes('Jane Standard') ||
      customer.customerName.includes('Bob Premium') ||
      customer.customerName.includes('Default User') ||
      customer.customerName.includes('Factory User')
    );

    for (const customer of testCustomers) {
      if (customer.id) {
        await this.customerRepository.delete(customer.id);
        console.log(`  ✓ Deleted test customer: ${customer.customerName}`);
      }
    }
  }
}

// Execute tests if this script is run directly
if (require.main === module) {
  const test = new TierFunctionalityTest();
  
  test.runTests()
    .then(() => test.cleanup())
    .then(() => {
      console.log('\n🎉 Tier functionality tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Tier functionality tests failed:', error);
      process.exit(1);
    });
}

export { TierFunctionalityTest }; 