# ChapterForge

Professional EAA Chapter Management System - Modern SPA Architecture

**Status**: ✅ Production-ready with Vue 3 + Vite frontend, headless API backend, TailAdmin UI

---

## Overview

ChapterForge is a modern single-page application (SPA) for EAA chapter membership management. Built with a headless architecture using Vue 3 + Vite for the frontend and Express.js API backend, it provides instant navigation, real-time updates, and a seamless user experience.

**Access Control**:
- Only allowlisted users (Settings → Users) can access the API.
- Initial admins listed in `FIREBASE_ADMIN_EMAILS` are always allowed.

**Key Features**:
- ✅ Member CRUD with instant updates (no page reloads)
- ✅ Household management with individual family member records
- ✅ Click-to-expand family members in Members table
- ✅ Firebase Authentication with Admin/User roles
- ✅ Allowlist-based access control (only approved users can access)
- ✅ User management in Settings (roles + member linking)
- ✅ Payments history table with multi-year tracking
- ✅ Square payment links + webhook processing (optional)
- ✅ Configurable member types with dues management
- ✅ Reports export links (CSV)
- ✅ Real-time dashboard with live statistics
- ✅ Email renewal system with WYSIWYG editor (Quill.js)
- ✅ Renewal notice sent tracking
- ✅ Youth Protection status page
- ✅ CSV bulk import with validation
- ✅ TailAdmin layout with dark mode toggle
- ✅ Smooth client-side navigation
- ✅ SQLite database with automatic initialization
- ✅ Hot module replacement in development

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vue 3 (Composition API) + Vite 6.4 |
| **UI Framework** | Tailwind CSS 4.0 + TailAdmin |
| **Backend** | Node.js + Express.js (API-only) |
| **Database** | SQLite3 (file-based, no setup needed) |
| **Routing** | Vue Router 4 (client-side) |
| **Editor** | Quill.js 1.3.7 (WYSIWYG email templates) |
| **Charts** | Chart.js 4.4 (dashboard visualizations) |
| **Icons** | Font Awesome 6.4 |
| **Email** | Nodemailer (SMTP) |
| **Dev Tools** | Concurrently, Nodemon, PostCSS |

---

## System Architecture

### Headless SPA Architecture

**Development Mode**:
- **Frontend**: Vite dev server on `http://localhost:5173`
- **Backend**: Express API server on `http://localhost:3000`
- Vite proxy forwards `/api/*` requests to Express
- Hot module replacement for instant UI updates

**Production Mode**:
- Vue app built to `dist/` folder
- Express serves static `dist/` files + API endpoints
- Single deployment artifact

### Frontend Structure (`src/`)

**Core Files**:
- `main.ts` → Vue app initialization + router
- `App.vue` → Layout shell (sidebar, header, theme toggle)
- `router/index.ts` → Client-side routes
- `index.html` → SPA entry point

**Views** (`src/views/`):
- `Dashboard.vue` → Stats cards (total/active/renewals due/YP expiring)
- `Members.vue` → Member table with search/filter + add/edit modals + payments history
- `Settings.vue` → Member types, email template editor (Quill), and user allowlist
- `Renewals.vue` → Renewal list with year filter + bulk send
- `Reports.vue` → Export links (CSV)

**Features**:
- Reactive data binding (no jQuery)
- Component-based architecture
- Smooth page transitions (Vue Router)
- Dark mode toggle
- Form validation
- API integration with fetch

### Backend Structure

