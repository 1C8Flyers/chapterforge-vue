const crypto = require('crypto');
const square = require('square');
const { SquareClient, SquareEnvironment, WebhooksHelper } = square;

const accessToken = process.env.SQUARE_ACCESS_TOKEN;
const locationId = process.env.SQUARE_LOCATION_ID;
const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

// Determine environment using Square SDK constants
const environment = process.env.SQUARE_ENV === 'production'
  ? SquareEnvironment.Production
  : SquareEnvironment.Sandbox;

// Initialize Square client
let client = null;
if (accessToken) {
  try {
    client = new SquareClient({
      accessToken: accessToken,
      environment: environment
    });
    console.log(`[SQUARE] Client initialized for ${process.env.SQUARE_ENV || 'sandbox'} environment`);
  } catch (error) {
    console.error('[SQUARE] Failed to initialize client:', error);
  }
} else {
  console.warn('[SQUARE] No access token provided, Square features disabled');
}

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
  if (!client || !isConfigured()) {
    throw new Error('Square is not configured');
  }
  
  try {
    const response = await client.payments.list({
      beginTime: options.begin_time,
      endTime: options.end_time,
      sortOrder: options.sort_order || 'DESC',
      cursor: options.cursor,
      limit: options.limit || 100,
      locationId: options.location_id
    });
    
    return response.result.payments || [];
  } catch (error) {
    console.error('Error listing payments from Square:', error);
    throw error;
  }
}

async function retrieveBalance() {
  if (!client || !isConfigured()) {
    throw new Error('Square is not configured');
  }
  
  try {
    // Get recent payments and calculate totals
    // Note: This provides an estimate based on recent payments, not actual account balance
    const paymentsResponse = await client.payments.list({
      locationId,
      limit: 100,
      sortOrder: 'DESC'
    });
    
    const payments = paymentsResponse.result.payments || [];
    
    // Calculate total from completed payments
    let totalAmount = 0;
    
    for (const payment of payments) {
      if (payment.status === 'COMPLETED') {
        totalAmount += Number(payment.amountMoney?.amount || 0);
      }
    }
    
    return {
      available_amount: totalAmount,
      pending_amount: 0,
      details: [{
        currency: 'USD',
        amount: totalAmount,
        status: 'Calculated from recent payments',
        note: 'This is a sum of recent completed payments, not actual account balance'
      }]
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
