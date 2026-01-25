const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const admin = require('firebase-admin');
require('dotenv').config();

const db = require('./database');
const emailService = require('./emailService');
const squareService = require('./squareService');

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

let firebaseAuthEnabled = false;
const firebaseAdminEmails = (process.env.FIREBASE_ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);
const firebaseAllowedDomains = (process.env.FIREBASE_ALLOWED_DOMAINS || '')
  .split(',')
  .map(domain => domain.trim().toLowerCase())
  .filter(Boolean);

try {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  let serviceAccount = null;
  if (serviceAccountJson) {
    serviceAccount = JSON.parse(serviceAccountJson);
  } else if (serviceAccountPath) {
    serviceAccount = require(path.resolve(serviceAccountPath));
  }
  if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    firebaseAuthEnabled = true;
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
}

// Middleware
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Auth middleware for API routes
app.use('/api', async (req, res, next) => {
  const publicPaths = ['/payments/square/webhook'];
  if (publicPaths.includes(req.path)) {
    return next();
  }
  if (!firebaseAuthEnabled) {
    return res.status(500).json({ error: 'Firebase authentication is not configured' });
  }
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }
  try {
    const token = authHeader.replace('Bearer ', '').trim();
    const decoded = await admin.auth().verifyIdToken(token);
    const email = String(decoded.email || '').toLowerCase();
    const uid = decoded.uid;

    const isAdminEnv = firebaseAdminEmails.includes(email);
    const allowlistEntry = await db.getUserAllowlistByEmail(email);

    if (!isAdminEnv && !allowlistEntry) {
      return res.status(403).json({ error: 'User is not authorized' });
    }

    if (firebaseAllowedDomains.length > 0 && !isAdminEnv && allowlistEntry) {
      const domain = email.split('@')[1] || '';
      if (!firebaseAllowedDomains.includes(domain)) {
        return res.status(403).json({ error: 'Access denied for this domain' });
      }
    }

    await db.upsertUserAccount({ uid, email, displayName: decoded.name || decoded.displayName || '' });

    const resolvedRole = isAdminEnv ? 'admin' : (allowlistEntry?.Role || 'user');
    await db.updateUserAccount(uid, { role: resolvedRole, memberId: allowlistEntry?.MemberID || null });

    const isAdmin = decoded.admin === true
      || decoded.role === 'admin'
      || isAdminEnv
      || resolvedRole === 'admin';
    req.user = { uid, email, role: isAdmin ? 'admin' : 'user' };
    const method = req.method.toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Serve Vue app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// API Routes
// Stats endpoint for dashboard
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading stats' });
  }
});

// Get all members
app.get('/api/members', async (req, res) => {
  try {
    const members = await db.getAllMembers();
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading members' });
  }
});

// Get member statistics
app.get('/api/members/stats', async (req, res) => {
  try {
    const members = await db.getAllMembers();
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const stats = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.Status === 'Active').length,
      renewalsDue: members.filter(m => m.LastPaidYear < currentYear && m.MemberType !== 'Family Member').length,
      youthProtectionExpiring: members.filter(m => {
        if (!m.YouthProtectionExpiration) return false;
        const expirationDate = new Date(m.YouthProtectionExpiration);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return expirationDate <= thirtyDaysFromNow;
      }).length
    };
    
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading member stats' });
  }
});

