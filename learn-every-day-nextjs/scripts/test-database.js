import { DatabaseManager } from "../dist/learneveryday/infrastructure/database/DatabaseManager.js";
import { DatabaseConfiguration } from "../dist/learneveryday/infrastructure/config/database.config.js";

async function testDatabase() {
  try {
    console.log("🧪 Testing Database Setup...\n");

    // Test configuration
    console.log("1. Testing Database Configuration...");
    const config = DatabaseConfiguration.getInstance();
    console.log(`   Database Type: ${config.getType()}`);

    if (config.isSQLite()) {
      const sqliteConfig = config.getSQLiteConfig();
      console.log(`   SQLite Database: ${sqliteConfig.database}`);
      console.log(`   SQLite Data Dir: ${sqliteConfig.dataDir}`);
    } else if (config.isPostgreSQL()) {
      const postgresConfig = config.getPostgreSQLConfig();
      console.log(
        `   PostgreSQL Host: ${postgresConfig.host}:${postgresConfig.port}`
      );
      console.log(`   PostgreSQL Database: ${postgresConfig.database}`);
    }

    // Test database manager
    console.log("\n2. Testing Database Manager...");
    const dbManager = DatabaseManager.getInstance();

    // Test connections
    console.log("   Testing customer table connection...");
    const customerConnection = await dbManager.getConnection("customers");
    console.log("   ✅ Customer table connection successful");

    console.log("   Testing topic table connection...");
    const topicConnection = await dbManager.getConnection("topics");
    console.log("   ✅ Topic table connection successful");

    console.log("   Testing topic_histories table connection...");
    const topicHistoryConnection = await dbManager.getConnection(
      "topic_histories"
    );
    console.log("   ✅ Topic histories table connection successful");

    console.log("   Testing task_processes table connection...");
    const taskProcessConnection = await dbManager.getConnection(
      "task_processes"
    );
    console.log("   ✅ Task processes table connection successful");

    // Test queries
    console.log("\n3. Testing Basic Queries...");

    // Test customer count
    const customerCount = await customerConnection.query(
      "SELECT COUNT(*) as count FROM customers"
    );
    console.log(`   Customer count: ${customerCount[0]?.count || 0}`);

    // Test topic count
    const topicCount = await topicConnection.query(
      "SELECT COUNT(*) as count FROM topics"
    );
    console.log(`   Topic count: ${topicCount[0]?.count || 0}`);

    // Test topic history count
    const topicHistoryCount = await topicHistoryConnection.query(
      "SELECT COUNT(*) as count FROM topic_histories"
    );
    console.log(`   Topic history count: ${topicHistoryCount[0]?.count || 0}`);

    // Test task process count
    const taskProcessCount = await taskProcessConnection.query(
      "SELECT COUNT(*) as count FROM task_processes"
    );
    console.log(`   Task process count: ${taskProcessCount[0]?.count || 0}`);

    console.log("\n✅ Database setup test completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   - Configure your environment variables or config file");
    console.log("   - Run your application tests");
    console.log("   - Check the DATABASE_SETUP.md file for more details");
  } catch (error) {
    console.error("\n❌ Database test failed:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("   - Check your database configuration");
    console.error("   - Ensure database permissions are correct");
    console.error("   - Verify network connectivity (for PostgreSQL)");
    process.exit(1);
  }
}

// Run the test
testDatabase();