**Express API Routes** (`server.js`):
- `GET /api/members/stats` → Dashboard statistics
- `GET /api/status` → System health (DB + Email)
- `GET /api/members` → All members (JSON)
- `GET /api/members/:id` → Single member
- `GET /api/members/:id/payments` → Payments for a member
- `POST /api/members` → Create member
- `PUT /api/members/:id` → Update member
- `DELETE /api/members/:id` → Delete member
- `POST /api/members/:id/payments` → Create payment
- `PUT /api/payments/:id` → Update payment
- `DELETE /api/payments/:id` → Delete payment
- `GET /api/settings/member-types` → Member types list
- `POST /api/settings/member-types` → Create type
- `PUT /api/settings/member-types/:id` → Update type
- `DELETE /api/settings/member-types/:id` → Delete type
- `GET /api/settings/email-template` → Get template
- `POST /api/settings/email-template` → Save template
- `POST /api/settings/email-template/preview` → Preview template
- `GET /api/renewals?year=YYYY` → Renewals by year
- `POST /api/renewals/send/:id` → Send individual email
- `POST /api/renewals/send-bulk` → Send bulk emails
- `POST /api/members/import` → CSV import
- `GET /api/members/import/template` → Download CSV template
- `GET /api/payments` → Payments list (reports)
- `POST /api/payments/square/link` → Create Square payment link
- `POST /api/payments/square/webhook` → Square webhook receiver
- `GET /api/config` → Chapter name/email config
- `GET /api/reports/:table` → CSV export data (members, member_types, user_allowlist, email_templates)
- `GET /api/users/me` → Current user profile
- `GET /api/users` → Allowlist (admin only)
- `POST /api/users` → Add allowlisted user (admin only)
- `PUT /api/users/:email` → Update allowlisted user (admin only)
- `DELETE /api/users/:email` → Remove allowlisted user (admin only)

**Database Helpers** (`database.js`):
- Member CRUD operations
- Member type management
- Statistics with trends
- Email template storage
- Auto-initialization with seed data

**Email Service** (`emailService.js`):
- Quill-rendered HTML templates
- Placeholder replacement ({{FirstName}}, etc.)
- SMTP configuration
- Bulk sending

---

## Database Schema

### members table
```sql
CREATE TABLE members (
  MemberID INTEGER PRIMARY KEY,
  HouseholdID TEXT,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  EAANumber TEXT,
  Email TEXT,
  Phone TEXT,
  MemberType TEXT DEFAULT 'Individual' REFERENCES member_types(Name),
  Status TEXT DEFAULT 'Active',
  DuesRate REAL,
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
  Dues_2026 REAL, Dues_2025 REAL, ..., Dues_2018 REAL (legacy payment history),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Indexes: HouseholdID, Email
```

### payments table
```sql
CREATE TABLE payments (
  PaymentID INTEGER PRIMARY KEY,
  MemberID INTEGER NOT NULL,
  Year INTEGER NOT NULL,
  Amount REAL DEFAULT 0,
  Method TEXT DEFAULT 'manual',
  Provider TEXT DEFAULT 'manual',
  ProviderPaymentId TEXT,
  ProviderOrderId TEXT,
  ProviderInvoiceId TEXT,
  ProviderStatus TEXT,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Indexes: MemberID, Year
```

### member_types table
```sql
CREATE TABLE member_types (
  MemberTypeID INTEGER PRIMARY KEY,
  Name TEXT UNIQUE NOT NULL,
  DuesRate REAL NOT NULL,
  SortOrder INTEGER,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_allowlist table
```sql
CREATE TABLE user_allowlist (
  Email TEXT PRIMARY KEY,
  Role TEXT DEFAULT 'user',
  MemberID INTEGER,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (MemberID) REFERENCES members(MemberID)
);
```

### user_accounts table
```sql
CREATE TABLE user_accounts (
  Uid TEXT PRIMARY KEY,
  Email TEXT UNIQUE NOT NULL,
  DisplayName TEXT,
  Role TEXT DEFAULT 'user',
  MemberID INTEGER,
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (MemberID) REFERENCES members(MemberID)
);
```

**Seed Data**: Individual ($30), Family ($40), Student ($15)

---

## Installation & Setup

### Prerequisites
- **Node.js** 16+ ([Download](https://nodejs.org/))
- **Email Account** for renewal notices (Gmail, Outlook, etc.)

### Step-by-Step

1. **Clone/navigate to project**
   ```powershell
   cd "c:\Users\jmanr\seadrive_root\Josh\My Libraries\My Library\Code Projects\New - ChapterForge"
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Create `.env` file** (copy from `.env.example`)
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   CHAPTER_NAME=EAA Chapter 123
   CHAPTER_EMAIL=chapter@example.com
  VITE_CHAPTER_NAME=EAA Chapter 123
   PORT=3000
   NODE_ENV=development
   
  # Optional Square payments
  SQUARE_ACCESS_TOKEN=your-square-access-token
  SQUARE_LOCATION_ID=your-square-location-id
  SQUARE_WEBHOOK_SIGNATURE_KEY=your-square-webhook-signature-key
  SQUARE_WEBHOOK_URL=https://your-domain.example.com/api/payments/square/webhook
  SQUARE_ENV=sandbox
  SQUARE_FEE_AMOUNT=1.00

  # Firebase Auth
  VITE_FIREBASE_API_KEY=your-firebase-api-key
  VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your-project-id
  VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
  VITE_FIREBASE_APP_ID=your-app-id
  FIREBASE_SERVICE_ACCOUNT_PATH=./your-service-account.json
  FIREBASE_ALLOWED_DOMAINS=yourdomain.org
  FIREBASE_ADMIN_EMAILS=admin1@yourdomain.org,admin2@yourdomain.org
   ```

   **Gmail Setup**:
   - Enable 2-factor authentication
   - Create [App Password](https://support.google.com/accounts/answer/185833)
   - Use app password in `.env`

   **Outlook/Office365**:
   - Use `smtp.office365.com` for host
   - Port: 587
   - Use full email address as user

  **Allowlist Access**:
  - Initial admins in `FIREBASE_ADMIN_EMAILS` can sign in immediately.
  - Add all other users in **Settings → Users** to allow access.

4. **Development Mode** (recommended)
   ```powershell
   npm run dev
   ```
   - Starts Vite dev server on `http://localhost:5173`
   - Starts Express API on `http://localhost:3000`
   - Hot module replacement enabled
   - Open browser to `http://localhost:5173`