// Get members with expiring YP certification
app.get('/api/members/yp-expiring', async (req, res) => {
  try {
    const members = await db.getAllMembers();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringMembers = members
      .filter(m => {
        if (!m.YouthProtectionExpiration) return false;
        const expirationDate = new Date(m.YouthProtectionExpiration);
        return expirationDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => {
        const dateA = new Date(a.YouthProtectionExpiration);
        const dateB = new Date(b.YouthProtectionExpiration);
        return dateA.getTime() - dateB.getTime();
      });
    
    res.json(expiringMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading YP expiring members' });
  }
});

// CSV template download
app.get('/api/members/import/template', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="members-template.csv"');
  const header = [
    'FirstName','LastName','Email','Phone','MemberType','Status','DuesRate','EAANumber','Notes','HouseholdID','LastPaidYear','AmountDue',
    'YouthProtectionExpiration','BackgroundCheckExpiration','YoungEaglePilot','YoungEagleVolunteer','EaglePilot','EagleFlightVolunteer',
    'BoardMember','Officer','Payments'
  ].join(',');
  res.send(`${header}\n`);
});

// Handle CSV import
app.post('/api/members/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ imported: 0, errors: ['No file uploaded'] });
    }

    const csvText = req.file.buffer.toString('utf-8');
    let records = [];
    try {
      records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });
    } catch (e) {
      return res.json({ imported: 0, errors: ['Invalid CSV format'] });
    }

    const errors = [];
    let imported = 0;

    const parsePayments = (raw) => {
      if (!raw) return [];
      return String(raw)
        .split(';')
        .map(entry => entry.trim())
        .filter(Boolean)
        .map(entry => {
          const [yearStr, amountStr] = entry.split(':').map(v => v?.trim());
          const year = Number(yearStr);
          const amount = amountStr !== undefined && amountStr !== '' ? Number(amountStr) : 0;
          if (!Number.isFinite(year)) return null;
          return { year, amount };
        })
        .filter(Boolean);
    };

    for (const [index, r] of records.entries()) {
      const FirstName = r.FirstName?.trim();
      const LastName = r.LastName?.trim();
      const Email = r.Email?.trim();
      const Phone = r.Phone?.trim() || null;
      const MemberType = r.MemberType?.trim() || 'Individual';
      const Status = r.Status?.trim() || 'Active';
      const DuesRate = r.DuesRate !== undefined && r.DuesRate !== '' ? Number(r.DuesRate) : 0;
      const EAANumber = r.EAANumber?.trim() || null;
      const Notes = r.Notes?.trim() || null;
      const HouseholdID = r.HouseholdID !== undefined && r.HouseholdID !== '' ? Number(r.HouseholdID) : null;
      const LastPaidYear = r.LastPaidYear !== undefined && r.LastPaidYear !== '' ? Number(r.LastPaidYear) : null;
      const AmountDue = r.AmountDue !== undefined && r.AmountDue !== '' ? Number(r.AmountDue) : 0;
      const YouthProtectionExpiration = r.YouthProtectionExpiration?.trim() || null;
      const BackgroundCheckExpiration = r.BackgroundCheckExpiration?.trim() || null;
      const YoungEaglePilot = r.YoungEaglePilot !== undefined && r.YoungEaglePilot !== '' ? Number(r.YoungEaglePilot) : 0;
      const YoungEagleVolunteer = r.YoungEagleVolunteer !== undefined && r.YoungEagleVolunteer !== '' ? Number(r.YoungEagleVolunteer) : 0;
      const EaglePilot = r.EaglePilot !== undefined && r.EaglePilot !== '' ? Number(r.EaglePilot) : 0;
      const EagleFlightVolunteer = r.EagleFlightVolunteer !== undefined && r.EagleFlightVolunteer !== '' ? Number(r.EagleFlightVolunteer) : 0;
      const BoardMember = r.BoardMember !== undefined && r.BoardMember !== '' ? Number(r.BoardMember) : 0;
      const Officer = r.Officer !== undefined && r.Officer !== '' ? Number(r.Officer) : 0;
      const Payments = parsePayments(r.Payments);

      if (!FirstName || !LastName) {
        errors.push(`Row ${index + 2}: Missing FirstName/LastName`);
        continue;
      }

      try {
        const created = await db.createMember({
          HouseholdID,
          FirstName,
          LastName,
          EAANumber,
          Phone,
          Email,
          MemberType,
          Status,
          DuesRate,
          LastPaidYear,
          AmountDue,
          YouthProtectionExpiration,
          BackgroundCheckExpiration,
          YoungEaglePilot,
          YoungEagleVolunteer,
          EaglePilot,
          EagleFlightVolunteer,
          BoardMember,
          Officer,
          Notes
        });
        if (Payments.length > 0) {
          let maxYear = LastPaidYear || null;
          for (const payment of Payments) {
            await db.addPayment(created.id, payment.year, payment.amount, 'import');
            if (!maxYear || payment.year > maxYear) {
              maxYear = payment.year;
            }
          }
          if (!LastPaidYear && maxYear) {
            await db.setLastPaidYear(created.id, maxYear);
          }
        }
        imported++;
      } catch (e) {
        errors.push(`Row ${index + 2}: ${e.message}`);
      }
    }

    res.json({ imported, errors });
  } catch (error) {
    console.error(error);
    res.json({ imported: 0, errors: ['Server error during import'] });
  }
});

