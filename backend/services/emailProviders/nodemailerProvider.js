const nodemailer = require('nodemailer');

class NodemailerProvider {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    try {
      const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
      const port = parseInt(process.env.EMAIL_PORT || '587', 10);
      const user = process.env.EMAIL_USER;
      const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;

      if (!user || !pass) {
        console.warn('Nodemailer: EMAIL_USER or EMAIL_PASSWORD not configured');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass
        }
      });

      console.log('Nodemailer: SMTP transport configured');
    } catch (error) {
      console.error('Nodemailer: Failed to create transport', error.message);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.transporter) {
        throw new Error('Nodemailer transport not configured');
      }

      const from = process.env.EMAIL_FROM || 'noreply@skillsync.com';

      const mailOptions = {
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '')
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        error: null
      };
    } catch (error) {
      console.error('Nodemailer error:', error.message);
      return {
        success: false,
        messageId: null,
        error: error.message
      };
    }
  }
}

module.exports = new NodemailerProvider();
