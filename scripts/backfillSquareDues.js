const db = require('../database');
const squareService = require('../squareService');

async function run() {
  try {
    if (!squareService.isConfigured()) {
      throw new Error('Square is not configured');
    }

    const rows = await db.getSquarePaymentsNeedingBackfill();
    const squareFee = await db.getSquareFeeAmount(1);
    const feeAmount = Number.isFinite(squareFee) ? squareFee : 0;

    let updated = 0;
    let skipped = 0;
    let missing = 0;

    for (const row of rows) {
      const payment = await squareService.getPayment(row.ProviderPaymentId);
      if (!payment) {
        missing += 1;
        console.log('[BACKFILL] Missing payment', row.ProviderPaymentId);
        continue;
      }

      if (payment.status !== 'COMPLETED' && payment.status !== 'APPROVED') {
        skipped += 1;
        console.log('[BACKFILL] Skipped payment', row.ProviderPaymentId, 'status', payment.status);
        continue;
      }

      const amountCents =
        payment.amountMoney?.amount ||
        payment.amount_money?.amount ||
        0;
      const amount = Number(amountCents) / 100;
      const duesAmount = Math.max(0, amount - feeAmount);

      let memberId = row.MemberID;
      let year = row.Year;
      const orderId = payment.orderId || payment.order_id;
      if (orderId) {
        const order = await squareService.retrieveOrder(orderId);
        const metadata = order?.metadata || {};
        const metaMemberId = Number(metadata.memberId) || 0;
        const metaYear = Number(metadata.year) || 0;
        if (metaMemberId) memberId = metaMemberId;
        if (metaYear) year = metaYear;
      }

      await db.updatePayment(row.PaymentID, memberId, year, amount, 'square', {
        Provider: 'square',
        ProviderPaymentId: row.ProviderPaymentId,
        ProviderOrderId: orderId || null,
        ProviderStatus: payment.status,
        DuesAmount: duesAmount,
        SquareFee: feeAmount
      });

      if (memberId > 0) {
        await db.refreshMemberPaymentSummary(memberId);
      }

      updated += 1;
      console.log('[BACKFILL] Updated payment', row.ProviderPaymentId, 'amount', amount);
    }

    console.log('[BACKFILL] Done', { updated, skipped, missing, total: rows.length });
  } catch (error) {
    console.error('[BACKFILL] Failed:', error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

run();
