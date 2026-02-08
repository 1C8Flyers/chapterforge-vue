# ChapterForge Front‑End User Manual

_Last updated: 2026-02-08_

## Who this is for
This guide is for chapter staff using the ChapterForge web app to manage members, renewals, and reports.

---

## Getting Started
1. Open the app in your browser.
2. Sign in with your Google Workspace account (Google sign-in only).
3. Use the left sidebar to navigate between pages.
4. Use the top-right toggle to switch light/dark mode.
5. If you're not authorized to access the app, you'll be redirected to the sign-in page with a clear message.

---

## Authentication & Access Control
- **Google Sign-In**: Only Google Workspace accounts can sign in.
- **Allowlist**: Your admin must add you to the Users list in Settings for access to the app.
- **Session Expiration**: If your session expires or access is revoked, you'll be automatically redirected to sign in again.
- **Clear Error Messages**: Unauthorized access will show a permission message rather than silent failures.

---

## Dashboard
The Dashboard shows key metrics and system status.
- **Total Members**: All members in the database.
- **Active Members**: Members with Status = Active.
- **Households**: Unique household groups.
- **Renewals Needed**: Active members who have not paid for the selected year.
- **System Status**: Database + email service health.

---

## Members
This is the main place to add, edit, and manage members.

### Search & Filter
- Use the search box to find members by name, email, EAA number, or role/activity (e.g., Officer).
- Use the status filter to show Active/Inactive/Deceased.

### Add a Member
1. Click **Add Member**.
2. Fill in required fields (First Name, Last Name, Email, Member Type).
3. Save.

### Edit a Member
1. Click the **Edit** icon on a member row.
2. Update details and save.

### Expand a Member Row
- Click anywhere on a member row to expand and view family members.

### Household Members (Family)
- If a member is **Family**, click the **👥** button to manage household members.
- Household members are stored as separate records with Member Type = Family Member.
- Family members automatically receive a Household ID if one was not set.
- Household member edit hides **Member Type**, **Status**, **Dues**, **Last Paid Year**, and **Payments** because those are tied to the primary member.

### Activities & Info
For each member, you can record:
- Youth Protection Expiration
- Background Check Expiration
- Role and activity flags (configurable in Settings → Member Types)

### Participation History
Inside the member view/edit modal, the **Participation** section lists class/event signups linked to that member. Entries come from custom forms that have **Add signups to Participation** enabled. When the member is in Edit mode, you can delete a participation entry.

### Payments History
Available for primary members (not household members).
- **Add Payment**: Record a new dues payment for a member.
- **Edit Payment**: Click the **Edit** button to modify any payment:
  - Change member assignment (if payment was recorded for wrong member)
  - Update year, amount, and method
  - Edit provider details (Square payment ID, order ID, invoice ID, etc.)
  - Provider fields are optional and useful for tracking Square transactions
- **Delete Payment**: Click the **Delete** button to remove a payment (confirmation required).
- Updating payments automatically updates Last Paid Year and member balance.

### Square Payment Links (optional)
- Renewal emails include a Square payment link when enabled.
- Payment provider IDs are tracked for reconciliation.

---

## Renewals
Use this page to manage renewal emails.

1. Select the year from the dropdown.
2. Review members who need renewal.
3. Send individual emails or use **Send All**.
4. If Square is configured, renewal emails include a payment link with the configured fee.
5. Renewal cards show the last notice sent timestamp when available.
6. Outstanding totals show count and amount due for the selected year.

---

## Square Payment Data
Admin-only page for Square transactions.

- **Transactions tab**: Filter by status, date range, and item name; export CSV.
- **Charts tab**: Top items by revenue for the selected range.
- **Receipts**: Click receipt links when available.
- **Payouts tab**: Bank deposits with payout entries; export entries CSV for reconciliation.

---

## Reports
Use Reports to view and download various reports and visualizations.

### Tabs
- **Charts**: Visual summaries (dues + paid members).
- **Other Reports**: CSV exports of core tables.
- **Spreadsheet**: Editable member/dues grid for quick review.