5. **Production Build**
   ```powershell
   npm run build
   ```
   - Builds Vue app to `dist/` folder
   - Compiles Tailwind CSS
   - Ready for deployment

6. **Production Mode**
   ```powershell
   NODE_ENV=production node server.js
   ```
   - Serves built Vue app + API on `http://localhost:3000`
   - Single server for everything
   ```powershell
   npm start
   ```
   Server runs on `http://localhost:3000`

5. **Database auto-initializes** with schema and seed data

---

## Docker Deployment

### Build and Run (Docker)
```powershell
docker build -t chapterforge .
docker run -p 3000:3000 --env-file .env -v ./chapterforge.db:/app/chapterforge.db chapterforge
```

### Docker Compose
```powershell
docker compose up -d --build
```

**Notes**:
- The SQLite database is persisted via a bind mount to [chapterforge.db](chapterforge.db).
- Ensure `.env` is present for SMTP/Square settings.

---

## Authentication (Firebase)

- Frontend uses FirebaseUI for Google sign-in.
- Backend verifies ID tokens via Firebase Admin SDK.
- Access is restricted to allowlisted users (Settings → Users).
- **Admins** are determined by custom claims (`admin` or `role=admin`) or by `FIREBASE_ADMIN_EMAILS`.
- Initial admins in `FIREBASE_ADMIN_EMAILS` are allowed even if not on the allowlist.
- Non-admins are read-only (GET/HEAD) on the API.

---

## Feature Documentation

### 1. Member Management

**Add Member** (`/members`):
- Click blue "Add Member" button → Modal form appears
- Fields: First Name, Last Name, Email, Phone (required)
- Member Type dropdown (populates from Settings)
- Status: Active/Inactive

**Household Members**:
- Edit household members via the 👥 modal
- Household member edit hides Member Type, Status, Dues, Last Paid Year, and Payments (managed by the primary member)
- Status also supports Deceased
- Dues Rate: Auto-populated from selected type
- Family members are individual records linked by HouseholdID
- Notes field for any extra info

**Payments History (edit modal)**:
- Add/edit/delete payment rows per member
- Year, amount, method fields
- Automatically updates Last Paid Year when payments change

**Edit Member** (`/members`):
- Click "Edit" button in table row → Standalone form opens
- All member fields editable
- Member type can be changed (dues updates automatically)
- Family field shows/hides based on new type

**Delete Member**:
- Click trash icon → Confirmation modal
- Removes member and household (if sole member)

**Search**:
- Real-time filter in Members table
- Searches: name, email, phone, EAA number, type, status

### 2. Member Type Configuration

**Settings** (`/settings`):
- View all member types in table
- Each type has: Name, Annual Dues ($), Sort Order
- Modify sort order to change dropdown display order

**Add Type**:
- Click "Add Member Type" button
- Enter name (must be unique), dues amount, sort order
- Used immediately in member forms

