# ChapterForge Quick Start Guide

## What We've Built

ChapterForge is a modern single-page application (SPA) for EAA Chapter Management with a Vue 3 + Vite frontend and an Express API backend. It uses the TailAdmin layout and Tailwind CSS for a clean, responsive UI.

### ✅ Core Features

1. **Modern SPA Architecture**
   - Vue 3 frontend with Vite dev server
   - Express API-only backend
   - Zero white flash navigation (client-side routing)
   - Hot module replacement in development
   - TailAdmin layout with dark mode toggle

2. **Member Management**
   - Add/edit/delete members with reactive modals
   - Search and filter (instant, no page reload), including role/activity search
   - Split name fields (FirstName, LastName)
   - Family members as individual records linked by HouseholdID
   - Household management modal for Family members
   - Automatic HouseholdID assignment for Family members
   - EAA number, contact info, notes
   - Member types from Settings
   - Status: Active, Inactive, Deceased
   - Payments history with add/edit/delete
   - Click a member row to expand and view family members
   - Configurable role/activity flags include board/officer roles
   - Participation history visible on member records

3. **Member Type Configuration**
   - Settings page with tabbed interface
   - Add/edit/delete member types
   - Each type has name, annual dues, sort order
   - Member forms auto-populate dues
   - Conditional family members field
   - Custom roles and activities managed in Member Types

4. **Email Renewal System**
   - WYSIWYG email template editor (Quill.js)
   - Placeholder insertion ({{FirstName}}, {{Year}}, etc.)
   - Renewals page with year filter
   - Send individual renewal notices
   - Bulk renewal notice sending
   - Professional HTML email templates
   - Optional Square payment link embedded in renewal emails (includes configurable fee)

5. **Square Payment Data (optional)**
   - Transaction list with item details and fees
   - Status + date filters
   - Items chart tab for top revenue items
   - Payouts tab with payout entries and CSV exports

6. **Scheduled Report Emails**
   - Configure recipients, reports, and schedule in Settings
   - “Send Report Now” for immediate delivery

7. **Reports & Charts**
   - Charts tab with dues collected by year (stacked by member type)
   - Paid members by year chart (stacked by member type, totals shown)
   - Other Reports tab for CSV exports
   - Spreadsheet tab for quick editing and dues-by-year view

8. **Google Sheets Sync (optional)**
   - Sync all tables to a Google Sheet
   - Auto-sync on changes or manual “Sync Now”

9. **Google Groups Sync (optional)**
   - Map member types/roles/activities to Google Groups
   - Auto-sync on member changes or manual “Sync Now”

10. **Public Member Signup (optional)**
   - Embed a public signup form on your website
   - Automatic member creation + notification email
   - View responses and reply from the Forms page

11. **Ground School Signup (optional)**
   - Separate public Ground School form with session name
   - Assign roles/activities on signup
   - View responses and reply from the Forms page

11. **CSV Import**
   - Drag-and-drop CSV upload
   - Download template CSV
   - Bulk upload with validation
   - Error reporting per row

9. **Live Dashboard**
   - Real-time stats: Total members, Active members, Renewals due, Youth Protection expiring
   - System status (Database + Email health)
   - Quick action buttons
   - Modern card-based design

## Setup Instructions

### Prerequisites
- Node.js 16+ installed
- Email account for renewal notices (Gmail, Outlook, etc.)

### Installation

