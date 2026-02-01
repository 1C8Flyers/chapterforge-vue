# Square Payments Integration Plan (Implemented)

_Last updated: 2026-01-31_

## Goals
- Accept payments via Square (card + optionally ACH) for membership dues.
- Record payment history in the existing `payments` table.
- Keep renewals and reports consistent with payment history.
- Minimize operational friction for admins.

## Assumptions
- Current stack: Vue 3 + Vite SPA, Express API, SQLite.
- Payment history lives in `payments` table and drives `LastPaidYear`.
- Firebase Auth is required; Admins can trigger payments.

## Scope (Phase 1)
- **Payment links**: Generated as part of renewal emails (admin-triggered).
- **Webhook processing**: Square → backend records payment + updates `LastPaidYear`.
- **Basic reconciliation**: Map Square payment/order to a member.

## Non-goals (Phase 1)
- Customer portal for self-service.
- Refunds/chargebacks automation.
- Membership auto-renewal subscriptions.

---

## Architecture Overview
1. **Frontend**
   - Renewals: emails include payment link (no payment link button in UI).

2. **Backend (Express)**
   - Create payment link or invoice via Square API.
   - Store Square metadata (paymentId, orderId, invoiceId) in `payments` or a companion table.
   - Receive webhooks to mark payments as completed.

3. **Database**
   - Existing `payments` table stores `Year`, `Amount`, `Method`.
   - Add optional metadata fields for Square correlation.

---

## Data Model Changes
### Option A (Lightweight)
Add columns to `payments`:
- `Provider` (TEXT, default `manual`)
- `ProviderPaymentId` (TEXT)
- `ProviderOrderId` (TEXT)
- `ProviderInvoiceId` (TEXT)
- `ProviderStatus` (TEXT)

### Option B (Normalized)
Create `payment_providers` table with foreign key to `payments`.

> Recommendation: Option A for speed and simplicity.

---

## Backend API (Implemented)
### Create Payment Link
`POST /api/payments/square/link`
Body:
```
{
  "memberId": 123,
  "year": 2026,
  "amount": 40,
  "description": "2026 Membership Dues"
}
```
Response:
```
{
  "paymentLinkUrl": "https://square.link/u/...",
  "square": { "orderId": "...", "paymentLinkId": "..." }
}
```

### Webhook Endpoint
`POST /api/payments/square/webhook`
- Verify signature.
- Handle `payment.updated`, `invoice.paid`, or `payment.created`.
- Create or update `payments` record.
- Call `refreshMemberPaymentSummary(memberId)`.

---

## Frontend UX (Implemented)
- Renewal emails include payment link with configured fee.
- No payment link button on Members or Renewals pages.

---

## Security & Config
- Store Square credentials in `.env`:
   - `SQUARE_ACCESS_TOKEN`
   - `SQUARE_LOCATION_ID`
   - `SQUARE_WEBHOOK_SIGNATURE_KEY`
   - `SQUARE_WEBHOOK_URL`
   - `SQUARE_ENV` (sandbox or production)
- Fee amount configured in Settings → Payment Settings (no longer in .env)
- Never expose tokens to client.

---

## Implementation Steps
1. Provider metadata columns added to `payments`.
2. `squareService.js` wrapper for Square SDK.
3. API endpoints:
   - `POST /api/payments/square/link`
   - `POST /api/payments/square/webhook`
4. UI:
   - Renewal emails include payment link
5. Webhooks map to `payments` entries and refresh member summary.
6. Docs + operational checklist.

---

## Testing Checklist
- Create link, pay with test card, webhook updates `payments`.
- Duplicate webhook events handled idempotently.
- Payment linked to correct `MemberID`.
- Reports show payment in history.

---

## Recent Enhancements (January 2026)
- ✅ **Dues/Fee Separation**: Payments now split into DuesAmount and SquareFee columns
- ✅ **Fee Configuration**: Processing fee now managed in Settings → Payment Settings (not .env)
- ✅ **Dues Chart Alignment**: Reports "Dues collected by year" aligns with exports (uses payment amounts)
- ✅ **Square Payment Data**: Admin-only page showing Square transactions with per-transaction processing fees
- ✅ **Items Analytics**: Charts tab for top items by revenue
- ✅ **Scheduled Reports**: Email Square Payment Data exports on a schedule (Settings)
- ✅ **Payment Recording**: Webhook now correctly stores DuesAmount and SquareFee when creating payment records

## Future Enhancements
- Subscriptions for auto-renewal.
- Receipt emails from ChapterForge.
- Refund / void flows.
- Historical transaction fee reconciliation.