**Edit Type**:
- Click pen icon in type row → Modal opens
- Modify name, dues rate, sort order
- Changes apply to all future members and existing dues calculations

**Delete Type**:
- Click trash icon → Confirmation modal
- Removes type (existing members keep their assigned type)

**Example Custom Types**:
- Lifetime ($0) - honorary members
- Corporate ($100) - business members
- Senior ($20) - discounted rate
- Sustaining ($50) - patron members

### 3. Renewals & Dues Tracking

**Track Payments** (`/members`):
- Each member has a Last Paid Year and a payments history table
- "Amount Due" field for accounting
- "Invoice Needed" checkbox for follow-up

**Renewal Notices** (`/renewals`):
- Select year dropdown (defaults to current year)
- Shows all active members who haven't paid that year
- Display member dues amount and family info
- Send button next to each member
- "Send All" button for bulk emails

**Email Renewal** (`/api/renewals/send/:id`):
- Professional HTML template
- Includes chapter name, dues amount, member name
- Sent via configured SMTP account

### 4. CSV Import

**Import Page** (`/members/import`):
- Download CSV template with all field names
- Upload file with new members
- Validates columns match template
- Shows count imported + errors (first 5)

**Template Columns**:
```
FirstName,LastName,Email,Phone,MemberType,Status,DuesRate,
EAANumber,Notes,HouseholdID,
LastPaidYear,AmountDue,InvoiceNeeded,Payments
```

**Payments Format**:
```
YYYY:amount;YYYY:amount
```

**Validation**:
- FirstName, LastName required
- Email unique
- MemberType must exist in Settings
- Status must be Active, Inactive, or Deceased
- Family members should be separate rows with MemberType=Family Member and the same HouseholdID as the primary member
- Errors reported with row number

### 5. Reports

**Reports Page** (`/reports`):
- Full member details with CSV export
- Payments summary column sourced from payments table

### 5. Live Dashboard

**Statistics** (`/`):

| Card | Shows | Delta |
|------|-------|-------|
| **Total Members** | Count of all active + inactive | % change from last month |
| **Active Members** | Count where Status='Active' | % change from last month |
| **Households** | Count of unique HouseholdID | % change from last month |
| **Renewals Needed** | Active members unpaid current year | % change vs. same month last year |

**Charts** (12-month history):
- **New Members**: Count added each month
- **Active New Members**: New members with Status='Active'
- Chart.js with responsive sizing

**Calculations**:
- Deltas compare current month to 30 days ago
- Renewal delta compares current month to same month previous year
- Real aggregations (not simulated data)

---

## API Reference

### Members API

```
GET /api/members
  → Returns all members (JSON array)

GET /api/members/:id
  → Returns one member by MemberID

POST /api/members
  Body: {FirstName, LastName, Email, Phone, MemberType, Status, DuesRate, 
    Notes, HouseholdID, EAANumber}
  → Creates new member, returns {success: true, memberID}

PUT /api/members/:id
  Body: (same as POST, update existing)
  → Updates member

DELETE /api/members/:id
  → Deletes member

POST /api/members/:id/dues
  Body: {year: 2025, amount: 30}
  → Records payment for year

GET /api/members/:id/payments
  → Returns payments for member

POST /api/members/:id/payments
  Body: {Year: 2026, Amount: 40, Method: "manual"}
  → Creates payment

PUT /api/payments/:id
  Body: {Year: 2026, Amount: 40, Method: "manual"}
  → Updates payment

DELETE /api/payments/:id
  → Deletes payment
```

### Settings API

```
GET /api/settings/member-types
  → Returns array of all member types

POST /api/settings/member-types
  Body: {Name: "Lifetime", DuesRate: 0, SortOrder: 5}
  → Creates new type

PUT /api/settings/member-types/:id
  Body: (same as POST)
  → Updates type

DELETE /api/settings/member-types/:id
  → Deletes type
```

### Renewals API

```
POST /api/renewals/send/:id
  → Sends renewal email to member by ID

POST /api/renewals/send-bulk
  Body: {year: 2025, memberIDs: [...]}
  → Sends to multiple members
```

### Statistics API

