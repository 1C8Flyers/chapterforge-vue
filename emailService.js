const nodemailer = require('nodemailer');
require('dotenv').config();
const db = require('./database');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  getDefaultTemplate() {
    return {
      subject: '{{Year}} Membership Renewal - {{ChapterName}}',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{ChapterName}}</h1>
              <p>Membership Renewal Notice</p>
            </div>
            <div class="content">
              <h2>Dear {{FirstName}} {{LastName}},</h2>
              <p>It's time to renew your membership for {{Year}}!</p>
              <div class="details">
                <h3>Membership Details</h3>
                <p><strong>Member:</strong> {{FirstName}} {{LastName}}</p>
                <p><strong>EAA Number:</strong> {{EAANumber}}</p>
                <p><strong>Membership Type:</strong> {{MemberType}}</p>
                <p><strong>Dues Amount:</strong> \${{DuesRate}}</p>
              </div>
              {{#if PaymentLink}}
              <div class="details">
                <h3>Pay Online</h3>
                <p>Use the secure link below to pay online.</p>
                <p><a class="button" href="{{PaymentLink}}">Pay Now (\${{TotalDue}})</a></p>
                {{#if SquareFee}}<p><small>Includes a \${{SquareFee}} processing fee.</small></p>{{/if}}
              </div>
              {{/if}}
              <p>Please submit your renewal payment at your earliest convenience to maintain your active membership status.</p>
              <p>Thank you for your continued support of {{ChapterName}}!</p>
            </div>
            <div class="footer">
              <p>{{ChapterName}}</p>
              <p>{{ChapterEmail}}</p>
            </div>
          </div>
        </body>
        </html>
      `.trim()
    };
  }

  // Simple templating with {{Placeholder}} and {{#if Placeholder}}...{{/if}}
  renderTemplate(htmlBody, subject, member, year, options = {}) {
    const context = {
      Year: year,
      ChapterName: process.env.CHAPTER_NAME || 'Your Chapter',
      ChapterEmail: process.env.CHAPTER_EMAIL || 'info@example.com',
      FirstName: member.FirstName || '',
      LastName: member.LastName || '',
      EAANumber: member.EAANumber || 'N/A',
      MemberType: member.MemberType || 'Member',
      DuesRate: member.DuesRate || member.AmountDue || '0.00',
      PaymentLink: options.PaymentLink || '',
      TotalDue: options.TotalDue || '',
      SquareFee: options.SquareFee || ''
    };

    const escapeHtml = (str) => String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const handleIfBlocks = (tpl) => tpl.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, inner) => {
      const val = context[key];
      return val ? inner : '';
    });

    const replacePlaceholders = (tpl) => tpl.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key === 'DuesRate') {
        const num = Number(context[key] || 0);
        return Number.isFinite(num) ? num.toFixed(2) : escapeHtml(context[key]);
      }
      const val = context[key];
      return val !== undefined ? escapeHtml(val) : '';
    });

    let processedBody = replacePlaceholders(handleIfBlocks(htmlBody));
    if (context.PaymentLink && !htmlBody.includes('{{PaymentLink}}')) {
      const paymentSection = `
              <div class="details">
                <h3>Pay Online</h3>
                <p>Use the secure link below to pay online.</p>
                <p><a class="button" href="${escapeHtml(context.PaymentLink)}">Pay Now (${escapeHtml(context.TotalDue)})</a></p>
                ${context.SquareFee ? `<p><small>Includes a ${escapeHtml(context.SquareFee)} processing fee.</small></p>` : ''}
              </div>
      `;
      if (processedBody.includes('<div class="footer">')) {
        processedBody = processedBody.replace('<div class="footer">', `${paymentSection}<div class="footer">`);
      } else if (processedBody.includes('</body>')) {
        processedBody = processedBody.replace('</body>', `${paymentSection}</body>`);
      } else {
        processedBody += paymentSection;
      }
    }
    const processedSubject = replacePlaceholders(handleIfBlocks(subject));

    return { html: processedBody, subject: processedSubject };
  }

  async verifyHealth(timeoutMs = 3000) {
    const verifyPromise = this.transporter.verify();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs));
    await Promise.race([verifyPromise, timeoutPromise]);
    return { ok: true };
  }

  async sendRenewalNotice(member, year, options = {}) {
    const stored = await db.getEmailTemplate('renewal');
    const defaultTpl = this.getDefaultTemplate();
    const tplSubject = stored?.Subject || defaultTpl.subject;
    const tplHtml = stored?.HtmlBody || defaultTpl.html;
    const rendered = this.renderTemplate(tplHtml, tplSubject, {
      ...member
    }, year, options);

    const mailOptions = {
      from: `"${process.env.CHAPTER_NAME}" <${process.env.CHAPTER_EMAIL}>`,
      to: member.Email,
      subject: rendered.subject,
      html: rendered.html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Renewal notice sent to ${member.Email}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`Error sending to ${member.Email}:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkRenewalNotices(members, year, optionsProvider = null) {
    const results = [];
    
    for (const member of members) {
      const options = optionsProvider ? await optionsProvider(member) : {};
      const result = await this.sendRenewalNotice(member, year, options);
      results.push({
        memberId: member.MemberID,
        member: `${member.FirstName} ${member.LastName}`,
        email: member.Email,
        ...result
      });
      
      // Add delay to avoid overwhelming SMTP server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  async sendReportEmail({ recipients, subject, html, attachments = [] }) {
    const normalizedRecipients = Array.isArray(recipients)
      ? recipients.map(r => String(r).trim()).filter(Boolean)
      : String(recipients || '')
        .split(',')
        .map(r => r.trim())
        .filter(Boolean);

    if (normalizedRecipients.length === 0) {
      return { success: false, error: 'No recipients provided' };
    }

    const mailOptions = {
      from: `"${process.env.CHAPTER_NAME}" <${process.env.CHAPTER_EMAIL}>`,
      to: normalizedRecipients.join(', '),
      subject,
      html,
      attachments
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Report email sent to ${normalizedRecipients.join(', ')}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending report email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
