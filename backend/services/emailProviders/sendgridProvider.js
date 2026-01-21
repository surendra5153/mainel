const sgMail = require('@sendgrid/mail');

class SendGridProvider {
  constructor() {
    const apiKey = process.env.EMAIL_API_KEY;
    if (!apiKey) {
      console.warn('SendGrid: EMAIL_API_KEY not configured');
    } else {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!process.env.EMAIL_API_KEY) {
        throw new Error('SendGrid API key not configured');
      }

      const from = process.env.EMAIL_FROM || 'noreply@skillsync.com';

      const msg = {
        to,
        from,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      };

      const result = await sgMail.send(msg);

      return {
        success: true,
        messageId: result[0]?.headers?.['x-message-id'] || 'sent',
        error: null
      };
    } catch (error) {
      console.error('SendGrid error:', error.message);
      return {
        success: false,
        messageId: null,
        error: error.message
      };
    }
  }
}

module.exports = new SendGridProvider();
