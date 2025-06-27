#!/usr/bin/env ts-node

import { DatabaseManager } from '../src/learneveryday/infrastructure/database/DatabaseManager';
import { DatabaseConfiguration } from '../src/learneveryday/infrastructure/config/database.config';

interface DatabaseConnection {
  query(sql: string, params?: unknown[]): Promise<unknown>;
}

interface QueryResult {
  changes?: number;
}

interface TierDistributionRow {
  tier: string;
  count: number;
}

/**
 * Migration script to add tier column to existing customers
 * This script will:
 * 1. Add the tier column to the customers table if it doesn't exist
 * 2. Set all existing customers to 'Basic' tier
 * 3. Create the tier index for better query performance
 */
class TierMigration {
  private dbManager: DatabaseManager;
  private config: DatabaseConfiguration;

  constructor() {
    this.config = DatabaseConfiguration.getInstance();
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * Executes the tier migration
   */
  async executeMigration(): Promise<void> {
    try {
      console.log('🚀 Starting tier migration...');

      const connection = await this.dbManager.getConnection('customers') as DatabaseConnection;

      // Step 1: Check if tier column already exists
      const hasTierColumn = await this.checkIfTierColumnExists(connection);
      
      if (hasTierColumn) {
        console.log('✅ Tier column already exists, skipping migration');
        return;
      }

      // Step 2: Add tier column to customers table
      console.log('📋 Adding tier column to customers table...');
      await this.addTierColumn(connection);

      // Step 3: Set all existing customers to Basic tier
      console.log('🔄 Setting existing customers to Basic tier...');
      await this.setExistingCustomersToBasic(connection);

      // Step 4: Create tier index
      console.log('🔍 Creating tier index...');
      await this.createTierIndex(connection);

      console.log('✅ Tier migration completed successfully!');

    } catch (error) {
      console.error('❌ Tier migration failed:', error);
      throw error;
    }
  }

  /**
   * Checks if the tier column already exists in the customers table
   */
  private async checkIfTierColumnExists(connection: DatabaseConnection): Promise<boolean> {
    try {
      // Try to query the tier column
      await connection.query('SELECT tier FROM customers LIMIT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Adds the tier column to the customers table
   */
  private async addTierColumn(connection: DatabaseConnection): Promise<void> {
    const sql = 'ALTER TABLE customers ADD COLUMN tier TEXT NOT NULL DEFAULT \'Basic\'';
    await connection.query(sql);
    console.log('✓ Tier column added to customers table');
  }

  /**
   * Sets all existing customers to Basic tier
   */
  private async setExistingCustomersToBasic(connection: DatabaseConnection): Promise<void> {
    const sql = 'UPDATE customers SET tier = \'Basic\' WHERE tier IS NULL OR tier = \'\'';
    const result = await connection.query(sql) as QueryResult;
    console.log(`✓ Updated ${result.changes || 0} customers to Basic tier`);
  }

  /**
   * Creates the tier index for better query performance
   */
  private async createTierIndex(connection: DatabaseConnection): Promise<void> {
    const sql = 'CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier)';
    await connection.query(sql);
    console.log('✓ Tier index created');
  }

  /**
   * Verifies the migration was successful
   */
  async verifyMigration(): Promise<void> {
    try {
      console.log('🔍 Verifying migration...');
      
      const connection = await this.dbManager.getConnection('customers') as DatabaseConnection;
      
      // Check if tier column exists
      const hasTierColumn = await this.checkIfTierColumnExists(connection);
      if (!hasTierColumn) {
        throw new Error('Tier column does not exist after migration');
      }

      // Check if all customers have a tier value
      const result = await connection.query('SELECT COUNT(*) as count FROM customers WHERE tier IS NULL OR tier = \'\'') as { count: number }[];
      const nullTierCount = result[0]?.count || 0;
      
      if (nullTierCount > 0) {
        throw new Error(`Found ${nullTierCount} customers without tier value`);
      }

      // Check tier distribution
      const tierDistribution = await connection.query('SELECT tier, COUNT(*) as count FROM customers GROUP BY tier') as TierDistributionRow[];
      console.log('📊 Tier distribution:');
      tierDistribution.forEach((row: TierDistributionRow) => {
        console.log(`  - ${row.tier}: ${row.count} customers`);
      });

      console.log('✅ Migration verification completed successfully!');

    } catch (error) {
      console.error('❌ Migration verification failed:', error);
      throw error;
    }
  }
}

// Execute migration if this script is run directly
if (require.main === module) {
  const migration = new TierMigration();
  
  migration.executeMigration()
    .then(() => migration.verifyMigration())
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { TierMigration }; 