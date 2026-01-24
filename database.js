const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, 'chapterforge.db');
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  initializeTables() {
    // Ensure tables exist when database is opened
    this.db.serialize(() => {
      this.db.run(`
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
          YouthProtectionExpiration TEXT,
          BackgroundCheckExpiration TEXT,
          YoungEaglePilot INTEGER DEFAULT 0,
          YoungEagleVolunteer INTEGER DEFAULT 0,
          EaglePilot INTEGER DEFAULT 0,
          EagleFlightVolunteer INTEGER DEFAULT 0,
          BoardMember INTEGER DEFAULT 0,
          Officer INTEGER DEFAULT 0,
          RenewalNoticeSentAt DATETIME,
          RenewalNoticeSentYear INTEGER,
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
      
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_household ON members(HouseholdID)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_email ON members(Email)`);

      // Lightweight migrations for new member fields (ignore errors if already exists)
      const addMemberColumn = (name, type) => {
        this.db.run(`ALTER TABLE members ADD COLUMN ${name} ${type}`, [], () => {});
      };
      addMemberColumn('YouthProtectionExpiration', 'TEXT');
      addMemberColumn('BackgroundCheckExpiration', 'TEXT');
      addMemberColumn('YoungEaglePilot', 'INTEGER DEFAULT 0');
      addMemberColumn('YoungEagleVolunteer', 'INTEGER DEFAULT 0');
      addMemberColumn('EaglePilot', 'INTEGER DEFAULT 0');
      addMemberColumn('EagleFlightVolunteer', 'INTEGER DEFAULT 0');
      addMemberColumn('BoardMember', 'INTEGER DEFAULT 0');
      addMemberColumn('Officer', 'INTEGER DEFAULT 0');
      addMemberColumn('RenewalNoticeSentAt', 'DATETIME');
      addMemberColumn('RenewalNoticeSentYear', 'INTEGER');

      // Remove legacy AdditionalFamilyMembers column if present
      this.db.all('PRAGMA table_info(members)', [], (err, columns) => {
        if (err) return;
        const hasAdditionalFamilyMembers = (columns || []).some(col => col.name === 'AdditionalFamilyMembers');
        if (!hasAdditionalFamilyMembers) return;
        this.db.serialize(() => {
          this.db.run('BEGIN TRANSACTION');
          this.db.run(`
            CREATE TABLE IF NOT EXISTS members_new (
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
              YouthProtectionExpiration TEXT,
              BackgroundCheckExpiration TEXT,
              YoungEaglePilot INTEGER DEFAULT 0,
              YoungEagleVolunteer INTEGER DEFAULT 0,
              EaglePilot INTEGER DEFAULT 0,
              EagleFlightVolunteer INTEGER DEFAULT 0,
              BoardMember INTEGER DEFAULT 0,
              Officer INTEGER DEFAULT 0,
              RenewalNoticeSentAt DATETIME,
              RenewalNoticeSentYear INTEGER,
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
          this.db.run(`
            INSERT INTO members_new (
              MemberID, HouseholdID, FirstName, LastName, EAANumber, Phone, Email, MemberType, Status, DuesRate,
              LastPaidYear, AmountDue, InvoiceNeeded, YouthProtectionExpiration, BackgroundCheckExpiration,
              YoungEaglePilot, YoungEagleVolunteer, EaglePilot, EagleFlightVolunteer, BoardMember, Officer,
              RenewalNoticeSentAt, RenewalNoticeSentYear, Notes,
              Dues_2026, Dues_2025, Dues_2024, Dues_2023, Dues_2022, Dues_2021, Dues_2020, Dues_2019, Dues_2018,
              CreatedAt, UpdatedAt
            )
            SELECT
              MemberID, HouseholdID, FirstName, LastName, EAANumber, Phone, Email, MemberType, Status, DuesRate,
              LastPaidYear, AmountDue, InvoiceNeeded, YouthProtectionExpiration, BackgroundCheckExpiration,
              YoungEaglePilot, YoungEagleVolunteer, EaglePilot, EagleFlightVolunteer, BoardMember, Officer,
              RenewalNoticeSentAt, RenewalNoticeSentYear, Notes,
              Dues_2026, Dues_2025, Dues_2024, Dues_2023, Dues_2022, Dues_2021, Dues_2020, Dues_2019, Dues_2018,
              CreatedAt, UpdatedAt
            FROM members
          `);
          this.db.run('DROP TABLE members');
          this.db.run('ALTER TABLE members_new RENAME TO members');
          this.db.run('CREATE INDEX IF NOT EXISTS idx_household ON members(HouseholdID)');
          this.db.run('CREATE INDEX IF NOT EXISTS idx_email ON members(Email)');
          this.db.run('COMMIT');
        });
      });

      this.db.run(`
        CREATE TABLE IF NOT EXISTS member_types (
          MemberTypeID INTEGER PRIMARY KEY AUTOINCREMENT,
          Name TEXT NOT NULL UNIQUE,
          DuesRate REAL DEFAULT 0,
          SortOrder INTEGER DEFAULT 0,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS email_templates (
          TemplateKey TEXT PRIMARY KEY,
          Subject TEXT NOT NULL,
          HtmlBody TEXT NOT NULL,
          UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS user_accounts (
          Uid TEXT PRIMARY KEY,
          Email TEXT UNIQUE NOT NULL,
          DisplayName TEXT,
          Role TEXT DEFAULT 'user',
          MemberID INTEGER,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (MemberID) REFERENCES members(MemberID)
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS user_allowlist (
          Email TEXT PRIMARY KEY,
          Role TEXT DEFAULT 'user',
          MemberID INTEGER,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (MemberID) REFERENCES members(MemberID)
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
          MemberID INTEGER NOT NULL,
          Year INTEGER NOT NULL,
          Amount REAL DEFAULT 0,
          Method TEXT DEFAULT 'manual',
          Provider TEXT DEFAULT 'manual',
          ProviderPaymentId TEXT,
          ProviderOrderId TEXT,
          ProviderInvoiceId TEXT,
          ProviderStatus TEXT,
          ProviderLinkId TEXT,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (MemberID) REFERENCES members(MemberID)
        )
      `);

      this.db.run(`CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(MemberID)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_payments_year ON payments(Year)`);

      const addPaymentColumn = (name, type) => {
        this.db.run(`ALTER TABLE payments ADD COLUMN ${name} ${type}`, [], () => {});
      };
      addPaymentColumn('Provider', "TEXT DEFAULT 'manual'");
      addPaymentColumn('ProviderPaymentId', 'TEXT');
      addPaymentColumn('ProviderOrderId', 'TEXT');
      addPaymentColumn('ProviderInvoiceId', 'TEXT');
      addPaymentColumn('ProviderStatus', 'TEXT');
      addPaymentColumn('ProviderLinkId', 'TEXT');

      // App settings for configurable values (e.g., Square fee)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS app_settings (
          Key TEXT PRIMARY KEY,
          Value TEXT
        )
      `);

      // Normalize legacy manual payments without a ProviderStatus
      // Ensure previously recorded manual payments appear as completed in the UI
      this.db.run(`
        UPDATE payments
        SET ProviderStatus = 'COMPLETED'
        WHERE ProviderStatus IS NULL
          AND (Provider IS NULL OR Provider NOT IN ('square'))
          AND (Method IS NULL OR Method IN ('manual','cash','check','transfer','other'))
      `, [], () => {});

      // Seed common member types if none exist
      this.db.get('SELECT COUNT(*) as count FROM member_types', [], (err, row) => {
        if (err || !row || row.count > 0) return;
        const seed = [
          { Name: 'Individual', DuesRate: 30, SortOrder: 1 },
          { Name: 'Family', DuesRate: 40, SortOrder: 2 },
          { Name: 'Student', DuesRate: 15, SortOrder: 3 }
        ];
        const stmt = this.db.prepare(
          'INSERT INTO member_types (Name, DuesRate, SortOrder) VALUES (?, ?, ?)'
        );
        seed.forEach(s => stmt.run([s.Name, s.DuesRate, s.SortOrder]));
        stmt.finalize();
      });

      // Seed default renewal template if missing
      this.db.get('SELECT COUNT(*) as count FROM email_templates WHERE TemplateKey = ?', ['renewal'], (err, row) => {
        if (err || (row && row.count > 0)) return;
        const defaultSubject = '{{Year}} Membership Renewal - {{ChapterName}}';
        const defaultHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9fafb; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
              .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>{{ChapterName}}</h1>
                <p>Membership Renewal Notice</p>
              </div>
              <div class="content">
                <h2>Dear {{FirstName}} {{LastName}},</h2>
                <p>It's time to renew your membership for {{Year}}!</p>
                <div class="details">
                  <h3>Membership Details</h3>
                  <p><strong>Member:</strong> {{FirstName}} {{LastName}}</p>
                  <p><strong>EAA Number:</strong> {{EAANumber}}</p>
                  <p><strong>Membership Type:</strong> {{MemberType}}</p>
                  <p><strong>Dues Amount:</strong> \${{DuesRate}}</p>
                </div>
                <p>Please submit your renewal payment at your earliest convenience to maintain your active membership status.</p>
                <p>Thank you for your continued support of {{ChapterName}}!</p>
              </div>
              <div class="footer">
                <p>{{ChapterName}}</p>
                <p>{{ChapterEmail}}</p>
              </div>
            </div>
          </body>
          </html>
        `;
        this.db.run(
          'INSERT INTO email_templates (TemplateKey, Subject, HtmlBody) VALUES (?, ?, ?)',
          ['renewal', defaultSubject, defaultHtml.trim()]
        );
      });
    });
  }

  // Get all members
  getAllMembers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM members ORDER BY LastName, FirstName', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get member by ID
  getMemberById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM members WHERE MemberID = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Get members by household
  getHouseholdMembers(householdId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM members WHERE HouseholdID = ? ORDER BY MemberID',
        [householdId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Upsert user account from Firebase auth
  upsertUserAccount({ uid, email, displayName }) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO user_accounts (Uid, Email, DisplayName, UpdatedAt)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(Uid) DO UPDATE SET
          Email = excluded.Email,
          DisplayName = excluded.DisplayName,
          UpdatedAt = CURRENT_TIMESTAMP
      `;
      this.db.run(sql, [uid, email, displayName || null], (err) => {
        if (err) reject(err);
        else resolve({ updated: true });
      });
    });
  }

  getUserAccountByUid(uid) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM user_accounts WHERE Uid = ?', [uid], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  getUserAccountByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM user_accounts WHERE Email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  listUserAccounts() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.*, m.FirstName as MemberFirstName, m.LastName as MemberLastName
        FROM user_accounts u
        LEFT JOIN members m ON u.MemberID = m.MemberID
        ORDER BY u.Email
      `;
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  updateUserAccount(uid, { role, memberId }) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE user_accounts
        SET Role = ?, MemberID = ?, UpdatedAt = CURRENT_TIMESTAMP
        WHERE Uid = ?
      `;
      this.db.run(sql, [role, memberId || null, uid], (err) => {
        if (err) reject(err);
        else resolve({ updated: true });
      });
    });
  }

  removeUserAccount(uid) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM user_accounts WHERE Uid = ?', [uid], (err) => {
        if (err) reject(err);
        else resolve({ deleted: true });
      });
    });
  }

  getUserAllowlistByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM user_allowlist WHERE Email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  listUserAllowlist() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.*, m.FirstName as MemberFirstName, m.LastName as MemberLastName
        FROM user_allowlist u
        LEFT JOIN members m ON u.MemberID = m.MemberID
        ORDER BY u.Email
      `;
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  addUserAllowlist({ email, role = 'user', memberId = null }) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO user_allowlist (Email, Role, MemberID)
        VALUES (?, ?, ?)
        ON CONFLICT(Email) DO UPDATE SET
          Role = excluded.Role,
          MemberID = excluded.MemberID,
          UpdatedAt = CURRENT_TIMESTAMP
      `;
      this.db.run(sql, [email, role, memberId], (err) => {
        if (err) reject(err);
        else resolve({ saved: true });
      });
    });
  }

  updateUserAllowlist(email, { role, memberId }) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE user_allowlist
        SET Role = ?, MemberID = ?, UpdatedAt = CURRENT_TIMESTAMP
        WHERE Email = ?
      `;
      this.db.run(sql, [role, memberId || null, email], (err) => {
        if (err) reject(err);
        else resolve({ updated: true });
      });
    });
  }

  removeUserAllowlist(email) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM user_allowlist WHERE Email = ?', [email], (err) => {
        if (err) reject(err);
        else resolve({ deleted: true });
      });
    });
  }

  // Create new member
  createMember(member) {
    return new Promise((resolve, reject) => {
      const {
        HouseholdID, FirstName, LastName, EAANumber,
        Phone, Email, MemberType, Status, DuesRate, LastPaidYear,
        AmountDue, YouthProtectionExpiration, BackgroundCheckExpiration,
        YoungEaglePilot, YoungEagleVolunteer, EaglePilot, EagleFlightVolunteer,
        BoardMember, Officer, Notes
      } = member;

      const lastPaidYearValue = LastPaidYear !== undefined && LastPaidYear !== null && LastPaidYear !== ''
        ? Number(LastPaidYear)
        : null;

      const sql = `
        INSERT INTO members (
          HouseholdID, FirstName, LastName, EAANumber,
          Phone, Email, MemberType, Status, DuesRate, LastPaidYear,
          AmountDue, YouthProtectionExpiration, BackgroundCheckExpiration,
          YoungEaglePilot, YoungEagleVolunteer, EaglePilot, EagleFlightVolunteer,
          BoardMember, Officer, Notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [HouseholdID, FirstName, LastName, EAANumber,
         Phone, Email, MemberType, Status, DuesRate, lastPaidYearValue,
         AmountDue, YouthProtectionExpiration || null, BackgroundCheckExpiration || null,
         YoungEaglePilot ? 1 : 0, YoungEagleVolunteer ? 1 : 0, EaglePilot ? 1 : 0, EagleFlightVolunteer ? 1 : 0,
         BoardMember ? 1 : 0, Officer ? 1 : 0, Notes],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  // Update member
  updateMember(id, member) {
    return new Promise((resolve, reject) => {
      const {
        HouseholdID, FirstName, LastName, EAANumber,
        Phone, Email, MemberType, Status, DuesRate, LastPaidYear,
        AmountDue, YouthProtectionExpiration, BackgroundCheckExpiration,
        YoungEaglePilot, YoungEagleVolunteer, EaglePilot, EagleFlightVolunteer,
        BoardMember, Officer, Notes
      } = member;

      const lastPaidYearValue = LastPaidYear !== undefined && LastPaidYear !== null && LastPaidYear !== ''
        ? Number(LastPaidYear)
        : null;

      const sql = `
        UPDATE members SET
          HouseholdID = ?, FirstName = ?, LastName = ?,
           EAANumber = ?, Phone = ?, Email = ?, MemberType = ?, Status = ?,
           DuesRate = ?, LastPaidYear = ?, AmountDue = ?,
          YouthProtectionExpiration = ?, BackgroundCheckExpiration = ?,
          YoungEaglePilot = ?, YoungEagleVolunteer = ?, EaglePilot = ?, EagleFlightVolunteer = ?,
          BoardMember = ?, Officer = ?,
          Notes = ?, UpdatedAt = CURRENT_TIMESTAMP
        WHERE MemberID = ?
      `;

      this.db.run(
        sql,
        [HouseholdID, FirstName, LastName, EAANumber,
         Phone, Email, MemberType, Status, DuesRate, lastPaidYearValue,
         AmountDue, YouthProtectionExpiration || null, BackgroundCheckExpiration || null,
         YoungEaglePilot ? 1 : 0, YoungEagleVolunteer ? 1 : 0, EaglePilot ? 1 : 0, EagleFlightVolunteer ? 1 : 0,
         BoardMember ? 1 : 0, Officer ? 1 : 0,
         Notes, id],
        (err) => {
          if (err) reject(err);
          else resolve({ updated: true });
        }
      );
    });
  }

  // Update dues payment
  updateDuesPayment(id, year, amount) {
    return new Promise((resolve, reject) => {
      const insertSql = `
        INSERT INTO payments (MemberID, Year, Amount, Method)
        VALUES (?, ?, ?, 'manual')
      `;
      const updateSql = `
        UPDATE members SET
          LastPaidYear = ?,
          AmountDue = 0,
          UpdatedAt = CURRENT_TIMESTAMP
        WHERE MemberID = ?
      `;

      this.db.run(insertSql, [id, year, amount], (insertErr) => {
        if (insertErr) {
          reject(insertErr);
          return;
        }
        this.db.run(updateSql, [year, id], (updateErr) => {
          if (updateErr) reject(updateErr);
          else resolve({ updated: true });
        });
      });
    });
  }

  // Add payment record
  addPayment(memberId, year, amount, method = 'import', provider = {}) {
    return new Promise((resolve, reject) => {
      const {
        Provider = method,
        ProviderPaymentId = null,
        ProviderOrderId = null,
        ProviderInvoiceId = null,
        ProviderStatus = null,
        ProviderLinkId = null
      } = provider || {};
      const sql = `
        INSERT INTO payments (
          MemberID, Year, Amount, Method,
          Provider, ProviderPaymentId, ProviderOrderId, ProviderInvoiceId, ProviderStatus, ProviderLinkId
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      this.db.run(
        sql,
        [
          memberId,
          year,
          amount,
          method,
          Provider,
          ProviderPaymentId,
          ProviderOrderId,
          ProviderInvoiceId,
          ProviderStatus,
          ProviderLinkId
        ],
        function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  // Update last paid year and clear amount due
  setLastPaidYear(memberId, year) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE members SET
          LastPaidYear = ?,
          AmountDue = 0,
          UpdatedAt = CURRENT_TIMESTAMP
        WHERE MemberID = ?
      `;
      this.db.run(sql, [year, memberId], (err) => {
        if (err) reject(err);
        else resolve({ updated: true });
      });
    });
  }

  // Record renewal notice sent timestamp/year
  recordRenewalNoticeSent(memberId, year) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE members SET
          RenewalNoticeSentAt = CURRENT_TIMESTAMP,
          RenewalNoticeSentYear = ?,
          UpdatedAt = CURRENT_TIMESTAMP
        WHERE MemberID = ?
      `;
      this.db.run(sql, [year, memberId], (err) => {
        if (err) reject(err);
        else resolve({ updated: true });
      });
    });
  }

  // Delete member
  deleteMember(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM members WHERE MemberID = ?', [id], (err) => {
        if (err) reject(err);
        else resolve({ deleted: true });
      });
    });
  }

  // Get all members in a household
  getHouseholdMembers(householdId) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM members WHERE HouseholdID = ? ORDER BY FirstName, LastName', [householdId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Get next HouseholdID
  getNextHouseholdId() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT MAX(HouseholdID) as maxId FROM members', [], (err, row) => {
        if (err) reject(err);
        else resolve((row?.maxId || 0) + 1);
      });
    });
  }

  // Add family member to household
  addFamilyMember(householdId, familyMember) {
    return new Promise((resolve, reject) => {
      const {
        FirstName,
        LastName,
        EAANumber,
        YouthProtectionExpiration,
        BackgroundCheckExpiration,
        YoungEaglePilot,
        YoungEagleVolunteer,
        EaglePilot,
        EagleFlightVolunteer,
        BoardMember,
        Officer
      } = familyMember;
      const sql = `
        INSERT INTO members (
          HouseholdID, FirstName, LastName, EAANumber, MemberType, Status, DuesRate,
          YouthProtectionExpiration, BackgroundCheckExpiration,
          YoungEaglePilot, YoungEagleVolunteer, EaglePilot, EagleFlightVolunteer,
          BoardMember, Officer
        )
        VALUES (?, ?, ?, ?, 'Family Member', 'Active', 0, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      this.db.run(
        sql,
        [
          householdId,
          FirstName,
          LastName,
          EAANumber || null,
          YouthProtectionExpiration || null,
          BackgroundCheckExpiration || null,
          YoungEaglePilot ? 1 : 0,
          YoungEagleVolunteer ? 1 : 0,
          EaglePilot ? 1 : 0,
          EagleFlightVolunteer ? 1 : 0,
          BoardMember ? 1 : 0,
          Officer ? 1 : 0
        ],
        function(err) {
        if (err) reject(err);
        else resolve({
          MemberID: this.lastID,
          HouseholdID: householdId,
          FirstName,
          LastName,
          EAANumber,
          MemberType: 'Family Member',
          Status: 'Active',
          DuesRate: 0,
          YouthProtectionExpiration,
          BackgroundCheckExpiration,
          YoungEaglePilot: YoungEaglePilot ? 1 : 0,
          YoungEagleVolunteer: YoungEagleVolunteer ? 1 : 0,
          EaglePilot: EaglePilot ? 1 : 0,
          EagleFlightVolunteer: EagleFlightVolunteer ? 1 : 0,
          BoardMember: BoardMember ? 1 : 0,
          Officer: Officer ? 1 : 0
        });
      });
    });
  }

  // Remove family member
  removeFamilyMember(memberId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM members WHERE MemberID = ?', [memberId], (err) => {
        if (err) reject(err);
        else resolve({ deleted: true });
      });
    });
  }

  // Get members needing renewal
  getMembersNeedingRenewal(year) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM members 
        WHERE Status = 'Active' 
        AND MemberType != 'Family Member'
        AND (LastPaidYear < ? OR LastPaidYear IS NULL OR LastPaidYear = '')
        AND Email IS NOT NULL AND Email != ''
        ORDER BY LastName, FirstName
      `;

      this.db.all(sql, [year], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get dashboard statistics
  getStatistics() {
    return new Promise((resolve, reject) => {
      const currentYear = new Date().getFullYear();
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        startOfThisMonth.getFullYear(),
        startOfThisMonth.getMonth() - 1,
        1
      );
      const startOfNextMonth = new Date(
        startOfThisMonth.getFullYear(),
        startOfThisMonth.getMonth() + 1,
        1
      );

      const toIso = (d) => new Date(d).toISOString();

      const queries = {
        totalMembers: { sql: 'SELECT COUNT(*) as count FROM members', params: [] },
        activeMembers: { sql: "SELECT COUNT(*) as count FROM members WHERE Status = 'Active'", params: [] },
        households: { sql: 'SELECT COUNT(DISTINCT HouseholdID) as count FROM members WHERE HouseholdID IS NOT NULL', params: [] },
        needingRenewal: { sql: "SELECT COUNT(*) as count FROM members WHERE Status = 'Active' AND MemberType != 'Family Member' AND (LastPaidYear < ? OR LastPaidYear IS NULL)", params: [currentYear] }
      };

      const stats = {};
      let completed = 0;

      Object.keys(queries).forEach(key => {
        const { sql, params } = queries[key];
        console.log(`Query ${key}:`, sql, 'Params:', params);
        this.db.get(sql, params, (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          console.log(`Result ${key}:`, row);
          stats[key] = row.count;
          completed++;
          if (completed === Object.keys(queries).length) {
            // After base stats, compute month-over-month new members
            this.db.get(
              'SELECT COUNT(*) as count FROM members WHERE CreatedAt >= ? AND CreatedAt < ?',
              [toIso(startOfLastMonth), toIso(startOfThisMonth)],
              (err1, row1) => {
                if (err1) {
                  resolve(stats);
                  return;
                }
                const lastMonthNew = row1.count;
                this.db.get(
                  'SELECT COUNT(*) as count FROM members WHERE CreatedAt >= ? AND CreatedAt < ?',
                  [toIso(startOfThisMonth), toIso(startOfNextMonth)],
                  (err2, row2) => {
                    if (err2) {
                      resolve(stats);
                      return;
                    }
                    const thisMonthNew = row2.count;
                    const pct = (lastMonthNew > 0)
                      ? ((thisMonthNew - lastMonthNew) / lastMonthNew) * 100
                      : (thisMonthNew > 0 ? 100 : 0);
                    stats.newMembersThisMonth = thisMonthNew;
                    stats.newMembersLastMonth = lastMonthNew;
                    stats.newMembersPctChange = Number(pct.toFixed(1));

                    // Compute renewal compare to previous year
                    this.db.get(
                      `SELECT COUNT(*) as count FROM members WHERE Status = 'Active' AND (LastPaidYear < ? OR LastPaidYear IS NULL)`,
                      [currentYear - 1],
                      (err3, row3) => {
                        if (err3) {
                          resolve(stats);
                          return;
                        }
                        const prevRenewals = row3.count;
                        const renewPct = (prevRenewals > 0)
                          ? ((stats.needingRenewal - prevRenewals) / prevRenewals) * 100
                          : (stats.needingRenewal > 0 ? 100 : 0);
                        stats.renewalsPrevYear = prevRenewals;
                        stats.renewalsPctChange = Number(renewPct.toFixed(1));
                        resolve(stats);
                      }
                    );
                  }
                );
              }
            );
          }
        });
      });
    });
  }

  close() {
    this.db.close();
  }

  // Monthly new members counts for last 12 months
  getMonthlyNewMembers() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT strftime('%Y-%m', CreatedAt) as ym, COUNT(*) as count
        FROM members
        WHERE CreatedAt >= date('now', '-12 months')
        GROUP BY ym
        ORDER BY ym
      `;
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Monthly active new members for last 12 months
  getMonthlyActiveNewMembers() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT strftime('%Y-%m', CreatedAt) as ym, COUNT(*) as count
        FROM members
        WHERE Status = 'Active' AND CreatedAt >= date('now', '-12 months')
        GROUP BY ym
        ORDER BY ym
      `;
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Member types
  getMemberTypes() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM member_types ORDER BY SortOrder, Name';
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Payments
  getAllPayments() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM payments ORDER BY Year DESC, MemberID';
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  getPaymentsForMember(memberId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM payments WHERE MemberID = ? ORDER BY Year DESC, PaymentID DESC';
      this.db.all(sql, [memberId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  getPaymentById(paymentId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM payments WHERE PaymentID = ?';
      this.db.get(sql, [paymentId], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  getPaymentByProviderPaymentId(providerPaymentId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM payments WHERE ProviderPaymentId = ?';
      this.db.get(sql, [providerPaymentId], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  createPayment(memberId, year, amount, method = 'manual', provider = {}) {
    return new Promise((resolve, reject) => {
      const {
        Provider = method,
        ProviderPaymentId = null,
        ProviderOrderId = null,
        ProviderInvoiceId = null,
        ProviderStatus = null,
        ProviderLinkId = null
      } = provider || {};
      const sql = `
        INSERT INTO payments (
          MemberID, Year, Amount, Method,
          Provider, ProviderPaymentId, ProviderOrderId, ProviderInvoiceId, ProviderStatus, ProviderLinkId
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      this.db.run(
        sql,
        [
          memberId,
          year,
          amount,
          method,
          Provider,
          ProviderPaymentId,
          ProviderOrderId,
          ProviderInvoiceId,
          ProviderStatus,
          ProviderLinkId
        ],
        function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  updatePayment(paymentId, year, amount, method = 'manual', provider = {}) {
    return new Promise((resolve, reject) => {
      const {
        Provider = null,
        ProviderPaymentId = null,
        ProviderOrderId = null,
        ProviderInvoiceId = null,
        ProviderStatus = null,
        ProviderLinkId = null
      } = provider || {};
      const sql = `
        UPDATE payments
        SET Year = ?, Amount = ?, Method = ?,
            Provider = COALESCE(?, Provider),
            ProviderPaymentId = COALESCE(?, ProviderPaymentId),
            ProviderOrderId = COALESCE(?, ProviderOrderId),
            ProviderInvoiceId = COALESCE(?, ProviderInvoiceId),
            ProviderStatus = COALESCE(?, ProviderStatus),
            ProviderLinkId = COALESCE(?, ProviderLinkId)
        WHERE PaymentID = ?
      `;
      this.db.run(
        sql,
        [
          year,
          amount,
          method,
          Provider,
          ProviderPaymentId,
          ProviderOrderId,
          ProviderInvoiceId,
          ProviderStatus,
          ProviderLinkId,
          paymentId
        ],
        (err) => {
        if (err) reject(err);
        else resolve({ updated: true });
      });
    });
  }

  updatePaymentProviderStatus(paymentId, providerStatus) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE payments
        SET ProviderStatus = ?
        WHERE PaymentID = ?
      `;
      this.db.run(sql, [providerStatus, paymentId], (err) => {
        if (err) reject(err);
        else resolve({ updated: true });
      });
    });
  }

  deletePayment(paymentId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM payments WHERE PaymentID = ?', [paymentId], (err) => {
        if (err) reject(err);
        else resolve({ deleted: true });
      });
    });
  }

  refreshMemberPaymentSummary(memberId) {
    return new Promise((resolve, reject) => {
      const maxSql = 'SELECT MAX(Year) as maxYear FROM payments WHERE MemberID = ?';
      this.db.get(maxSql, [memberId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        const maxYear = row?.maxYear || null;
        const currentYear = new Date().getFullYear();
        const shouldClearDue = maxYear && maxYear >= currentYear;
        const updateSql = `
          UPDATE members SET
            LastPaidYear = ?,
            AmountDue = CASE WHEN ? THEN 0 ELSE AmountDue END,
            UpdatedAt = CURRENT_TIMESTAMP
          WHERE MemberID = ?
        `;
        this.db.run(updateSql, [maxYear, shouldClearDue ? 1 : 0, memberId], (updateErr) => {
          if (updateErr) reject(updateErr);
          else resolve({ updated: true, lastPaidYear: maxYear });
        });
      });
    });
  }

  createMemberType(type) {
    return new Promise((resolve, reject) => {
      const { Name, DuesRate = 0, SortOrder = 0 } = type;
      const sql = `
        INSERT INTO member_types (Name, DuesRate, SortOrder)
        VALUES (?, ?, ?)
      `;
      this.db.run(sql, [Name, DuesRate, SortOrder], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  updateMemberType(id, type) {
    return new Promise((resolve, reject) => {
      const { Name, DuesRate = 0, SortOrder = 0 } = type;
      const sql = `
        UPDATE member_types
        SET Name = ?, DuesRate = ?, SortOrder = ?, UpdatedAt = CURRENT_TIMESTAMP
        WHERE MemberTypeID = ?
      `;
      this.db.run(sql, [Name, DuesRate, SortOrder, id], (err) => {
        if (err) reject(err);
        else resolve({ updated: true });
      });
    });
  }

  deleteMemberType(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM member_types WHERE MemberTypeID = ?', [id], (err) => {
        if (err) reject(err);
        else resolve({ deleted: true });
      });
    });
  }

  getEmailTemplate(templateKey) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT Subject, HtmlBody FROM email_templates WHERE TemplateKey = ?', [templateKey], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Generic key-value settings
  getSetting(key, defaultValue = null) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT Value FROM app_settings WHERE Key = ?', [key], (err, row) => {
        if (err) reject(err);
        else resolve(row?.Value ?? defaultValue);
      });
    });
  }

  setSetting(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO app_settings (Key, Value) VALUES (?, ?)
         ON CONFLICT(Key) DO UPDATE SET Value = excluded.Value`,
        [key, value],
        (err) => {
          if (err) reject(err);
          else resolve({ saved: true });
        }
      );
    });
  }

  async getSquareFeeAmount(defaultValue = 1) {
    const stored = await this.getSetting('square_fee_amount', null);
    const envFallback = Number(process.env.SQUARE_FEE_AMOUNT || defaultValue);
    const parsed = stored !== null ? Number(stored) : envFallback;
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  saveEmailTemplate(templateKey, subject, htmlBody) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO email_templates (TemplateKey, Subject, HtmlBody, UpdatedAt)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(TemplateKey) DO UPDATE SET
          Subject = excluded.Subject,
          HtmlBody = excluded.HtmlBody,
          UpdatedAt = CURRENT_TIMESTAMP
      `;
      this.db.run(sql, [templateKey, subject, htmlBody], (err) => {
        if (err) reject(err);
        else resolve({ saved: true });
      });
    });
  }

  checkHealth() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT 1 as ok', [], (err) => {
        if (err) reject(err);
        else resolve({ ok: true });
      });
    });
  }

  // Generic table retrieval for reports
  getAllFromTable(tableName) {
    const validTables = ['members', 'member_types', 'user_allowlist', 'email_templates'];
    if (!validTables.includes(tableName)) {
      return Promise.reject(new Error('Invalid table name'));
    }
    
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  getPaymentsByYearSummary() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT Year, SUM(Amount) as Total
        FROM payments
        GROUP BY Year
        ORDER BY Year
      `;
      this.db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = new Database();
