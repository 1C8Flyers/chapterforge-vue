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
  
  // Log the top-level keys to see result structure
  console.log('[SQUARE] Result keys:', Object.keys(result));
  
  // Try different possible result structures
  let order = result?.data?.order || result?.result?.order || result?.order || null;
  
  // If still null, log the entire result structure (omit problematic fields)
  if (!order) {
    const safeResult = {};
    for (const [key, value] of Object.entries(result || {})) {
      if (key !== 'errors' && typeof value !== 'object') {
        safeResult[key] = value;
      }
    }
    console.log('[SQUARE] Result structure (non-nested):', safeResult);
  }
  
  console.log('[SQUARE] Extracted order:', order ? 'found' : 'null');
  
  if (order) {
    console.log('[SQUARE] Order ID:', order.id);
    console.log('[SQUARE] Order metadata:', JSON.stringify(order.metadata || {}, (key, value) => {
      if (typeof value === 'bigint') return value.toString();
      return value;
    }));
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

async function listPayments(options = {}) {
  if (!isConfigured()) {
    throw new Error('Square is not configured');
  }
  
  try {
    const response = await client.paymentsApi.listPayments(
      options.begin_time,
      options.end_time,
      options.sort_order || 'DESC',
      options.cursor,
      options.limit || 100,
      options.location_id
    );
    
    return response.result.payments || [];
  } catch (error) {
    console.error('Error listing payments from Square:', error);
    throw error;
  }
}

async function retrieveBalance() {
  if (!isConfigured()) {
    throw new Error('Square is not configured');
  }
  
  try {
    const response = await client.balancesApi.listBalances();
    
    const balances = response.result.balances || [];
    
    // Calculate total available and pending amounts
    let availableAmount = 0;
    let pendingAmount = 0;
    const details = [];
    
    for (const balance of balances) {
      if (balance.type === 'CASH') {
        availableAmount += balance.amount || 0;
        details.push({
          currency: balance.currency || 'USD',
          amount: balance.amount || 0
        });
      }
    }
    
    return {
      available_amount: availableAmount,
      pending_amount: pendingAmount,
      details: details
    };
  } catch (error) {
    console.error('Error retrieving balance from Square:', error);
    throw error;
  }
}

module.exports = {
  isConfigured,
  getWebhookSignatureKey,
  createPaymentLink,
  retrieveOrder,
  verifyWebhookSignature,
  listPayments,
  retrieveBalance
};