// API: Get member by ID
app.get('/api/members/:id', async (req, res) => {
  try {
    const member = await db.getMemberById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create member
app.post('/api/members', async (req, res) => {
  try {
    const result = await db.createMember(req.body);
    res.json({ success: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update member
app.put('/api/members/:id', async (req, res) => {
  try {
    await db.updateMember(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete member
app.delete('/api/members/:id', async (req, res) => {
  try {
    await db.deleteMember(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get household members
app.get('/api/members/:id/household', async (req, res) => {
  try {
    const member = await db.getMemberById(req.params.id);
    if (!member || !member.HouseholdID) {
      return res.json([member || null]);
    }
    const household = await db.getHouseholdMembers(member.HouseholdID);
    res.json(household);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Add family member
app.post('/api/members/:id/family', async (req, res) => {
  try {
    const mainMember = await db.getMemberById(req.params.id);
    if (!mainMember) {
      return res.status(404).json({ error: 'Main member not found' });
    }

    let householdId = mainMember.HouseholdID;
    // If main member doesn't have a household ID, create one
    if (!householdId) {
      householdId = await db.getNextHouseholdId();
      await db.updateMember(req.params.id, { ...mainMember, HouseholdID: householdId });
    }

    const familyMember = await db.addFamilyMember(householdId, req.body);
    res.json(familyMember);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Remove family member
app.delete('/api/members/:id/family/:familyId', async (req, res) => {
  try {
    await db.removeFamilyMember(req.params.familyId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update dues payment
app.post('/api/members/:id/dues', async (req, res) => {
  try {
    const { year, amount } = req.body;
    await db.updateDuesPayment(req.params.id, year, amount);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get renewals
app.get('/api/renewals', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const members = await db.getMembersNeedingRenewal(year);
    res.json({ members, year });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error loading renewals' });
  }
});

// API: Send renewal notice
app.post('/api/renewals/send/:id', async (req, res) => {
  try {
    const member = await db.getMemberById(req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    const year = req.body.year || new Date().getFullYear();
    let emailOptions = {};
    if (squareService.isConfigured()) {
      const squareFee = await db.getSquareFeeAmount(1);
      const feeAmount = Number.isFinite(squareFee) ? squareFee : 0;
      const baseAmount = Number(member.DuesRate || member.AmountDue || 0);
      const totalAmount = baseAmount + (feeAmount > 0 ? feeAmount : 0);
      try {
        const linkResult = await squareService.createPaymentLink({
          memberId: member.MemberID,
          year,
          amount: totalAmount,
          description: `${year} Membership Dues`
        });
        const paymentLinkUrl = linkResult?.paymentLink?.url || '';
        if (paymentLinkUrl) {
          emailOptions = {
            PaymentLink: paymentLinkUrl,
            TotalDue: `$${Number(totalAmount || 0).toFixed(2)}`,
            SquareFee: feeAmount ? `$${Number(feeAmount).toFixed(2)}` : ''
          };
        }
      } catch (error) {
        console.error('Failed to create Square payment link for email:', error);
      }
    }

    const result = await emailService.sendRenewalNotice(member, year, emailOptions);
    if (result?.success) {
      await db.recordRenewalNoticeSent(member.MemberID, year);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Send bulk renewal notices
app.post('/api/renewals/send-bulk', async (req, res) => {
  try {
    const year = req.body.year || new Date().getFullYear();
    const members = await db.getMembersNeedingRenewal(year);
    
    if (members.length === 0) {
      return res.json({ message: 'No members need renewal notices', results: [] });
    }
    
    const results = await emailService.sendBulkRenewalNotices(members, year, async (member) => {
      if (!squareService.isConfigured()) return {};
      const squareFee = await db.getSquareFeeAmount(1);
      const feeAmount = Number.isFinite(squareFee) ? squareFee : 0;
      const baseAmount = Number(member.DuesRate || member.AmountDue || 0);
      const totalAmount = baseAmount + (feeAmount > 0 ? feeAmount : 0);
      try {
        const linkResult = await squareService.createPaymentLink({
          memberId: member.MemberID,
          year,
          amount: totalAmount,
          description: `${year} Membership Dues`
        });
        const paymentLinkUrl = linkResult?.paymentLink?.url || '';
        if (!paymentLinkUrl) return {};
        return {
          PaymentLink: paymentLinkUrl,
          TotalDue: `$${Number(totalAmount || 0).toFixed(2)}`,
          SquareFee: feeAmount ? `$${Number(feeAmount).toFixed(2)}` : ''
        };
      } catch (error) {
        console.error('Failed to create Square payment link for email:', error);
        return {};
      }
    });
    for (const result of results) {
      if (result?.success && result.memberId) {
        await db.recordRenewalNoticeSent(result.memberId, year);
      }
    }
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStatistics();
    console.log('Stats from database:', stats);
    // Map field name for consistency with frontend
    if (stats.needingRenewal !== undefined) {
      stats.renewalsNeeded = stats.needingRenewal;
    }
    console.log('Stats sent to frontend:', stats);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get monthly stats for charts (last 12 months)
app.get('/api/stats/monthly', async (req, res) => {
  try {
    const months = [];
    const labels = [];
    const now = new Date();
    const pad = (n) => (n < 10 ? '0' + n : '' + n);

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      months.push(ym);
      labels.push(d.toLocaleString('default', { month: 'short' }));
    }

    const newMembersRows = await db.getMonthlyNewMembers();
    const activeNewRows = await db.getMonthlyActiveNewMembers();

    const newMembersMap = Object.fromEntries(newMembersRows.map(r => [r.ym, r.count]));
    const activeNewMap = Object.fromEntries(activeNewRows.map(r => [r.ym, r.count]));

    const newMembers = months.map(m => newMembersMap[m] || 0);
    const activeNewMembers = months.map(m => activeNewMap[m] || 0);

    res.json({ labels, newMembers, activeNewMembers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create Square payment link
app.post('/api/payments/square/link', async (req, res) => {
  try {
    if (!squareService.isConfigured()) {
      return res.status(400).json({ error: 'Square is not configured' });
    }

    const squareFee = await db.getSquareFeeAmount(1);
    const feeAmount = Number.isFinite(squareFee) ? squareFee : 0;
    const memberId = Number(req.body.memberId);
    const year = Number(req.body.year) || new Date().getFullYear();
    const amount = req.body.amount !== undefined ? Number(req.body.amount) : null;
    const description = (req.body.description || '').trim();

    if (!memberId || !Number.isFinite(year)) {
      return res.status(400).json({ error: 'Valid memberId and year are required' });
    }

    const member = await db.getMemberById(memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const resolvedAmount = Number.isFinite(amount) ? amount : Number(member.DuesRate || 0);
    if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const totalAmount = resolvedAmount + (feeAmount > 0 ? feeAmount : 0);

    const resolvedDescription = description || `${year} Membership Dues`;
    const result = await squareService.createPaymentLink({
      memberId,
      year,
      amount: totalAmount,
      description: resolvedDescription
    });

    res.json({
      paymentLinkUrl: result.paymentLink?.url || null,
      amount: totalAmount,
      fee: feeAmount > 0 ? feeAmount : 0,
      square: {
        orderId: result.order?.id || null,
        paymentLinkId: result.paymentLink?.id || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Square webhook
app.post('/api/payments/square/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const body = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
    const webhookUrl = process.env.SQUARE_WEBHOOK_URL || `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    console.log('[WEBHOOK] Received webhook, validating signature...');
    const isValid = await squareService.verifyWebhookSignature({ signature, body, url: webhookUrl });
    if (!isValid) {
      console.log('[WEBHOOK] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    console.log('[WEBHOOK] Signature valid');

    const event = req.body && typeof req.body === 'object' ? req.body : JSON.parse(body);
    const eventType = event?.type || '';
    
    // Handle both payment.* events and invoice.payment_made events
    let payment = event?.data?.object?.payment;
    let invoice = event?.data?.object?.invoice;
    
    console.log('[WEBHOOK] Event type:', eventType, 'Full event data:', JSON.stringify(event?.data?.object || {}));

    // For invoice.payment_made events, the payment is in a different structure
    if (eventType === 'invoice.payment_made' && invoice) {
      console.log('[WEBHOOK] Processing invoice.payment_made event, invoice ID:', invoice.id);
      // For invoices, we need to extract the payment info differently
      // The payment ID will be in the invoice's payments array or we need to use the invoice itself
      payment = {
        id: invoice.id, // Use invoice ID as payment ID for tracking
        order_id: invoice.order_id,
        amount_money: invoice.total_money,
        status: 'COMPLETED',
        invoice_id: invoice.id
      };
    }

    console.log('[WEBHOOK] Payment ID:', payment?.id, 'Status:', payment?.status, 'Order ID:', payment?.order_id);

    if (!payment) {
      console.log('[WEBHOOK] Ignoring: no payment object found');
      return res.json({ received: true });
    }

    if (eventType !== 'invoice.payment_made' && !eventType.startsWith('payment.')) {
      console.log('[WEBHOOK] Ignoring: wrong event type');
      return res.json({ received: true });
    }

    if (payment.status !== 'COMPLETED' && payment.status !== 'APPROVED') {
      console.log('[WEBHOOK] Ignoring: payment status is', payment.status, '(not COMPLETED or APPROVED)');
      return res.json({ received: true });
    }

    const existing = await db.getPaymentByProviderPaymentId(payment.id);
    if (existing) {
      console.log('[WEBHOOK] Payment already exists with ID:', payment.id);
      await db.updatePaymentProviderStatus(existing.PaymentID, payment.status);
      return res.json({ received: true });
    }

    const orderId = payment.order_id;
    console.log('[WEBHOOK] Order ID:', orderId);
    if (!orderId) {
      console.log('[WEBHOOK] Ignoring: no order_id on payment');
      return res.json({ received: true });
    }

    console.log('[WEBHOOK] Retrieving order...');
    let order;
    try {
      order = await squareService.retrieveOrder(orderId);
    } catch (orderError) {
      console.log('[WEBHOOK] Failed to retrieve order:', orderError?.errors?.[0]?.detail || orderError.message);
      // For test webhooks with fake order IDs, try to continue
      order = null;
    }
    console.log('[WEBHOOK] Order retrieved:', order ? 'success' : 'null');
    
    const metadata = order?.metadata || {};
    const memberId = Number(metadata.memberId) || 0;
    const year = Number(metadata.year) || 0;
    console.log('[WEBHOOK] Extracted metadata: memberId =', memberId, 'year =', year);
    if (metadata && Object.keys(metadata).length > 0) {
      console.log('[WEBHOOK] Metadata object keys:', Object.keys(metadata));
    }

    const amountCents = payment.amount_money?.amount || order?.total_money?.amount || 0;
    const amount = Number(amountCents) / 100;
    console.log('[WEBHOOK] Amount: $' + amount + ' (' + amountCents + ' cents)');

    console.log('[WEBHOOK] Creating payment record...');
    // Record payment even if metadata is missing - helps with debugging
    await db.createPayment(memberId, year, amount, 'square', {
      Provider: 'square',
      ProviderPaymentId: payment.id,
      ProviderOrderId: orderId,
      ProviderInvoiceId: payment.invoice_id || null,
      ProviderStatus: payment.status
    });
    console.log('[WEBHOOK] Payment created');
    
    // Only refresh member summary if we have a valid memberId
    if (memberId > 0) {
      console.log('[WEBHOOK] Refreshing member summary...');
      await db.refreshMemberPaymentSummary(memberId);
      console.log('[WEBHOOK] Payment processing complete for member', memberId);
    } else {
      console.log('[WEBHOOK] Skipping member summary refresh - no valid memberId');
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Payments list (reports)
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await db.getAllPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Payments for member
app.get('/api/members/:id/payments', async (req, res) => {
  try {
    const payments = await db.getPaymentsForMember(req.params.id);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/members/:id/payments', async (req, res) => {
  try {
    const memberId = Number(req.params.id);
    const { Year, Amount, Method } = req.body;
    const yearNum = Number(Year);
    const amountNum = Number(Amount);

    if (!memberId || !Number.isFinite(yearNum)) {
      return res.status(400).json({ error: 'Valid Year is required' });
    }

    // Manual payments are marked as COMPLETED since they represent received payments
    await db.createPayment(memberId, yearNum, Number.isFinite(amountNum) ? amountNum : 0, Method || 'manual', {
      Provider: Method || 'manual',
      ProviderStatus: 'COMPLETED'
    });
    await db.refreshMemberPaymentSummary(memberId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/payments/:id', async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    const { Year, Amount, Method, MemberID, Provider, ProviderStatus, ProviderPaymentId, ProviderOrderId, ProviderInvoiceId, ProviderLinkId } = req.body;
    const yearNum = Number(Year);
    const amountNum = Number(Amount);
    const memberIdNum = MemberID !== undefined ? Number(MemberID) : null;

    if (!paymentId || !Number.isFinite(yearNum)) {
      return res.status(400).json({ error: 'Valid Year is required' });
    }

    const payment = await db.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const providerPayload = {
      Provider: Provider,
      ProviderPaymentId,
      ProviderOrderId,
      ProviderInvoiceId,
      ProviderStatus,
      ProviderLinkId
    };

    const newMemberId = Number.isFinite(memberIdNum) && memberIdNum > 0 ? memberIdNum : payment.MemberID;

    await db.updatePayment(
      paymentId,
      newMemberId,
      yearNum,
      Number.isFinite(amountNum) ? amountNum : 0,
      Method || payment.Method || 'manual',
      providerPayload
    );
    await db.refreshMemberPaymentSummary(payment.MemberID);
    if (newMemberId !== payment.MemberID) {
      await db.refreshMemberPaymentSummary(newMemberId);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    if (!paymentId) {
      return res.status(400).json({ error: 'Valid payment id is required' });
    }

    const payment = await db.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    await db.deletePayment(paymentId);
    await db.refreshMemberPaymentSummary(payment.MemberID);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Member types
app.get('/api/settings/member-types', async (req, res) => {
  try {
    const types = await db.getMemberTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/member-types', async (req, res) => {
  try {
    const { Name, DuesRate = 0, SortOrder = 0 } = req.body;
    if (!Name || !Name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await db.createMemberType({ Name: Name.trim(), DuesRate: Number(DuesRate) || 0, SortOrder: Number(SortOrder) || 0 });
    res.json({ success: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/member-types/:id', async (req, res) => {
  try {
    const { Name, DuesRate = 0, SortOrder = 0 } = req.body;
    if (!Name || !Name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    await db.updateMemberType(req.params.id, { Name: Name.trim(), DuesRate: Number(DuesRate) || 0, SortOrder: Number(SortOrder) || 0 });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/settings/member-types/:id', async (req, res) => {
  try {
    await db.deleteMemberType(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Email template (renewal)
app.get('/api/settings/email-template', async (req, res) => {
  try {
    const tpl = await db.getEmailTemplate('renewal');
    const fallback = emailService.getDefaultTemplate();
    res.json({
      subject: tpl?.Subject || fallback.subject,
      body: tpl?.HtmlBody || fallback.html
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Payment settings (Square fee)
app.get('/api/settings/payments', async (req, res) => {
  try {
    const squareFeeAmount = await db.getSquareFeeAmount(1);
    res.json({ squareFeeAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/payments', async (req, res) => {
  try {
    const raw = req.body?.squareFeeAmount;
    const fee = Number(raw);
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ error: 'squareFeeAmount must be a non-negative number' });
    }
    await db.setSetting('square_fee_amount', fee);
    res.json({ success: true, squareFeeAmount: fee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Timezone settings
app.get('/api/settings/timezone', async (req, res) => {
  try {
    const timezone = await db.getSetting('timezone');
    res.json({ timezone: timezone || 'America/Chicago' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/timezone', async (req, res) => {
  try {
    const { timezone } = req.body;
    if (!timezone || typeof timezone !== 'string') {
      return res.status(400).json({ error: 'timezone must be a valid string' });
    }
    await db.setSetting('timezone', timezone);
    res.json({ success: true, timezone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/email-template', async (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'HTML body is required' });
    }
    await db.saveEmailTemplate('renewal', subject.trim(), body.trim());
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/email-template/preview', async (req, res) => {
  try {
    const sampleMember = {
      FirstName: 'Avery',
      LastName: 'Pilot',
      EAANumber: '123456',
      MemberType: 'Family',
      DuesRate: 40,
      AmountDue: 40,
      Email: 'sample@example.com'
    };
    const year = req.body.year || new Date().getFullYear();
    const subject = req.body.Subject || '{{Year}} Membership Renewal - {{ChapterName}}';
    const html = req.body.HtmlBody;
    if (!html || !html.trim()) {
      return res.status(400).json({ error: 'HTML body is required for preview' });
    }
    const rendered = emailService.renderTemplate(html, subject, sampleMember, year);
    res.json({ html: rendered.html, subject: rendered.subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Current user
app.get('/api/users/me', async (req, res) => {
  try {
    const account = await db.getUserAccountByUid(req.user.uid);
    res.json({
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role,
      memberId: account?.MemberID || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: List users (admin only)
app.get('/api/users', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const users = await db.listUserAllowlist();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Add user to allowlist (admin only)
app.post('/api/users', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { email, role, memberId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const normalizedEmail = String(email).toLowerCase();
    const normalizedRole = role === 'admin' ? 'admin' : 'user';
    await db.addUserAllowlist({
      email: normalizedEmail,
      role: normalizedRole,
      memberId: memberId ? Number(memberId) : null
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update user role/member (admin only)
app.put('/api/users/:email', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { role, memberId } = req.body;
    const normalizedRole = role === 'admin' ? 'admin' : 'user';
    const normalizedEmail = String(req.params.email).toLowerCase();
    await db.updateUserAllowlist(normalizedEmail, {
      role: normalizedRole,
      memberId: memberId ? Number(memberId) : null
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Remove user mapping (admin only)
app.delete('/api/users/:email', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const normalizedEmail = String(req.params.email).toLowerCase();
    await db.removeUserAllowlist(normalizedEmail);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: System status
app.get('/api/status', async (req, res) => {
  const status = { database: { ok: false }, email: { ok: false } };
  try {
    await db.checkHealth();
    status.database.ok = true;
    status.database.message = 'Online';
  } catch (err) {
    status.database.message = err.message || 'Unavailable';
  }

  try {
    await emailService.verifyHealth(3000);
    status.email.ok = true;
    status.email.message = 'Ready';
  } catch (err) {
    status.email.message = err.message || 'Unavailable';
  }

  res.json(status);
});

// API: App config
app.get('/api/config', (req, res) => {
  res.json({
    chapterName: process.env.CHAPTER_NAME || 'Chapter',
    chapterEmail: process.env.CHAPTER_EMAIL || ''
  });
});

// Reports endpoint - payments summary by year
app.get('/api/reports/payments/summary', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const rows = await db.getPaymentsByYearSummary();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payments summary:', error);
    res.status(500).json({ error: 'Failed to fetch payments summary' });
  }
});

// Reports endpoint - payments details for a specific year
app.get('/api/reports/payments/year/:year', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const year = Number(req.params.year);
    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    const rows = await db.getPaymentsByYear(year);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payments for year:', error);
    res.status(500).json({ error: 'Failed to fetch payments for year' });
  }
});

// Reports endpoint - payments per member per year (CSV-friendly)
app.get('/api/reports/payments/by-member-year', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const rows = await db.getPaymentsByMemberByYear();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching payments by member/year:', error);
    res.status(500).json({ error: 'Failed to fetch payments by member/year' });
  }
});

// Reports endpoint - return raw database table data
app.get('/api/reports/:table', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { table } = req.params;
  
  // Whitelist of allowed tables to prevent SQL injection
  const allowedTables = ['members', 'member_types', 'user_allowlist', 'email_templates'];
  
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }
  
  try {
    const rows = await db.getAllFromTable(table);
    res.json(rows);
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    res.status(500).json({ error: `Failed to fetch ${table} data` });
  }
});

// Serve Vue app for all non-API routes (SPA fallback)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`ChapterForge server running on http://localhost:${PORT}`);
});
