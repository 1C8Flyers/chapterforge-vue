const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const admin = require('firebase-admin');
const cron = require('node-cron');
const { google } = require('googleapis');
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

// Log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// Public member signup form (no auth)
app.get('/public/member-signup/form', async (req, res) => {
  try {
    const config = await getPublicSignupConfig();
    if (!config.enabled) {
      return res.status(403).send('Signup form is currently disabled.');
    }
    const actionUrl = `${req.protocol}://${req.get('host')}/public/member-signup`;
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>New Member Signup</title>
        <style>
          :root { color-scheme: light; }
          body { font-family: "Inter", "Segoe UI", Arial, sans-serif; background: #f3f4f6; color: #111827; padding: 24px; }
          .card { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08); padding: 24px; }
          h1 { font-size: 22px; margin: 0 0 6px; }
          p.sub { margin: 0 0 20px; color: #6b7280; font-size: 14px; }
          .grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .field { display: flex; flex-direction: column; gap: 6px; }
          label { font-size: 13px; color: #374151; font-weight: 600; }
          input, select { width: 100%; padding: 11px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
          input:focus, select:focus { outline: 2px solid rgba(59, 130, 246, 0.2); border-color: #3b82f6; }
          .full { grid-column: span 2; }
          .notice { margin-top: 12px; padding: 12px 14px; border-radius: 10px; background: #eff6ff; color: #1e3a8a; font-size: 13px; }
          .actions { margin-top: 18px; display: flex; justify-content: flex-end; }
          button { background: #2563eb; color: white; border: 0; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
          button:hover { background: #1d4ed8; }
          @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } .full { grid-column: span 1; } }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>New Member Signup</h1>
          <p class="sub">Please complete the form below. We will follow up soon.</p>
          <form method="POST" action="${actionUrl}">
            <div class="grid">
              <div class="field"><label>First Name</label><input name="FirstName" required /></div>
              <div class="field"><label>Last Name</label><input name="LastName" required /></div>
              <div class="field"><label>Email</label><input name="Email" type="email" required /></div>
              <div class="field"><label>EAA Number (optional)</label><input name="EAANumber" /></div>
              <div class="field full"><label>Street Address</label><input name="Street" required /></div>
              <div class="field"><label>City</label><input name="City" required /></div>
              <div class="field"><label>State</label><input name="State" required /></div>
              <div class="field"><label>ZIP</label><input name="Zip" required /></div>
              <div class="field full">
                <label>How did you hear about us?</label>
                <select name="HearAbout">
                  <option value="">Select...</option>
                  <option>Friend or family</option>
                  <option>Chapter event</option>
                  <option>EAA website</option>
                  <option>Social media</option>
                  <option>Search engine</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div class="notice">
              By submitting this form, you agree to be added to our chapter events email list.
            </div>
            <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
            <div class="actions">
              <button type="submit">Submit</button>
            </div>
          </form>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Unable to render form');
  }
});

app.post('/public/member-signup', async (req, res) => {
  try {
    const config = await getPublicSignupConfig();
    if (!config.enabled) {
      return res.status(403).send('Signup form is currently disabled.');
    }

    if (req.body?.website) {
      return res.status(200).send('Thank you for your submission.');
    }

    const FirstName = String(req.body?.FirstName || '').trim();
    const LastName = String(req.body?.LastName || '').trim();
    const Email = String(req.body?.Email || '').trim();
    const EAANumber = String(req.body?.EAANumber || '').trim();
    const Street = String(req.body?.Street || '').trim();
    const City = String(req.body?.City || '').trim();
    const State = String(req.body?.State || '').trim();
    const Zip = String(req.body?.Zip || '').trim();
    const HearAbout = String(req.body?.HearAbout || '').trim();

    if (!FirstName || !LastName || !Email || !Street || !City || !State || !Zip) {
      return res.status(400).send('Missing required fields.');
    }

    const memberType = config.defaultMemberType || 'Prospect';
    const notes = HearAbout
      ? `Public signup. Heard about us: ${HearAbout}`
      : 'Public signup';

    const createdMember = await db.createMember({
      FirstName,
      LastName,
      Email,
      EAANumber,
      Street,
      City,
      State,
      Zip,
      MemberType: memberType,
      Status: 'Prospect',
      Notes: notes
    });

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    await db.createPublicSignup({
      MemberID: createdMember.id,
      FirstName,
      LastName,
      Email,
      EAANumber,
      Street,
      City,
      State,
      Zip,
      AssignedMemberType: memberType,
      Notes: notes,
      RawPayload: JSON.stringify({ FirstName, LastName, Email, EAANumber, Street, City, State, Zip, HearAbout }),
      CreatedIp: ipAddress,
      UserAgent: userAgent
    });

    if (config.notificationEmail) {
      const html = `
        <p>A new member signup was received.</p>
        <ul>
          <li>Name: ${FirstName} ${LastName}</li>
          <li>Email: ${Email}</li>
          <li>EAA Number: ${EAANumber}</li>
          <li>Address: ${Street}, ${City}, ${State} ${Zip}</li>
          <li>Heard about us: ${HearAbout || '—'}</li>
          <li>Member Type: ${memberType}</li>
        </ul>
      `;
      await emailService.sendReportEmail({
        recipients: config.notificationEmail,
        subject: `New Member Signup: ${FirstName} ${LastName}`,
        html
      });
    }

    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();

    const wantsJson = String(req.headers.accept || '').includes('application/json');
    if (wantsJson) {
      return res.json({ success: true });
    }
    return res.send('Thank you for your submission.');
  } catch (error) {
    res.status(500).send('Unable to process signup.');
  }
});

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
    
    // Log successful login/authentication
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    db.logAudit(email, 'LOGIN', null, null, null, null, ipAddress, `${method} ${req.path}`).catch(err => {
      console.error('Failed to log audit:', err);
    });
    
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

  const AVAILABLE_SCHEDULED_REPORTS = [
    {
      id: 'square_payments',
      name: 'Square Payment Data',
      description: 'Square payment export with items, fees, and status'
    }
  ];

  const REPORT_SCHEDULE_SETTING_KEY = 'report_schedule_config';
  const GOOGLE_SHEETS_SETTING_KEY = 'google_sheets_config';
  const GOOGLE_GROUPS_SETTING_KEY = 'google_groups_config';
  const MEMBER_ROLE_OPTIONS_KEY = 'member_role_options';
  const MEMBER_ACTIVITY_OPTIONS_KEY = 'member_activity_options';
  const PUBLIC_SIGNUP_SETTING_KEY = 'public_signup_config';
  const DEFAULT_REPORT_SCHEDULE = {
    enabled: false,
    recipients: [],
    reports: ['square_payments'],
    datePreset: 'last_month',
    status: 'COMPLETED',
    frequency: 'monthly',
    time: '08:00',
    dayOfWeek: 1,
    dayOfMonth: 1
  };

  const VALID_DATE_PRESETS = ['last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year', 'last_year'];
  const VALID_STATUSES = ['COMPLETED', 'FAILED', 'ALL'];
  const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'];

  const DEFAULT_GOOGLE_SHEETS_CONFIG = {
    enabled: false,
    spreadsheetId: '',
    sheetPrefix: ''
  };

  const DEFAULT_GOOGLE_GROUPS_CONFIG = {
    enabled: false,
    adminEmail: '',
    removeUnmatched: false,
    mappings: []
  };

  const DEFAULT_MEMBER_ROLE_OPTIONS = ['BoardMember', 'Officer'];
  const DEFAULT_MEMBER_ACTIVITY_OPTIONS = [
    'YoungEaglePilot',
    'YoungEagleVolunteer',
    'EaglePilot',
    'EagleFlightVolunteer'
  ];

  const DEFAULT_PUBLIC_SIGNUP_CONFIG = {
    enabled: false,
    defaultMemberType: 'Prospect',
    notificationEmail: ''
  };

  const normalizePublicSignupConfig = (input = {}) => {
    const merged = { ...DEFAULT_PUBLIC_SIGNUP_CONFIG, ...(input || {}) };
    return {
      enabled: Boolean(merged.enabled),
      defaultMemberType: typeof merged.defaultMemberType === 'string'
        ? merged.defaultMemberType.trim()
        : DEFAULT_PUBLIC_SIGNUP_CONFIG.defaultMemberType,
      notificationEmail: typeof merged.notificationEmail === 'string'
        ? merged.notificationEmail.trim()
        : ''
    };
  };

  const normalizeGoogleSheetsConfig = (input = {}) => {
    const merged = { ...DEFAULT_GOOGLE_SHEETS_CONFIG, ...(input || {}) };
    return {
      enabled: Boolean(merged.enabled),
      spreadsheetId: typeof merged.spreadsheetId === 'string' ? merged.spreadsheetId.trim() : '',
      sheetPrefix: typeof merged.sheetPrefix === 'string' ? merged.sheetPrefix.trim() : ''
    };
  };

  const normalizeGoogleGroupsConfig = (input = {}) => {
    const merged = { ...DEFAULT_GOOGLE_GROUPS_CONFIG, ...(input || {}) };
    const rawMappings = Array.isArray(merged.mappings) ? merged.mappings : [];
    const mappings = rawMappings
      .map((mapping) => {
        const memberType = typeof mapping?.memberType === 'string' ? mapping.memberType.trim() : '';
        const memberTypes = Array.isArray(mapping?.memberTypes)
          ? mapping.memberTypes
          : (memberType ? [memberType] : []);
        const normalizedMemberTypes = memberTypes
          .map(type => String(type || '').trim())
          .filter(Boolean);
        const roles = Array.isArray(mapping?.roles)
          ? mapping.roles.map(role => String(role || '').trim()).filter(Boolean)
          : [];
        const activities = Array.isArray(mapping?.activities)
          ? mapping.activities.map(activity => String(activity || '').trim()).filter(Boolean)
          : [];
        const rawGroups = Array.isArray(mapping?.groups)
          ? mapping.groups
          : String(mapping?.groups || '').split(',');
        const groups = rawGroups
          .map(group => String(group || '').trim().toLowerCase())
          .filter(Boolean);
        return {
          memberTypes: normalizedMemberTypes,
          roles,
          activities,
          groups
        };
      })
      .filter(mapping => (mapping.memberTypes.length > 0 || mapping.roles.length > 0 || mapping.activities.length > 0) && mapping.groups.length > 0);

    return {
      enabled: Boolean(merged.enabled),
      adminEmail: typeof merged.adminEmail === 'string' ? merged.adminEmail.trim().toLowerCase() : '',
      removeUnmatched: Boolean(merged.removeUnmatched),
      mappings
    };
  };

  const loadGoogleServiceAccount = () => {
    const json = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const accountPath = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (json) {
      return JSON.parse(json);
    }
    if (accountPath) {
      return require(path.resolve(accountPath));
    }
    return null;
  };

  const loadGoogleAdminServiceAccount = () => {
    const json = process.env.GOOGLE_ADMIN_SERVICE_ACCOUNT_JSON
      || process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON
      || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const accountPath = process.env.GOOGLE_ADMIN_SERVICE_ACCOUNT_PATH
      || process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH
      || process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (json) {
      return JSON.parse(json);
    }
    if (accountPath) {
      return require(path.resolve(accountPath));
    }
    return null;
  };

  const getGoogleSheetsClient = async () => {
    const accountPath = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (accountPath) {
      const auth = new google.auth.JWT({
        keyFile: path.resolve(accountPath),
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      await auth.authorize();
      return google.sheets({ version: 'v4', auth });
    }

    const serviceAccount = loadGoogleServiceAccount();
    if (!serviceAccount) {
      throw new Error('Google Sheets service account is not configured');
    }

    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    await auth.authorize();
    return google.sheets({ version: 'v4', auth });
  };

  const getGoogleGroupsConfig = async () => {
    const raw = await db.getSetting(GOOGLE_GROUPS_SETTING_KEY);
    if (!raw) return { ...DEFAULT_GOOGLE_GROUPS_CONFIG };
    try {
      return normalizeGoogleGroupsConfig(JSON.parse(raw));
    } catch (error) {
      return { ...DEFAULT_GOOGLE_GROUPS_CONFIG };
    }
  };

  const getPublicSignupConfig = async () => {
    const raw = await db.getSetting(PUBLIC_SIGNUP_SETTING_KEY);
    if (!raw) return { ...DEFAULT_PUBLIC_SIGNUP_CONFIG };
    try {
      return normalizePublicSignupConfig(JSON.parse(raw));
    } catch (error) {
      return { ...DEFAULT_PUBLIC_SIGNUP_CONFIG };
    }
  };

  const normalizeOptionList = (value, allowed) => {
    const rawList = Array.isArray(value) ? value : String(value || '').split(',');
    const normalized = rawList
      .map(item => String(item || '').trim())
      .filter(Boolean)
      .filter(item => allowed.includes(item));
    return normalized.length > 0 ? normalized : [...allowed];
  };

  const getMemberRoleOptions = async () => {
    const raw = await db.getSetting(MEMBER_ROLE_OPTIONS_KEY);
    if (!raw) return [...DEFAULT_MEMBER_ROLE_OPTIONS];
    try {
      return normalizeOptionList(JSON.parse(raw), DEFAULT_MEMBER_ROLE_OPTIONS);
    } catch (error) {
      return [...DEFAULT_MEMBER_ROLE_OPTIONS];
    }
  };

  const getMemberActivityOptions = async () => {
    const raw = await db.getSetting(MEMBER_ACTIVITY_OPTIONS_KEY);
    if (!raw) return [...DEFAULT_MEMBER_ACTIVITY_OPTIONS];
    try {
      return normalizeOptionList(JSON.parse(raw), DEFAULT_MEMBER_ACTIVITY_OPTIONS);
    } catch (error) {
      return [...DEFAULT_MEMBER_ACTIVITY_OPTIONS];
    }
  };

  const getGoogleAdminClient = async (adminEmail) => {
    const scopes = [
      'https://www.googleapis.com/auth/admin.directory.group',
      'https://www.googleapis.com/auth/admin.directory.group.member'
    ];
    const accountPath = process.env.GOOGLE_ADMIN_SERVICE_ACCOUNT_PATH
      || process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH
      || process.env.GOOGLE_SERVICE_ACCOUNT_PATH;

    if (accountPath) {
      const auth = new google.auth.JWT({
        keyFile: path.resolve(accountPath),
        scopes,
        subject: adminEmail
      });
      await auth.authorize();
      return google.admin({ version: 'directory_v1', auth });
    }

    const serviceAccount = loadGoogleAdminServiceAccount();
    if (!serviceAccount) {
      throw new Error('Google Admin service account is not configured');
    }

    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      scopes,
      adminEmail
    );
    await auth.authorize();
    return google.admin({ version: 'directory_v1', auth });
  };

  const getGoogleSheetsConfig = async () => {
    const raw = await db.getSetting(GOOGLE_SHEETS_SETTING_KEY);
    if (!raw) return { ...DEFAULT_GOOGLE_SHEETS_CONFIG };
    try {
      return normalizeGoogleSheetsConfig(JSON.parse(raw));
    } catch (error) {
      return { ...DEFAULT_GOOGLE_SHEETS_CONFIG };
    }
  };

  const formatSheetCell = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const runGoogleSheetsSync = async () => {
    const config = await getGoogleSheetsConfig();
    if (!config.enabled || !config.spreadsheetId) {
      return { skipped: true };
    }

    const sheetsClient = await getGoogleSheetsClient();
    const tables = await db.getTableNames();
    const prefix = config.sheetPrefix || '';

    const sheetResponse = await sheetsClient.spreadsheets.get({
      spreadsheetId: config.spreadsheetId
    });

    const existingSheets = new Set(
      (sheetResponse.data.sheets || []).map(sheet => sheet.properties?.title).filter(Boolean)
    );

    const requests = [];
    for (const table of tables) {
      const title = `${prefix}${table}`;
      if (!existingSheets.has(title)) {
        requests.push({ addSheet: { properties: { title } } });
      }
    }

    if (requests.length > 0) {
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: config.spreadsheetId,
        requestBody: { requests }
      });
    }

    for (const table of tables) {
      const title = `${prefix}${table}`;
      const { columns, rows } = await db.getTableData(table);
      const values = [columns, ...rows.map(row => columns.map(column => formatSheetCell(row[column])))]
      await sheetsClient.spreadsheets.values.clear({
        spreadsheetId: config.spreadsheetId,
        range: title
      });
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values }
      });
    }

    return { synced: true, tables: tables.length };
  };

  const listGoogleGroupMembers = async (adminClient, groupKey) => {
    const members = [];
    let pageToken = undefined;
    do {
      const response = await adminClient.members.list({
        groupKey,
        maxResults: 200,
        pageToken
      });
      const dataMembers = response.data?.members || [];
      for (const member of dataMembers) {
        if (member?.email) {
          members.push(String(member.email).trim().toLowerCase());
        }
      }
      pageToken = response.data?.nextPageToken;
    } while (pageToken);
    return members;
  };

  const runGoogleGroupsSync = async () => {
    const config = await getGoogleGroupsConfig();
    if (!config.enabled) {
      return { skipped: true };
    }
    if (!config.adminEmail) {
      throw new Error('Admin email is required for Google Groups sync');
    }
    if (!Array.isArray(config.mappings) || config.mappings.length === 0) {
      return { skipped: true, reason: 'No mappings configured' };
    }

    const adminClient = await getGoogleAdminClient(config.adminEmail);
    const members = await db.getAllMembers();
    const activeMembers = (members || []).filter(member => {
      const status = String(member.Status || '').toLowerCase();
      return status === 'active' && member.Email;
    });

    const expectedByGroup = new Map();
    const normalizedMappings = config.mappings.map(mapping => ({
      memberTypes: Array.isArray(mapping.memberTypes)
        ? mapping.memberTypes.map(type => String(type || '').trim().toLowerCase()).filter(Boolean)
        : [],
      roles: Array.isArray(mapping.roles)
        ? mapping.roles.map(role => String(role || '').trim()).filter(Boolean)
        : [],
      activities: Array.isArray(mapping.activities)
        ? mapping.activities.map(activity => String(activity || '').trim()).filter(Boolean)
        : [],
      groups: Array.isArray(mapping.groups) ? mapping.groups : []
    }));

    const matchesMapping = (member, mapping) => {
      if (mapping.memberTypes.length > 0) {
        const memberType = String(member.MemberType || '').trim().toLowerCase();
        if (!mapping.memberTypes.includes(memberType)) return false;
      }

      if (mapping.roles.length > 0) {
        const hasRole = mapping.roles.some(role => {
          if (role === 'BoardMember') return Number(member.BoardMember) === 1;
          if (role === 'Officer') return Number(member.Officer) === 1;
          return false;
        });
        if (!hasRole) return false;
      }

      if (mapping.activities.length > 0) {
        const hasActivity = mapping.activities.some(activity => {
          if (activity === 'YoungEaglePilot') return Number(member.YoungEaglePilot) === 1;
          if (activity === 'YoungEagleVolunteer') return Number(member.YoungEagleVolunteer) === 1;
          if (activity === 'EaglePilot') return Number(member.EaglePilot) === 1;
          if (activity === 'EagleFlightVolunteer') return Number(member.EagleFlightVolunteer) === 1;
          return false;
        });
        if (!hasActivity) return false;
      }

      return true;
    };

    for (const mapping of normalizedMappings) {
      for (const group of mapping.groups) {
        const groupKey = String(group || '').trim().toLowerCase();
        if (!groupKey) continue;
        if (!expectedByGroup.has(groupKey)) {
          expectedByGroup.set(groupKey, new Set());
        }
      }
    }

    for (const member of activeMembers) {
      const email = String(member.Email || '').trim().toLowerCase();
      if (!email) continue;
      for (const mapping of normalizedMappings) {
        if (!matchesMapping(member, mapping)) continue;
        for (const group of mapping.groups) {
          const groupKey = String(group || '').trim().toLowerCase();
          if (!groupKey) continue;
          if (!expectedByGroup.has(groupKey)) {
            expectedByGroup.set(groupKey, new Set());
          }
          expectedByGroup.get(groupKey).add(email);
        }
      }
    }

    const results = [];
    for (const [groupKey, expectedSet] of expectedByGroup.entries()) {
      const currentMembers = new Set(await listGoogleGroupMembers(adminClient, groupKey));
      const toAdd = Array.from(expectedSet).filter(email => !currentMembers.has(email));
      const toRemove = config.removeUnmatched
        ? Array.from(currentMembers).filter(email => !expectedSet.has(email))
        : [];

      let added = 0;
      let removed = 0;

      for (const email of toAdd) {
        try {
          await adminClient.members.insert({
            groupKey,
            requestBody: { email, role: 'MEMBER' }
          });
          added += 1;
        } catch (error) {
          if (error?.code === 409) continue;
          console.error(`Failed to add ${email} to ${groupKey}:`, error?.message || error);
        }
      }

      if (config.removeUnmatched) {
        for (const email of toRemove) {
          try {
            await adminClient.members.delete({
              groupKey,
              memberKey: email
            });
            removed += 1;
          } catch (error) {
            if (error?.code === 404) continue;
            console.error(`Failed to remove ${email} from ${groupKey}:`, error?.message || error);
          }
        }
      }

      results.push({
        group: groupKey,
        expected: expectedSet.size,
        added,
        removed
      });
    }

    return { synced: true, groups: results };
  };

  let googleSheetsSyncTimer = null;
  let googleSheetsSyncRunning = false;
  const scheduleGoogleSheetsSync = () => {
    if (googleSheetsSyncTimer) {
      clearTimeout(googleSheetsSyncTimer);
    }

    googleSheetsSyncTimer = setTimeout(async () => {
      if (googleSheetsSyncRunning) return;
      googleSheetsSyncRunning = true;
      try {
        await runGoogleSheetsSync();
      } catch (error) {
        console.error('Google Sheets sync failed:', error);
      } finally {
        googleSheetsSyncRunning = false;
      }
    }, 5000);
  };

  let googleGroupsSyncTimer = null;
  let googleGroupsSyncRunning = false;
  const scheduleGoogleGroupsSync = () => {
    if (googleGroupsSyncTimer) {
      clearTimeout(googleGroupsSyncTimer);
    }

    googleGroupsSyncTimer = setTimeout(async () => {
      if (googleGroupsSyncRunning) return;
      googleGroupsSyncRunning = true;
      try {
        await runGoogleGroupsSync();
      } catch (error) {
        console.error('Google Groups sync failed:', error);
      } finally {
        googleGroupsSyncRunning = false;
      }
    }, 5000);
  };

  const normalizeReportSchedule = (input = {}) => {
    const merged = { ...DEFAULT_REPORT_SCHEDULE, ...(input || {}) };
    const allowedReports = new Set(AVAILABLE_SCHEDULED_REPORTS.map(r => r.id));
    const recipients = Array.isArray(merged.recipients)
      ? merged.recipients
      : String(merged.recipients || '').split(',');

    return {
      enabled: Boolean(merged.enabled),
      recipients: recipients.map(r => String(r).trim()).filter(Boolean),
      reports: Array.isArray(merged.reports)
        ? merged.reports.filter(r => allowedReports.has(r))
        : DEFAULT_REPORT_SCHEDULE.reports,
      datePreset: VALID_DATE_PRESETS.includes(merged.datePreset) ? merged.datePreset : DEFAULT_REPORT_SCHEDULE.datePreset,
      status: VALID_STATUSES.includes(merged.status) ? merged.status : DEFAULT_REPORT_SCHEDULE.status,
      frequency: VALID_FREQUENCIES.includes(merged.frequency) ? merged.frequency : DEFAULT_REPORT_SCHEDULE.frequency,
      time: typeof merged.time === 'string' && merged.time.includes(':') ? merged.time : DEFAULT_REPORT_SCHEDULE.time,
      dayOfWeek: Number.isFinite(Number(merged.dayOfWeek)) ? Number(merged.dayOfWeek) : DEFAULT_REPORT_SCHEDULE.dayOfWeek,
      dayOfMonth: Number.isFinite(Number(merged.dayOfMonth)) ? Number(merged.dayOfMonth) : DEFAULT_REPORT_SCHEDULE.dayOfMonth
    };
  };

  const buildReportCron = (config) => {
    const [hourStr, minuteStr] = String(config.time || '08:00').split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    const safeHour = Number.isFinite(hour) ? hour : 8;
    const safeMinute = Number.isFinite(minute) ? minute : 0;

    if (config.frequency === 'weekly') {
      return `${safeMinute} ${safeHour} * * ${config.dayOfWeek}`;
    }
    if (config.frequency === 'monthly') {
      return `${safeMinute} ${safeHour} ${config.dayOfMonth} * *`;
    }
    return `${safeMinute} ${safeHour} * * *`;
  };

  const getNowInTimeZone = (timeZone) => {
    return new Date(new Date().toLocaleString('en-US', { timeZone }));
  };

  const getPresetRange = (preset, timeZone) => {
    const now = getNowInTimeZone(timeZone);
    const start = new Date(now);
    const end = new Date(now);

    switch (preset) {
      case 'last_7_days':
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last_30_days':
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last_month':
        start.setMonth(start.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this_year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'last_year':
        start.setFullYear(start.getFullYear() - 1, 0, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(end.getFullYear() - 1, 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  const buildSquarePaymentsCsv = (transactions) => {
    const headers = [
      'Type',
      'Date',
      'Status',
      'Amount',
      'Fee',
      'Refunded',
      'Customer Name',
      'Customer Email',
      'Items',
      'Refund Reason',
      'Receipt Number',
      'Receipt URL',
      'Card Brand',
      'Card Last4'
    ];

    const rows = transactions.map((txn) => {
      const createdAt = txn.created_at ? new Date(txn.created_at).toISOString() : '';
      const amount = txn.amount_money?.amount ? (txn.amount_money.amount / 100).toFixed(2) : '';
      const fee = txn.processing_fee?.amount ? (txn.processing_fee.amount / 100).toFixed(2) : '';
      const refunded = txn.total_refunded ? (txn.total_refunded / 100).toFixed(2) : '';
      const items = txn.order_items && txn.order_items.length > 0
        ? txn.order_items.map((item) => `${item.quantity || ''}x ${item.name || ''}`.trim()).join(' | ')
        : '';

      return [
        txn.transaction_type || 'payment',
        createdAt,
        txn.status || '',
        amount,
        fee,
        refunded,
        txn.customer_name || '',
        txn.buyer_email || '',
        items,
        txn.refund_reason || '',
        txn.receipt_number || '',
        txn.receipt_url || '',
        txn.card_details?.brand || '',
        txn.card_details?.last4 || ''
      ];
    });

    const escapeCell = (value) => {
      const safeValue = value ?? '';
      const stringValue = String(safeValue);
      if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCell(cell)).join(','))
      .join('\n');

    return { csvContent, rowCount: rows.length };
  };

  const getReportScheduleConfig = async () => {
    const stored = await db.getSetting(REPORT_SCHEDULE_SETTING_KEY);
    if (!stored) {
      return normalizeReportSchedule(DEFAULT_REPORT_SCHEDULE);
    }

    try {
      const parsed = JSON.parse(stored);
      return normalizeReportSchedule(parsed);
    } catch (error) {
      return normalizeReportSchedule(DEFAULT_REPORT_SCHEDULE);
    }
  };

  let reportScheduleTask = null;

  const scheduleReportJob = async () => {
    if (reportScheduleTask) {
      reportScheduleTask.stop();
      reportScheduleTask = null;
    }

    const config = await getReportScheduleConfig();
    if (!config.enabled || config.recipients.length === 0 || config.reports.length === 0) {
      return;
    }

    const timezone = (await db.getSetting('timezone')) || 'America/Chicago';
    const cronExpression = buildReportCron(config);

    reportScheduleTask = cron.schedule(cronExpression, async () => {
      try {
        await runScheduledReports(config, timezone);
      } catch (error) {
        console.error('[REPORTS] Scheduled report error:', error);
      }
    }, { timezone });
  };

  const runScheduledReports = async (config, timezone) => {
    if (!config.enabled || config.recipients.length === 0 || config.reports.length === 0) {
      return;
    }

    const range = getPresetRange(config.datePreset, timezone);
    const attachments = [];
    const summaryLines = [];

    for (const reportId of config.reports) {
      if (reportId === 'square_payments') {
        if (!squareService.isConfigured()) {
          console.warn('[REPORTS] Square is not configured; skipping Square report');
          continue;
        }
        const transactions = await fetchSquareTransactions({
          beginTime: range.start.toISOString(),
          endTime: range.end.toISOString()
        });

        const filtered = config.status === 'ALL'
          ? transactions
          : transactions.filter(txn => txn.status === config.status);

        const { csvContent, rowCount } = buildSquarePaymentsCsv(filtered);
        attachments.push({
          filename: `square-payments-${config.datePreset}.csv`,
          content: csvContent,
          contentType: 'text/csv'
        });
        summaryLines.push(`<li>Square Payment Data: ${rowCount} rows</li>`);
      }
    }

    if (attachments.length === 0) {
      return;
    }

    const subject = `Scheduled Reports (${config.datePreset.replace(/_/g, ' ')})`;
    const html = `
      <p>Attached are your scheduled reports for ${config.datePreset.replace(/_/g, ' ')}.</p>
      <ul>${summaryLines.join('')}</ul>
      <p>Range: ${range.start.toISOString()} to ${range.end.toISOString()}</p>
    `;

    await emailService.sendReportEmail({
      recipients: config.recipients,
      subject,
      html,
      attachments
    });
  };

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
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const isExpiringSoon = (dateString) => {
      if (!dateString) return false;
      const expirationDate = new Date(dateString);
      if (Number.isNaN(expirationDate.getTime())) return false;
      return expirationDate <= thirtyDaysFromNow;
    };
    
    const stats = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.Status === 'Active').length,
      renewalsDue: members.filter(m => m.LastPaidYear < currentYear && m.MemberType !== 'Family Member').length,
      youthProtectionExpiring: members.filter(m => {
        return isExpiringSoon(m.YouthProtectionExpiration)
          || isExpiringSoon(m.BackgroundCheckExpiration);
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

    const isExpiringSoon = (dateString) => {
      if (!dateString) return false;
      const expirationDate = new Date(dateString);
      if (Number.isNaN(expirationDate.getTime())) return false;
      return expirationDate <= thirtyDaysFromNow;
    };

    const getSoonestDate = (member) => {
      const dates = [member.YouthProtectionExpiration, member.BackgroundCheckExpiration]
        .map(val => (val ? new Date(val) : null))
        .filter(date => date && !Number.isNaN(date.getTime()));
      if (dates.length === 0) return null;
      return dates.sort((a, b) => a.getTime() - b.getTime())[0];
    };
    
    const expiringMembers = members
      .filter(m => isExpiringSoon(m.YouthProtectionExpiration) || isExpiringSoon(m.BackgroundCheckExpiration))
      .sort((a, b) => {
        const dateA = getSoonestDate(a);
        const dateB = getSoonestDate(b);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
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
    'FirstName','LastName','Email','Phone','Street','City','State','Zip','MemberType','Status','DuesRate','EAANumber','Notes','HouseholdID','LastPaidYear','AmountDue',
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
      const Street = r.Street?.trim() || null;
      const City = r.City?.trim() || null;
      const State = r.State?.trim() || null;
      const Zip = r.Zip?.trim() || null;
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
          Street,
          City,
          State,
          Zip,
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

    if (imported > 0) {
      scheduleGoogleSheetsSync();
      scheduleGoogleGroupsSync();
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
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'CREATE', 'members', result.id, null, req.body, ipAddress, 'Created new member');
    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
    res.json({ success: true, id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Update member
app.put('/api/members/:id', async (req, res) => {
  try {
    const oldMember = await db.getMemberById(req.params.id);
    await db.updateMember(req.params.id, req.body);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'UPDATE', 'members', req.params.id, oldMember, req.body, ipAddress, 'Updated member');
    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete member
app.delete('/api/members/:id', async (req, res) => {
  try {
    const oldMember = await db.getMemberById(req.params.id);
    await db.deleteMember(req.params.id);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'DELETE', 'members', req.params.id, oldMember, null, ipAddress, 'Deleted member');
    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
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
    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
    res.json(familyMember);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Remove family member
app.delete('/api/members/:id/family/:familyId', async (req, res) => {
  try {
    await db.removeFamilyMember(req.params.familyId);
    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
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
    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
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
        order_id: invoice.orderId || invoice.order_id,
        amount_money: invoice.totalMoney || invoice.total_money,
        status: 'COMPLETED',
        invoice_id: invoice.id
      };
    }

    console.log('[WEBHOOK] Payment ID:', payment?.id, 'Status:', payment?.status, 'Order ID:', payment?.order_id || payment?.orderId);

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

    const orderId = payment.orderId || payment.order_id;
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

    const amountCents =
      payment.amountMoney?.amount ||
      payment.amount_money?.amount ||
      order?.totalMoney?.amount ||
      order?.total_money?.amount ||
      0;
    const amount = Number(amountCents) / 100;
    console.log('[WEBHOOK] Amount: $' + amount + ' (' + amountCents + ' cents)');

    // Separate dues from fee
    const squareFee = await db.getSquareFeeAmount(1);
    const feeAmount = Number.isFinite(squareFee) ? squareFee : 0;
    const duesAmount = Math.max(0, amount - feeAmount);

    console.log('[WEBHOOK] Creating payment record...');
    // Record payment even if metadata is missing - helps with debugging
    await db.createPayment(memberId, year, amount, 'square', {
      Provider: 'square',
      ProviderPaymentId: payment.id,
      ProviderOrderId: orderId,
      ProviderInvoiceId: payment.invoice_id || null,
      ProviderStatus: payment.status,
      DuesAmount: duesAmount,
      SquareFee: feeAmount
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

    scheduleGoogleSheetsSync();

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
    const { Year, Amount, Method, DuesAmount, SquareFee } = req.body;
    const yearNum = Number(Year);
    const amountNum = Number(Amount);

    if (!memberId || !Number.isFinite(yearNum)) {
      return res.status(400).json({ error: 'Valid Year is required' });
    }

    // Manual payments are marked as COMPLETED since they represent received payments
    const result = await db.createPayment(memberId, yearNum, Number.isFinite(amountNum) ? amountNum : 0, Method || 'manual', {
      Provider: Method || 'manual',
      ProviderStatus: 'COMPLETED',
      DuesAmount: DuesAmount !== undefined ? Number(DuesAmount) : 0,
      SquareFee: SquareFee !== undefined ? Number(SquareFee) : 0
    });
    await db.refreshMemberPaymentSummary(memberId);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'CREATE', 'payments', result.id, null, { MemberID: memberId, Year: yearNum, Amount: amountNum, Method, DuesAmount, SquareFee }, ipAddress, 'Created manual payment');
    scheduleGoogleSheetsSync();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/payments/:id', async (req, res) => {
  try {
    const paymentId = Number(req.params.id);
    const { Year, Amount, Method, MemberID, Provider, ProviderStatus, ProviderPaymentId, ProviderOrderId, ProviderInvoiceId, ProviderLinkId, DuesAmount, SquareFee } = req.body;
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
      ProviderLinkId,
      DuesAmount: DuesAmount !== undefined ? Number(DuesAmount) : null,
      SquareFee: SquareFee !== undefined ? Number(SquareFee) : null
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
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'UPDATE', 'payments', paymentId, payment, req.body, ipAddress, 'Updated payment');
    scheduleGoogleSheetsSync();
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
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'DELETE', 'payments', paymentId, payment, null, ipAddress, 'Deleted payment');
    scheduleGoogleSheetsSync();
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
    const toFlag = (value) => Number(Boolean(value));
    const result = await db.createMemberType({
      Name: Name.trim(),
      DuesRate: Number(DuesRate) || 0,
      SortOrder: Number(SortOrder) || 0,
      BoardMember: toFlag(req.body.BoardMember),
      Officer: toFlag(req.body.Officer),
      YoungEaglePilot: toFlag(req.body.YoungEaglePilot),
      YoungEagleVolunteer: toFlag(req.body.YoungEagleVolunteer),
      EaglePilot: toFlag(req.body.EaglePilot),
      EagleFlightVolunteer: toFlag(req.body.EagleFlightVolunteer)
    });
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'CREATE', 'member_types', result.id, null, req.body, ipAddress, 'Created member type');
    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
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
    const toFlag = (value) => Number(Boolean(value));
    await db.updateMemberType(req.params.id, {
      Name: Name.trim(),
      DuesRate: Number(DuesRate) || 0,
      SortOrder: Number(SortOrder) || 0,
      BoardMember: toFlag(req.body.BoardMember),
      Officer: toFlag(req.body.Officer),
      YoungEaglePilot: toFlag(req.body.YoungEaglePilot),
      YoungEagleVolunteer: toFlag(req.body.YoungEagleVolunteer),
      EaglePilot: toFlag(req.body.EaglePilot),
      EagleFlightVolunteer: toFlag(req.body.EagleFlightVolunteer)
    });
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'UPDATE', 'member_types', req.params.id, null, req.body, ipAddress, 'Updated member type');
    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/settings/member-types/:id', async (req, res) => {
  try {
    await db.deleteMemberType(req.params.id);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'DELETE', 'member_types', req.params.id, null, null, ipAddress, 'Deleted member type');
    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
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
    const oldValue = await db.getSquareFeeAmount(1);
    await db.setSetting('square_fee_amount', fee);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'UPDATE', 'app_settings', null, { squareFeeAmount: oldValue }, { squareFeeAmount: fee }, ipAddress, 'Updated payment settings');
    scheduleGoogleSheetsSync();
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
    const oldValue = await db.getSetting('timezone');
    await db.setSetting('timezone', timezone);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'UPDATE', 'app_settings', null, { timezone: oldValue }, { timezone }, ipAddress, 'Updated timezone settings');
    scheduleGoogleSheetsSync();
    res.json({ success: true, timezone });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Google Sheets settings
app.get('/api/settings/google-sheets', async (req, res) => {
  try {
    const config = await getGoogleSheetsConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/google-sheets', async (req, res) => {
  try {
    const normalized = normalizeGoogleSheetsConfig(req.body || {});
    if (normalized.enabled && !normalized.spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is required when sync is enabled' });
    }

    const oldValue = await db.getSetting(GOOGLE_SHEETS_SETTING_KEY);
    await db.setSetting(GOOGLE_SHEETS_SETTING_KEY, JSON.stringify(normalized));
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(
      req.user.email,
      'UPDATE',
      'app_settings',
      null,
      { googleSheets: oldValue },
      { googleSheets: normalized },
      ipAddress,
      'Updated Google Sheets settings'
    );

    scheduleGoogleSheetsSync();
    res.json({ success: true, config: normalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/google-sheets/sync', async (req, res) => {
  try {
    const result = await runGoogleSheetsSync();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Google Groups settings
app.get('/api/settings/google-groups', async (req, res) => {
  try {
    const config = await getGoogleGroupsConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/google-groups', async (req, res) => {
  try {
    const normalized = normalizeGoogleGroupsConfig(req.body || {});
    if (normalized.enabled && !normalized.adminEmail) {
      return res.status(400).json({ error: 'Admin email is required when Google Groups sync is enabled' });
    }
    if (normalized.enabled && normalized.mappings.length === 0) {
      return res.status(400).json({ error: 'At least one member type mapping is required when Google Groups sync is enabled' });
    }

    const oldValue = await db.getSetting(GOOGLE_GROUPS_SETTING_KEY);
    await db.setSetting(GOOGLE_GROUPS_SETTING_KEY, JSON.stringify(normalized));
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(
      req.user.email,
      'UPDATE',
      'app_settings',
      null,
      { googleGroups: oldValue },
      { googleGroups: normalized },
      ipAddress,
      'Updated Google Groups settings'
    );

    scheduleGoogleGroupsSync();
    res.json({ success: true, config: normalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/google-groups/sync', async (req, res) => {
  try {
    const result = await runGoogleGroupsSync();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Member role/activity options
app.get('/api/settings/member-options', async (req, res) => {
  try {
    const roles = await getMemberRoleOptions();
    const activities = await getMemberActivityOptions();
    res.json({ roles, activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/member-options', async (req, res) => {
  try {
    const roles = normalizeOptionList(req.body?.roles, DEFAULT_MEMBER_ROLE_OPTIONS);
    const activities = normalizeOptionList(req.body?.activities, DEFAULT_MEMBER_ACTIVITY_OPTIONS);

    const oldRoles = await db.getSetting(MEMBER_ROLE_OPTIONS_KEY);
    const oldActivities = await db.getSetting(MEMBER_ACTIVITY_OPTIONS_KEY);
    await db.setSetting(MEMBER_ROLE_OPTIONS_KEY, JSON.stringify(roles));
    await db.setSetting(MEMBER_ACTIVITY_OPTIONS_KEY, JSON.stringify(activities));

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(
      req.user.email,
      'UPDATE',
      'app_settings',
      null,
      { roles: oldRoles, activities: oldActivities },
      { roles, activities },
      ipAddress,
      'Updated member role/activity options'
    );

    scheduleGoogleSheetsSync();
    scheduleGoogleGroupsSync();
    res.json({ success: true, roles, activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Public member signup settings
app.get('/api/settings/public-signup', async (req, res) => {
  try {
    const config = await getPublicSignupConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/public-signup', async (req, res) => {
  try {
    const normalized = normalizePublicSignupConfig(req.body || {});
    if (normalized.enabled && !normalized.defaultMemberType) {
      return res.status(400).json({ error: 'Default member type is required when signup is enabled' });
    }

    const oldValue = await db.getSetting(PUBLIC_SIGNUP_SETTING_KEY);
    await db.setSetting(PUBLIC_SIGNUP_SETTING_KEY, JSON.stringify(normalized));
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(
      req.user.email,
      'UPDATE',
      'app_settings',
      null,
      { publicSignup: oldValue },
      { publicSignup: normalized },
      ipAddress,
      'Updated public signup settings'
    );
    res.json({ success: true, config: normalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Public signup submissions
app.get('/api/public-signups', async (req, res) => {
  try {
    const limit = req.query?.limit ? Number(req.query.limit) : 200;
    const rows = await db.listPublicSignups(limit);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public-signups/summary', async (req, res) => {
  try {
    const newCount = await db.countPublicSignupsByStatus('new');
    res.json({ newCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/public-signups/:id/reply', async (req, res) => {
  try {
    const signup = await db.getPublicSignupById(req.params.id);
    if (!signup) {
      return res.status(404).json({ error: 'Signup not found' });
    }
    const subject = String(req.body?.subject || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    const html = body
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => `<p>${line}</p>`)
      .join('');

    const replyToEmail = String(req.body?.replyToEmail || '').trim() || (process.env.CHAPTER_EMAIL || '');

    const sendResult = await emailService.sendReportEmail({
      recipients: signup.Email,
      subject,
      html,
      replyTo: replyToEmail
    });

    if (!sendResult.success) {
      return res.status(500).json({ error: sendResult.error || 'Failed to send reply' });
    }

    await db.savePublicSignupReply(req.params.id, { subject, body, replyToEmail });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/settings/google-groups/groups', async (req, res) => {
  try {
    const config = await getGoogleGroupsConfig();
    const adminEmail = config.adminEmail;
    if (!adminEmail) {
      return res.status(400).json({ error: 'Admin email is required to load groups' });
    }

    const adminClient = await getGoogleAdminClient(adminEmail);
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';

    const groups = [];
    let pageToken = undefined;
    do {
      const response = await adminClient.groups.list({
        customer: 'my_customer',
        maxResults: 200,
        pageToken,
        query: query || undefined
      });
      const dataGroups = response.data?.groups || [];
      for (const group of dataGroups) {
        if (group?.email) {
          groups.push({
            email: String(group.email).trim().toLowerCase(),
            name: group?.name ? String(group.name) : ''
          });
        }
      }
      pageToken = response.data?.nextPageToken;
    } while (pageToken);

    res.json({ groups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Scheduled report settings
app.get('/api/settings/report-schedule', async (req, res) => {
  try {
    const config = await getReportScheduleConfig();
    res.json({ config, availableReports: AVAILABLE_SCHEDULED_REPORTS });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/report-schedule', async (req, res) => {
  try {
    const normalized = normalizeReportSchedule(req.body || {});
    const cronExpression = buildReportCron(normalized);

    if (!cron.validate(cronExpression)) {
      return res.status(400).json({ error: 'Invalid schedule settings' });
    }

    const oldValue = await db.getSetting(REPORT_SCHEDULE_SETTING_KEY);
    await db.setSetting(REPORT_SCHEDULE_SETTING_KEY, JSON.stringify(normalized));

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'UPDATE', 'app_settings', null, { reportSchedule: oldValue }, { reportSchedule: normalized }, ipAddress, 'Updated report schedule settings');

    await scheduleReportJob();
    scheduleGoogleSheetsSync();

    res.json({ success: true, config: normalized, cron: cronExpression });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings/report-schedule/send-now', async (req, res) => {
  try {
    const storedConfig = await getReportScheduleConfig();
    const override = req.body || {};
    const config = normalizeReportSchedule({
      ...storedConfig,
      recipients: override.recipients ?? storedConfig.recipients,
      reports: override.reports ?? storedConfig.reports,
      datePreset: override.datePreset ?? storedConfig.datePreset,
      status: override.status ?? storedConfig.status,
      enabled: true
    });

    if (config.recipients.length === 0 || config.reports.length === 0) {
      return res.status(400).json({ error: 'Recipients and reports are required to send now' });
    }

    const timezone = (await db.getSetting('timezone')) || 'America/Chicago';
    await runScheduledReports(config, timezone);

    res.json({ success: true, message: 'Report sent successfully' });
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
    const oldTemplate = await db.getEmailTemplate('renewal');
    await db.saveEmailTemplate('renewal', subject.trim(), body.trim());
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'UPDATE', 'email_templates', null, oldTemplate, { subject, body }, ipAddress, 'Updated email template');
    scheduleGoogleSheetsSync();
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

// API: Get audit logs (admin only)
app.get('/api/audit-logs', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const filters = {
      userEmail: req.query.userEmail,
      action: req.query.action,
      tableName: req.query.tableName,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit ? Number(req.query.limit) : 1000
    };
    const logs = await db.getAuditLogs(filters);
    res.json(logs);
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
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'CREATE', 'user_allowlist', null, null, { email: normalizedEmail, role: normalizedRole, memberId }, ipAddress, 'Added user to allowlist');
    scheduleGoogleSheetsSync();
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
    const oldUser = await db.getUserAllowlistByEmail(normalizedEmail);
    await db.updateUserAllowlist(normalizedEmail, {
      role: normalizedRole,
      memberId: memberId ? Number(memberId) : null
    });
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'UPDATE', 'user_allowlist', null, oldUser, { role: normalizedRole, memberId }, ipAddress, 'Updated user allowlist');
    scheduleGoogleSheetsSync();
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
    const oldUser = await db.getUserAllowlistByEmail(normalizedEmail);
    await db.removeUserAllowlist(normalizedEmail);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    await db.logAudit(req.user.email, 'DELETE', 'user_allowlist', null, oldUser, null, ipAddress, 'Removed user from allowlist');
    scheduleGoogleSheetsSync();
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

// Reports endpoint - paid members summary by year
app.get('/api/reports/payments/paid-members', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const rows = await db.getPaidMembersByYearSummary();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching paid members summary:', error);
    res.status(500).json({ error: 'Failed to fetch paid members summary' });
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

// Admin: Backfill Square payments amounts/metadata for reports
app.post('/api/square/backfill-dues', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    if (!squareService.isConfigured()) {
      return res.status(400).json({ error: 'Square is not configured' });
    }

    const rows = await db.getSquarePaymentsNeedingBackfill();
    const squareFee = await db.getSquareFeeAmount(1);
    const feeAmount = Number.isFinite(squareFee) ? squareFee : 0;

    const results = [];
    for (const row of rows) {
      const payment = await squareService.getPayment(row.ProviderPaymentId);
      if (!payment) {
        results.push({ paymentId: row.ProviderPaymentId, status: 'missing' });
        continue;
      }

      if (payment.status !== 'COMPLETED' && payment.status !== 'APPROVED') {
        results.push({ paymentId: row.ProviderPaymentId, status: 'skipped', reason: payment.status });
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

      results.push({ paymentId: row.ProviderPaymentId, status: 'updated', amount });
    }

    res.json({ updated: results.filter(r => r.status === 'updated').length, results });
  } catch (error) {
    console.error('[SQUARE] Backfill error:', error);
    res.status(500).json({ error: 'Failed to backfill Square payments' });
  }
});

const fetchSquareTransactions = async ({ beginTime, endTime }) => {
  const defaultBegin = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const payments = await squareService.listPayments({
    begin_time: beginTime || defaultBegin,
    end_time: endTime || undefined,
    sort_order: 'DESC',
    limit: 100
  });

  console.log('[SQUARE] Received payments from API:', payments.length, 'payments');

  const enrichedPayments = await Promise.all(payments.map(async (payment) => {
    let customerName = null;
    let orderItems = [];
    let refunds = [];

    const isRefund = payment.amountMoney && payment.amountMoney.amount < 0;
    if (isRefund) {
      return { payment, customerName, orderItems, refunds, isRefund };
    }

    if (payment.customerId) {
      try {
        const customer = await squareService.getCustomer(payment.customerId);
        if (customer) {
          customerName = `${customer.givenName || ''} ${customer.familyName || ''}`.trim() || null;
        }
      } catch (error) {
        console.error('[SQUARE] Error fetching customer:', error);
      }
    }

    if (!customerName && payment.cardDetails?.card?.cardholderName) {
      customerName = payment.cardDetails.card.cardholderName;
    }

    if (payment.orderId) {
      try {
        const order = await squareService.getOrder(payment.orderId);
        if (order && order.lineItems) {
          orderItems = order.lineItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            total: Number(item.totalMoney?.amount || 0)
          }));
        }
      } catch (error) {
        console.error('[SQUARE] Error fetching order:', error);
      }
    }

    if (payment.refundIds && payment.refundIds.length > 0) {
      try {
        const refundPromises = payment.refundIds.map(refundId =>
          squareService.getRefund(refundId)
        );
        const refundResults = await Promise.all(refundPromises);
        refunds = refundResults
          .filter(r => r !== null)
          .map(refund => ({
            id: refund.id,
            amount: Number(refund.amountMoney?.amount || 0),
            currency: refund.amountMoney?.currencyCode || 'USD',
            status: refund.status,
            reason: refund.reason,
            created_at: refund.createdAt
          }));
      } catch (error) {
        console.error('[SQUARE] Error fetching refunds:', error);
      }
    }

    return { payment, customerName, orderItems, refunds, isRefund };
  }));

  const transactions = enrichedPayments.map(({ payment, customerName, orderItems, refunds, isRefund }) => {
    const amountMoney = payment.amountMoney || payment.amount_money;
    const tipMoney = payment.tipMoney || payment.tip_money;
    const totalMoney = payment.totalMoney || payment.total_money;
    const approvedMoney = payment.approvedMoney || payment.approved_money;
    const processingFeeData = payment.processingFee && payment.processingFee.length > 0
      ? payment.processingFee[0].amountMoney || payment.processingFee[0].amount_money
      : null;
    const card = payment.cardDetails?.card;
    const cardDetails = card ? {
      brand: card.cardBrand || card.brand,
      last4: card.last4,
      exp_month: card.expMonth,
      exp_year: card.expYear,
      cardholder_name: card.cardholderName,
      entry_method: payment.cardDetails?.entryMethod,
      card_type: card.cardType
    } : null;
    const risk = payment.riskEvaluation || payment.risk_evaluation;

    return {
      id: payment.id,
      transaction_type: isRefund ? 'refund' : 'payment',
      created_at: payment.createdAt || payment.created_at,
      updated_at: payment.updatedAt || payment.updated_at,
      amount_money: amountMoney ? {
        amount: Number(amountMoney.amount),
        currency: amountMoney.currency || amountMoney.currencyCode
      } : null,
      tip_money: tipMoney ? {
        amount: Number(tipMoney.amount),
        currency: tipMoney.currency || tipMoney.currencyCode
      } : null,
      total_money: totalMoney ? {
        amount: Number(totalMoney.amount),
        currency: totalMoney.currency || totalMoney.currencyCode
      } : null,
      approved_money: approvedMoney ? {
        amount: Number(approvedMoney.amount),
        currency: approvedMoney.currency || approvedMoney.currencyCode
      } : null,
      processing_fee: processingFeeData ? {
        amount: Number(processingFeeData.amount),
        currency: processingFeeData.currency || processingFeeData.currencyCode
      } : null,
      status: payment.status,
      payment_source_type: payment.sourceType || payment.payment_source?.type || 'unknown',
      location_id: payment.locationId || payment.location_id,
      buyer_email: payment.buyerEmailAddress || payment.buyer_email_address,
      receipt_number: payment.receiptNumber || payment.receipt_number,
      receipt_url: payment.receiptUrl || payment.receipt_url,
      order_id: payment.orderId || payment.order_id,
      customer_id: payment.customerId || payment.customer_id,
      customer_name: customerName,
      order_items: orderItems,
      refunds: refunds,
      total_refunded: refunds.reduce((sum, r) => sum + r.amount, 0),
      refund_reason: isRefund ? payment.reason : null,
      payment_id: isRefund ? payment.paymentId : null,
      delay_duration: payment.delayDuration || payment.delay_duration,
      delay_action: payment.delayAction || payment.delay_action,
      delayed_until: payment.delayedUntil || payment.delayed_until,
      billing_address: payment.billingAddress || payment.billing_address || null,
      shipping_address: payment.shippingAddress || payment.shipping_address || null,
      card_details: cardDetails,
      risk_evaluation: risk ? {
        risk_level: risk.riskLevel || risk.risk_level,
        created_at: risk.createdAt || risk.created_at
      } : null,
      application_details: payment.applicationDetails || payment.application_details || null,
      version_token: payment.versionToken || payment.version_token || null
    };
  });

  console.log('[SQUARE] Transformed transactions, sending', transactions.length, 'records');
  return sanitizeForJson(transactions);
};

const fetchSquarePayouts = async ({ beginTime, endTime }) => {
  const defaultBegin = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

  const payouts = await squareService.listPayouts({
    begin_time: beginTime || defaultBegin,
    end_time: endTime || undefined,
    sort_order: 'DESC',
    limit: 100
  });

  const payoutDetails = await Promise.all(payouts.map(async (payout) => {
    let entries = [];
    try {
      entries = await squareService.listPayoutEntries(payout.id, { limit: 200 });
    } catch (error) {
      console.error('[SQUARE] Error fetching payout entries:', error);
    }

    const amountMoney = payout.amountMoney || payout.amount_money;
    const payoutFee = payout.payoutFee || payout.payout_fee || [];
    const feeEntryTypes = new Set(['FEE', 'PROCESSING_FEE', 'DEPOSIT_FEE']);

    let feeTotal = 0;
    if (Array.isArray(entries) && entries.length > 0) {
      feeTotal = entries
        .filter(entry => feeEntryTypes.has(entry.type))
        .reduce((sum, entry) => {
          const money = entry.netAmountMoney || entry.net_amount_money || entry.grossAmountMoney || entry.gross_amount_money;
          return sum + Number(money?.amount || 0);
        }, 0);
    } else if (Array.isArray(payoutFee) && payoutFee.length > 0) {
      feeTotal = payoutFee.reduce((sum, fee) => sum + Number(fee.amountMoney?.amount || fee.amount_money?.amount || 0), 0);
    }

    return {
      id: payout.id,
      status: payout.status,
      location_id: payout.locationId || payout.location_id,
      created_at: payout.createdAt || payout.created_at,
      updated_at: payout.updatedAt || payout.updated_at,
      arrival_date: payout.arrivalDate || payout.arrival_date,
      amount_money: amountMoney ? {
        amount: Number(amountMoney.amount || 0),
        currency: amountMoney.currency || amountMoney.currencyCode
      } : null,
      destination: payout.destination ? {
        type: payout.destination.type,
        id: payout.destination.id
      } : null,
      version: payout.version,
      type: payout.type,
      end_to_end_id: payout.endToEndId || payout.end_to_end_id || null,
      number_of_entries: payout.numberOfEntries || payout.number_of_entries || entries.length || null,
      payout_fee: payoutFee,
      fee_amount_money: {
        amount: Number(feeTotal),
        currency: amountMoney?.currency || amountMoney?.currencyCode || 'USD'
      },
      fee_entries_count: entries.filter(entry => feeEntryTypes.has(entry.type)).length
    };
  }));

  return sanitizeForJson(payoutDetails);
};

// Square Analytics - Get transactions with processing fees
app.get('/api/square/payments', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    console.log('[SQUARE] /api/square/payments endpoint called');
    const beginTime = typeof req.query.begin_time === 'string' ? req.query.begin_time : null;
    const endTime = typeof req.query.end_time === 'string' ? req.query.end_time : null;
    const transactions = await fetchSquareTransactions({ beginTime, endTime });
    res.json(transactions);
  } catch (error) {
    console.error('[SQUARE] Error fetching Square payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments from Square' });
  }
});

// Square Analytics - Get payouts (deposits)
app.get('/api/square/payouts', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const beginTime = typeof req.query.begin_time === 'string' ? req.query.begin_time : null;
    const endTime = typeof req.query.end_time === 'string' ? req.query.end_time : null;
    const payouts = await fetchSquarePayouts({ beginTime, endTime });
    res.json(payouts);
  } catch (error) {
    console.error('[SQUARE] Error fetching Square payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts from Square' });
  }
});

// Square Analytics - Get payout entries (deposit details)
app.get('/api/square/payouts/:id/entries', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payoutId = req.params.id;
    if (!payoutId) {
      return res.status(400).json({ error: 'Payout ID is required' });
    }

    const entries = await squareService.listPayoutEntries(payoutId, { limit: 200 });
    const sanitized = sanitizeForJson(entries.map((entry) => {
      const grossMoney = entry.grossAmountMoney || entry.gross_amount_money;
      const feeMoney = entry.feeAmountMoney || entry.fee_amount_money;
      const netMoney = entry.netAmountMoney || entry.net_amount_money;
      const chargeDetails = entry.typeChargeDetails || entry.type_charge_details;
      const refundDetails = entry.typeRefundDetails || entry.type_refund_details;
      const feeDetails = entry.typeFeeDetails || entry.type_fee_details;
      const depositFeeDetails = entry.typeDepositFeeDetails || entry.type_deposit_fee_details;

      return {
        id: entry.id,
        payout_id: entry.payoutId || entry.payout_id,
        effective_at: entry.effectiveAt || entry.effective_at,
        type: entry.type,
        gross_amount_money: grossMoney ? {
          amount: Number(grossMoney.amount || 0),
          currency: grossMoney.currency || grossMoney.currencyCode
        } : null,
        fee_amount_money: feeMoney ? {
          amount: Number(feeMoney.amount || 0),
          currency: feeMoney.currency || feeMoney.currencyCode
        } : null,
        net_amount_money: netMoney ? {
          amount: Number(netMoney.amount || 0),
          currency: netMoney.currency || netMoney.currencyCode
        } : null,
        payment_id: chargeDetails?.paymentId || refundDetails?.paymentId || feeDetails?.paymentId || null,
        refund_id: refundDetails?.refundId || null,
        payout_ref: depositFeeDetails?.payoutId || null
      };
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('[SQUARE] Error fetching payout entries:', error);
    res.status(500).json({ error: 'Failed to fetch payout entries from Square' });
  }
});

function sanitizeForJson(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(sanitizeForJson);
  if (typeof value === 'object') {
    const result = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sanitizeForJson(val);
    }
    return result;
  }
  return value;
}

// Square Analytics - Get account balance
app.get('/api/square/balance', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const balance = await squareService.retrieveBalance();
    res.json(balance);
  } catch (error) {
    console.error('Error fetching Square balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance from Square' });
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
  scheduleReportJob().catch(error => {
    console.error('[REPORTS] Failed to initialize schedule:', error);
  });
});