```
GET /api/stats
  → Returns dashboard stats
  {
    totalMembers: {value, newCount, delta},
    activeMembers: {value, delta},
    households: {value, delta},
    renewalsNeeded: {value, delta}
  }

GET /api/stats/monthly
  → Returns 12-month data
  {
    newMembers: [{month, count}, ...],
    activeNewMembers: [{month, count}, ...],
    renewalDeltas: [{month, delta}, ...]
  }
```

---

## Troubleshooting

### Common Issues

**1. Member type dropdown shows "Loading..."**
- Check browser console (F12 → Console)
- Verify API endpoint `/api/settings/member-types` responds
- Refresh page
- Check server logs for errors

**2. Email not sending**
- Test SMTP credentials in `.env`
- Check email service allows "less secure apps" or use App Password
- Verify CHAPTER_EMAIL is valid
- Check server logs: `npm start` in terminal

**3. Port 3000 already in use**
- Change PORT in `.env` to 3001, 3002, etc.
- Or kill process: `Get-Process node | Stop-Process -Force`

**4. Database issues**
- Delete `chapterforge.db` → Server will reinitialize on restart
- Run `node scripts/initDatabase.js` manually if needed

**5. CSV import fails**
- Ensure column names match exactly (download template)
- Check for extra spaces or hidden characters
- Verify email/EAA number unique (not duplicates in file)
- Try importing one row at a time to identify issue

---

## File Structure

```
ChapterForge/
├── server.js                      # Main Express server
├── database.js                    # SQLite queries & helpers
├── emailService.js                # Nodemailer configuration
├── package.json                   # Dependencies & scripts
├── chapterforge.db                # SQLite database (auto-created)
├── .env                           # Config (email, chapter name, port)
├── .env.example                   # Config template
├── QUICKSTART.md                  # Quick start guide
├── README.md                      # This file
│
├── src/                           # Vue SPA
│   ├── App.vue                    # Shell layout
│   ├── main.js                    # App bootstrap
│   ├── router.js                  # Routes
│   └── views/                     # Pages (Dashboard, Members, Settings, Renewals, Import, Reports)
│
├── scripts/
│   └── initDatabase.js            # Database initialization
│
└── public/                        # Static assets (if any)
    ├── css/                       # Stylesheets
    └── js/                        # Client-side scripts
```

---

## Development Notes

### Code Decisions

1. **Member Type Dropdown**: Fetches from API (`/api/settings/member-types`) every time modal opens to ensure current data
2. **Conditional Family Field**: Shows only for "Family" type; form submit validates required fields per type
3. **Household ID**: Optional text field; family members can share ID for grouped tracking
4. **Status Field**: "Active" vs "Inactive"; filters and renewals only include "Active"
5. **Auto-Fill Dues**: Changes member type → dues auto-fills; can be manually overridden
6. **Dashboard Deltas**: Real calculations comparing same periods; no placeholder data

### Performance Considerations

- Members table limited to 100 per page (potential pagination needed for large chapters)
- Dashboard stats query optimized with indexes on HouseholdID, Email
- Charts load 12 months on-demand (not real-time)
- CSV import processes all rows in one transaction

### Future Enhancements

- Export members to Excel/CSV
- Payment receipts and history
- Dues rate history (track rate changes over time)
- Multi-chapter support
- Role-based access (admin, secretary, finance)
- Payment reminders (auto-send if not renewed by cutoff date)
- Event management and RSVP
- Document uploads per member
- Member photos and directory

---

## Support & Contributing

**Customization**:
- Modify `.env` to change chapter name, email, port
- Update `database.js` seed data to change default member types
- Customize renewal email template in `emailService.js`
- Adjust Tailwind/DaisyUI styling in Vue components

**Issues**:
- Check server logs (terminal output)
- Browser console for client-side errors (F12)
- Review database with SQLite client (VSCode extension)

**Database Backup**:
- Copy `chapterforge.db` file regularly to safe location
- All data stored in this single file (no external dependencies)

---

## License & Credits

Built with:
- **Express.js** - Web framework
- **SQLite3** - Database
- **Vue 3 + Vite** - Frontend
- **Tailwind CSS + DaisyUI** - UI framework
- **Chart.js** - Charts
- **Nodemailer** - Email
- **Font Awesome** - Icons

---

**Ready to manage your chapter!** Start with [QUICKSTART.md](QUICKSTART.md) for first-run setup.
