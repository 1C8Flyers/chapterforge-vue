# ChapterForge Front‑End User Manual

_Last updated: 2026-01-24_

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
- Use the search box to find members by name, email, or EAA number.
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
- Household member edit hides **Member Type**, **Status**, **Dues**, **Last Paid Year**, and **Payments** because those are tied to the primary member.

### Activities & Info
For each member, you can record:
- Youth Protection Expiration
- Background Check Expiration
- Young Eagle Pilot
- Young Eagle Volunteer
- Eagle Pilot
- Eagle Flight Volunteer
- Board Member
- Officer

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

---

## Reports
Use Reports to view and download various reports and visualizations.

### Stacked Dues Chart
- **What it shows**: Total dues collected by year, broken down by member type (Family vs Individual vs Unknown).
- **Click to see details**: Click any bar to see breakdown details for that year.
- **Total amount**: Displays total dues above each bar in currency format.

### Dues by Member/Year CSV Export
- Download a detailed report of all dues paid, with columns:
  - Member ID, First Name, Last Name, Member Type, Year, Total Paid
- Useful for reconciliation and member-level analysis.

### Table Exports
- Exports available: Members, Member Types, Users, Email Templates.
- Click a report button to download a CSV.

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

---

## Settings
Manage configuration and email templates.

### Member Types
- Add/edit/delete member types.
- Dues are auto-filled based on type.

### Email Template
- Edit the renewal email subject and body.
- Use placeholders like {{FirstName}} and {{Year}}.

### Users
- Admin-only allowlist of users who can access the app.
- Click **Add User** to add an email, role, and optional member link.
- Non-allowlisted users are signed out with a “not authorized” message.

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
