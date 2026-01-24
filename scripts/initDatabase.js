const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'chapterforge.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
db.serialize(() => {
  // Members table
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      MemberID INTEGER PRIMARY KEY AUTOINCREMENT,
      HouseholdID INTEGER,
      FirstName TEXT NOT NULL,
      LastName TEXT NOT NULL,
      EAANumber TEXT,
      Phone TEXT,
      Email TEXT,
      MemberType TEXT DEFAULT 'Individual',
      Status TEXT DEFAULT 'Active',
      DuesRate REAL DEFAULT 0,
      LastPaidYear INTEGER,
      AmountDue REAL DEFAULT 0,
      InvoiceNeeded INTEGER DEFAULT 0,
      Notes TEXT,
      Dues_2026 REAL DEFAULT 0,
      Dues_2025 REAL DEFAULT 0,
      Dues_2024 REAL DEFAULT 0,
      Dues_2023 REAL DEFAULT 0,
      Dues_2022 REAL DEFAULT 0,
      Dues_2021 REAL DEFAULT 0,
      Dues_2020 REAL DEFAULT 0,
      Dues_2019 REAL DEFAULT 0,
      Dues_2018 REAL DEFAULT 0,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index on household for faster lookups
  db.run(`CREATE INDEX IF NOT EXISTS idx_household ON members(HouseholdID)`);
  
  // Create index on email for faster searches
  db.run(`CREATE INDEX IF NOT EXISTS idx_email ON members(Email)`);

  // Payments table (year-agnostic dues history)
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
      MemberID INTEGER NOT NULL,
      Year INTEGER NOT NULL,
      Amount REAL DEFAULT 0,
      Method TEXT DEFAULT 'manual',
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (MemberID) REFERENCES members(MemberID)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(MemberID)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_year ON payments(Year)`);

  console.log('Database initialized successfully!');
  console.log('Database location:', dbPath);
});

db.close();
