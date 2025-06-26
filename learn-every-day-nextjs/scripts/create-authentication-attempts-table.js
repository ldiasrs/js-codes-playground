const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create the authentication_attempts table
function createAuthenticationAttemptsTable() {
  const dbPath = path.join(__dirname, "../data/authentication_attempts.db");
  const db = new sqlite3.Database(dbPath);

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS authentication_attempts (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      encrypted_verification_code TEXT NOT NULL,
      attempt_date TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    )
  `;

  const createIndexSQL = `
    CREATE INDEX IF NOT EXISTS idx_authentication_attempts_customer_id 
    ON authentication_attempts (customer_id)
  `;

  const createExpiryIndexSQL = `
    CREATE INDEX IF NOT EXISTS idx_authentication_attempts_expires_at 
    ON authentication_attempts (expires_at)
  `;

  const createUsedIndexSQL = `
    CREATE INDEX IF NOT EXISTS idx_authentication_attempts_is_used 
    ON authentication_attempts (is_used)
  `;

  db.serialize(() => {
    console.log("Creating authentication_attempts table...");

    db.run(createTableSQL, (err) => {
      if (err) {
        console.error(
          "Error creating authentication_attempts table:",
          err.message
        );
      } else {
        console.log("✅ authentication_attempts table created successfully");
      }
    });

    db.run(createIndexSQL, (err) => {
      if (err) {
        console.error("Error creating customer_id index:", err.message);
      } else {
        console.log("✅ customer_id index created successfully");
      }
    });

    db.run(createExpiryIndexSQL, (err) => {
      if (err) {
        console.error("Error creating expires_at index:", err.message);
      } else {
        console.log("✅ expires_at index created successfully");
      }
    });

    db.run(createUsedIndexSQL, (err) => {
      if (err) {
        console.error("Error creating is_used index:", err.message);
      } else {
        console.log("✅ is_used index created successfully");
      }
    });
  });

  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    } else {
      console.log("✅ Database connection closed");
      console.log("\n🎉 Authentication attempts table setup completed!");
    }
  });
}

// Run the migration
if (require.main === module) {
  createAuthenticationAttemptsTable();
}

module.exports = { createAuthenticationAttemptsTable };
