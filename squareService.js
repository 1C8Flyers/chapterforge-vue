const crypto = require('crypto');
const square = require('square');
const { SquareClient, SquareEnvironment, WebhooksHelper } = square;

const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;
const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
const resolvedEnvironment = SquareEnvironment || { Production: 'production', Sandbox: 'sandbox' };
const environment = process.env.SQUARE_ENV === 'production'
  ? resolvedEnvironment.Production
  : resolvedEnvironment.Sandbox;

const client = accessToken
  ? new SquareClient({
      token: accessToken,
      environment
    })
  : null;

function isConfigured() {
  return Boolean(accessToken && locationId);
}

function getWebhookSignatureKey() {
  return webhookSignatureKey;
}

async function createPaymentLink({ memberId, year, amount, description }) {
  if (!client) {
    throw new Error('Square is not configured');
  }

  const cents = Math.round(Number(amount) * 100);
  if (!Number.isFinite(cents) || cents <= 0) {
    throw new Error('Invalid payment amount');
  }

  const result = await client.checkout.paymentLinks.create({
    idempotencyKey: crypto.randomUUID(),
    description,
    order: {
      locationId,
      lineItems: [
        {
          name: description,
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(cents),
            currency: 'USD'
          }
        }
      ],
      metadata: {
        memberId: String(memberId),
        year: String(year)
      }
    }
  });

  return result?.result || result?.data || result;
}

async function retrieveOrder(orderId) {
  if (!client) {
    throw new Error('Square is not configured');
  }
  const result = await client.orders.get({ orderId });
  console.log('[SQUARE] Order API result:', JSON.stringify(result).substring(0, 500));
  const order = result.data?.order || result.result?.order || null;
  console.log('[SQUARE] Extracted order:', order ? 'found' : 'null');
  if (order) {
    console.log('[SQUARE] Order metadata:', order.metadata);
  }
  return order;
}

async function verifyWebhookSignature({ signature, body, url }) {
  if (!webhookSignatureKey || !signature || !body || !url) return false;
  return WebhooksHelper.verifySignature({
    requestBody: body,
    signatureHeader: signature,
    signatureKey: webhookSignatureKey,
    notificationUrl: url
  });
}

module.exports = {
  isConfigured,
  getWebhookSignatureKey,
  createPaymentLink,
  retrieveOrder,
  verifyWebhookSignature
};