### Stacked Dues Chart
- **What it shows**: Total dues collected by year, broken down by member type (Family vs Individual vs Unknown).
- **Click to see details**: Click any bar to see breakdown details for that year.
- **Total amount**: Displays total dues above each bar in currency format.

### Paid Members by Year
- **What it shows**: Unique members who paid in each year, broken out by member type.
- **Totals**: Member counts shown above each stacked bar.

### Dues by Member/Year CSV Export
- Download a detailed report of all dues paid, with columns:
  - Member ID, First Name, Last Name, Member Type, Year, Total Paid
- Useful for reconciliation and member-level analysis.

### Table Exports
- Exports available: Members, Member Types, Users, Email Templates.
- Click a report button to download a CSV.
- Members export includes Dues_YYYY columns populated from dues-by-member data.
- Reports page is marked as in active development.

---

## Forms
Manage new member registration responses and settings.

### Responses
- Click a row to expand and view full submission details.
- Use the **Reply** button to email the submitter.
- Custom form responses show session name and assigned roles/activities.
- Use **Filter** to pick a specific form (defaults to **All forms**).
- Click a submitter name to open the member record (when linked).

### Settings
- Enable the New Member Registration form.
- Choose the default member type (e.g., Prospect).
- Set an optional notification email address.
- Copy the embed snippet for your public website.
- Create custom forms with session name, assigned roles/activities, and notification email.
- Slug and Session Name auto-generate from the Form Name (editable).
- Toggle whether a form adds to Participation.
- Copy custom form embed snippets for your public website.

---

## Renewal Payments
Use this page to view and manually record dues payments.

- **Manual entry**: Record a payment for a member with year, amount, and method.
- **Payment history**: Filter by member, provider, or year.
- **Refresh**: Reload the table with the latest data.

---

## Youth Protection
Track Youth Protection and Background Check expirations.
- The top table lists members with certification dates and expiration status.
- The bottom list shows members missing certification dates.

---

## Import
Bulk import members from a CSV file.

### Steps
1. Download the template.
2. Fill in member data.
3. Upload the CSV.

### Notes
- Payments can be imported using `YYYY:amount;YYYY:amount` format.
- Family members should be separate rows with `MemberType=Family Member` and the same `HouseholdID` as the primary member.
- If `MemberType=Family` and HouseholdID is blank, a Household ID will be assigned automatically.

---

## Settings
Manage configuration and email templates.

### Member Types
- Add/edit/delete member types.
- Dues are auto-filled based on type.
- Configure role and activity options used throughout the app.

### Email Template
- Edit the renewal email subject and body.
- Use placeholders like {{FirstName}} and {{Year}}.

### Users
- Admin-only allowlist of users who can access the app.
- Click **Add User** to add an email, role, and optional member link.
- Non-allowlisted users are signed out with a “not authorized” message.

### Scheduled Reports
- Select reports to email, recipients, and schedule.
- Choose date range and status filter.
- Use **Send Report Now** for immediate delivery.

### Google Sheets
- Enable sync, set the Spreadsheet ID, and (optionally) a sheet name prefix.
- Use **Sync Now** to push the latest data on demand.

### Google Groups
- Enable sync and configure mappings of member types/roles/activities to groups.
- Enter an admin email to impersonate for Admin SDK access.
- Use **Sync Now** to run an immediate sync.

---

## Authentication
- Sign in with Google via FirebaseUI.
- Only allowlisted users can access the app (admins in `.env` are always allowed).
- **Admins** can create/update/delete data.
- **Users** have read-only access.

---

## Theme Switcher
Use the top-right toggle to switch between light and dark mode.

---

## Troubleshooting
- **Member types not loading**: Refresh the page and check connectivity.
- **Email not sending**: Verify SMTP settings in `.env`.
- **Import errors**: Ensure CSV headers match the template exactly.

---

## Quick Tips
- Keep member email addresses up to date for renewals.
- Use HouseholdID to group family members.
- Use Reports for periodic backups and audits.