1. **Navigate to project**
   ```powershell
   cd "c:\Users\jmanr\seadrive_root\Josh\My Libraries\My Library\Code Projects\New - ChapterForge"
   ```

   ## GitHub & Deployment

   ### Repository
   **Code**: [github.com/1C8Flyers/chapterforge-vue](https://github.com/1C8Flyers/chapterforge-vue)

   ### Deployment Options

   **Local Development** (this machine):
   ```powershell
   npm run dev
   ```

   **Docker (Local Testing)**:
   ```powershell
   docker compose up -d --build
   ```

   **Production Server** (Docker):
   See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions
   ```bash
   git clone https://github.com/1C8Flyers/chapterforge-vue.git
   cd chapterforge-vue
   docker compose up -d --build
   ```

   **Access**: https://chapterforge.eaa22.org (once deployed)

   ---

   ## Local Setup Instructions

   ### Prerequisites
   - Node.js 16+ installed
   - Email account for renewal notices (Gmail, Outlook, etc.)
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
   # Processing fee configured in Settings → Payment Settings

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

   # Google Sheets Sync (optional)
   GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
   # Or use a file path:
   # GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH=./google-service-account.json
   ```
   - For Gmail: Use [App Password](https://support.google.com/accounts/answer/185833)

4. **Start development servers**
   ```powershell
   npm run dev
   ```
   - Vite dev server: `http://localhost:5173` (or next available port)
   - Express API: `http://localhost:3000`

5. **Open browser**
   ```
   http://localhost:5173
   ```

Database initializes automatically with seed member types (Individual, Family, Student).

### Allowlist Access Control
Only users explicitly added in **Settings → Users** can access the API, except for initial admins listed in `FIREBASE_ADMIN_EMAILS`.
1. Sign in as an admin listed in `FIREBASE_ADMIN_EMAILS`.
2. Go to **Settings → Users** and add allowed users.
3. Those users can then sign in.

### Docker Deployment

```powershell
docker compose up -d --build
```

This runs the production build on `http://localhost:3000` and persists the SQLite DB via a bind mount.

## Using the Application

### Dashboard (`/`)
 - **Statistics Cards**: Total members, active members, renewals due, YP expiring
- **Quick Actions**: Navigate to members, renewals, import, settings
- **Chapter Info**: Chapter details and member counts
- **System Status**: Database and email service health

### Members (`/members`)
- **Table**: All members with instant search and filter
- **Search**: Real-time filter by name, email, EAA number, role/activity (no page reload)
- **Status Filter**: Active/Inactive/Deceased dropdown (instant filtering)
- **Add Member Button**: Opens reactive modal with:
  - First name, last name, email, phone
  - Member type dropdown (from Settings)
   - Status (Active/Inactive/Deceased)
  - Dues rate (auto-populated from selected type)
  - Notes
  - Save (instant update, no page reload)
- **Edit Button**: Opens same modal pre-filled with member data
- **Delete Button**: Removes member with confirmation (instant update)
- **Payments History** (edit modal): add/edit/delete Year, Amount, Method entries
- **Household Members**: Use the 👥 button on Family members to manage household records
   - Household member edit hides Member Type, Status, Dues, Last Paid Year, and Payments
- **Row Expand**: Click a member row to expand and view family members
- **Activities**: Activity badges show roles like YE Pilot, Eagle Pilot, Board, Officer

### Settings (`/settings`)
**Member Types Tab**:
- View all member types with dues and sort order
- Click "+ Add Type" to create new type
- Edit/delete existing types with modals
- Changes apply immediately to member forms (reactive)

**Email Template Tab**:
- Edit email subject line
- WYSIWYG editor (Quill.js) for email body
- Insert placeholders: {{FirstName}}, {{Year}}, {{DuesRate}}, etc.
- Save template button
- Refresh button to reload from database

**Users Tab**:
- Admin-only allowlist of users who can access the app
- Add users by email, assign role, and optionally link to a member

**Scheduled Reports Tab**:
- Select reports to email, recipients, and schedule
- Configure date range + status filter
- Use **Send Report Now** to email instantly

### Authentication
- Sign in using Google via FirebaseUI.
- Only allowlisted users can access the app (admins in `.env` are always allowed).
- Admins can create/update/delete; Users are read-only.

### Renewals (`/renewals`)
- **Year Selector**: Choose which year to process renewals (instant update)
- **Member Cards**: Shows all active members who haven't paid for selected year
- **Send Button**: Send individual renewal email
- **Send All Button**: Bulk email to all members needing renewal
- Shows member dues amount, last paid year, family info
- Email uses Quill-rendered HTML template with placeholders
- If Square is configured, renewal emails include a payment link with the configured fee
- Renewal cards show the last notice sent timestamp when available

### Square Payment Data (`/square-analytics`)
- **Transactions**: Filter by status, date range, and item name
- **Charts**: Top items by revenue for the selected range
- **Export**: Download CSV for the filtered list

### Reports (`/reports`)
- Export CSVs for Members, Member Types, Users, and Email Templates.
- Click an export button to download a CSV.
- Dues by member/year CSV export available.
- Reports page is marked as in active development.

### Forms (`/forms`)
- **Responses**: Click a row to expand full details.
- **Reply**: Send a response email directly from the list.
- **Settings tab**: Enable the public signup form, set the default member type, and copy the embed snippet.

### Import (`/import`)
- **Download Template**: Get CSV format with all required fields
- **Upload CSV**: Drag-and-drop or file select
- **Results**: Shows count imported and any errors (first 5 listed)
- **Supported Fields**: FirstName, LastName, Email, Phone, MemberType, Status, DuesRate, EAANumber, Notes, HouseholdID, LastPaidYear, AmountDue, InvoiceNeeded, YouthProtectionExpiration, BackgroundCheckExpiration, YoungEaglePilot, YoungEagleVolunteer, EaglePilot, EagleFlightVolunteer, BoardMember, Officer, Payments
- **Payments Format**: `YYYY:amount;YYYY:amount` (example: `2026:40;2025:40`)
- **Family Members**: Add separate rows with `MemberType=Family Member` and the same `HouseholdID` as the primary member.

### Theme Switching
- Use the top-right toggle to switch between light and dark mode.

## Database Schema

### members table
```
MemberID (PRIMARY KEY)
HouseholdID (for family grouping)
FirstName, LastName
EAANumber, Phone, Email
MemberType (foreign key -> member_types.Name)
Status (Active/Inactive/Deceased)
DuesRate (annual)
LastPaidYear (integer)
AmountDue (decimal)
InvoiceNeeded (0/1)
YouthProtectionExpiration, BackgroundCheckExpiration
YoungEaglePilot, YoungEagleVolunteer, EaglePilot, EagleFlightVolunteer, BoardMember, Officer (0/1)
RenewalNoticeSentAt, RenewalNoticeSentYear
Notes (text)
Dues_2026, Dues_2025, ..., Dues_2018 (legacy payment history)
CreatedAt, UpdatedAt (timestamps)
Indexes: HouseholdID, Email
```

### payments table
```
PaymentID (PRIMARY KEY)
MemberID (foreign key -> members.MemberID)
Year (integer)
Amount (decimal)
Method (manual, square, etc.)
CreatedAt (timestamp)
Indexes: MemberID, Year
```

### member_types table
```
MemberTypeID (PRIMARY KEY)
Name (UNIQUE - Individual, Family, Student, etc.)
DuesRate (annual $)
SortOrder (display order)
CreatedAt, UpdatedAt
```

## API Endpoints

**Members API**:
- `GET /api/members` - List all
- `GET /api/members/:id` - Get one
- `GET /api/members/:id/payments` - Payments for a member
- `POST /api/members` - Create
- `PUT /api/members/:id` - Update
- `DELETE /api/members/:id` - Delete
- `POST /api/members/:id/dues` - Record payment
- `POST /api/members/:id/payments` - Create payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

**Renewals API**:
- `POST /api/renewals/send/:id` - Send to one member
- `POST /api/renewals/send-bulk` - Bulk send

**Statistics API**:
- `GET /api/stats` - Current dashboard stats
- `GET /api/stats/monthly` - 12-month trends

**Settings API**:
- `GET /api/settings/member-types` - List types
- `POST /api/settings/member-types` - Create type
- `PUT /api/settings/member-types/:id` - Update type
- `DELETE /api/settings/member-types/:id` - Delete type

## File Structure

```
ChapterForge/
├── server.js                 # Express server, routes
├── database.js               # SQLite operations & queries
├── emailService.js           # Nodemailer renewal emails
├── package.json              # Dependencies
├── chapterforge.db           # SQLite database (auto-created)
├── .env                      # Configuration (git-ignored)
├── .env.example              # Template
├── setup.ps1                 # PowerShell setup helper
├── add-sample-data.ps1       # Load sample members
├── QUICKSTART.md             # This file
├── README.md                 # Full documentation
├── Dockerfile                # Docker build
├── docker-compose.yml        # Docker run config
├── .dockerignore             # Docker ignore rules
├── scripts/
│   └── initDatabase.js       # DB initialization
└── src/
   ├── App.vue               # SPA shell
   ├── main.ts               # Bootstrap
   ├── router/               # Routes
   └── views/                # Dashboard, Members, Settings, Renewals, Import, Reports
```

## Tips

1. **Family Memberships**: Create Family members as individual records and group them with the same HouseholdID.
2. **Household IDs**: Use the 👥 household modal on Family members to manage linked records.
3. **Member Types**: Customize in Settings—add types like "Lifetime", "Honorary", "Corporate" with their own dues amounts.
4. **Email Testing**: Send one renewal first to verify SMTP settings work before bulk sending.
5. **Import**: Use the template download to ensure column names match exactly.
6. **Backup**: Regularly copy `chapterforge.db` file for safety.

## Troubleshooting

**Member type field shows "Loading..."**
- Check browser console for errors
- Ensure `/api/settings/member-types` endpoint is working
- Refresh the page

**Renewals not sending**
- Check `.env` SMTP credentials
- Verify email account allows app access
- Check server logs for detailed error

**Database errors**
- Delete `chapterforge.db` and restart (re-initializes)
- Run: `npm run init-db` if available

**Port 3000 already in use**
- Change PORT in `.env`
- Or: `Get-Process node | Stop-Process -Force` (PowerShell)

## Next Steps

Extensions you can add:
- Export members to CSV/Excel
- Payment receipts and tracking
- Event management
- Member photos
- Advanced filtering and reporting
- Multi-chapter support
- Newsletter feature

---

**Ready to use!** Customize member types in Settings, add your members, and start managing renewals.
