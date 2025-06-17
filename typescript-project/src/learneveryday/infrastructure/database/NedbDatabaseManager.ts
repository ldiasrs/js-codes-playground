import Datastore from 'nedb';
import * as path from 'path';
import * as fs from 'fs';

export interface DatabaseConfig {
  dataDir: string;
  autoload?: boolean;
  onload?: (error: Error | null) => void;
}

export class NedbDatabaseManager {
  private static instance: NedbDatabaseManager;
  private databases: Map<string, Datastore> = new Map();
  private config: DatabaseConfig;

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.ensureDataDirectory();
  }

  public static getInstance(config?: DatabaseConfig): NedbDatabaseManager {
    if (!NedbDatabaseManager.instance) {
      if (!config) {
        throw new Error('Database configuration is required for first initialization');
      }
      NedbDatabaseManager.instance = new NedbDatabaseManager(config);
    }
    return NedbDatabaseManager.instance;
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }
  }

  public getDatabase(databaseName: string): Datastore {
    if (!this.databases.has(databaseName)) {
      const dbPath = path.join(this.config.dataDir, `${databaseName}.db`);
      
      const datastore = new Datastore({
        filename: dbPath,
        autoload: this.config.autoload ?? true,
        onload: this.config.onload
      });

      this.databases.set(databaseName, datastore);
    }

    return this.databases.get(databaseName)!;
  }

  public getCustomerDatabase(): Datastore {
    return this.getDatabase('customers');
  }

  public getTopicDatabase(): Datastore {
    return this.getDatabase('topics');
  }

  public getTopicHistoryDatabase(): Datastore {
    return this.getDatabase('topic-histories');
  }

  public getScheduledTaskDatabase(): Datastore {
    return this.getDatabase('scheduled-tasks');
  }

  public async closeAll(): Promise<void> {
    // Simply clear the databases map - NeDB will handle persistence automatically
    this.databases.clear();
  }

  public getDataDirectory(): string {
    return this.config.dataDir;
  }

  public static resetInstance(): void {
    if (NedbDatabaseManager.instance) {
      NedbDatabaseManager.instance.closeAll();
      NedbDatabaseManager.instance = undefined as any;
    }
  }
} 