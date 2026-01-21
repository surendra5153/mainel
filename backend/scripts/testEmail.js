require('dotenv').config();
const { sendSessionRequest, sendSessionScheduled, sendSessionReminder } = require('../services/emailService');

const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error('Usage: node testEmail.js <recipient-email>');
  console.error('Example: node testEmail.js test@example.com');
  process.exit(1);
}

console.log('Email Service Test');
console.log('==================\n');
console.log(`Recipient: ${recipientEmail}`);
console.log(`Email Provider: ${process.env.EMAIL_PROVIDER || 'sendgrid (default)'}`);
console.log(`Email Enabled: ${process.env.EMAIL_ENABLED !== 'false' ? 'Yes' : 'No'}\n`);

const mockMentor = {
  _id: '507f1f77bcf86cd799439011',
  name: 'John Mentor',
  email: recipientEmail
};

const mockLearner = {
  _id: '507f1f77bcf86cd799439012',
  name: 'Jane Learner',
  email: recipientEmail
};

const mockSession = {
  _id: '507f1f77bcf86cd799439013',
  skillName: 'JavaScript Advanced',
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  durationMins: 60,
  meetingLink: 'https://meet.jit.si/test-session-123'
};

async function runTests() {
  console.log('Test 1: Session Request Email');
  console.log('------------------------------');
  try {
    const result1 = await sendSessionRequest(mockMentor, mockLearner, mockSession);
    if (result1.success) {
      console.log('✓ Session request email sent successfully');
      if (result1.messageId) console.log(`  Message ID: ${result1.messageId}`);
      if (result1.skipped) console.log('  (Email sending is disabled)');
    } else {
      console.log(`✗ Failed: ${result1.error}`);
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }
  console.log();

  console.log('Test 2: Session Scheduled Email');
  console.log('--------------------------------');
  try {
    const result2 = await sendSessionScheduled(mockMentor, mockLearner, mockSession);
    if (result2.success) {
      console.log('✓ Session scheduled emails sent successfully');
      if (result2.skipped) console.log('  (Email sending is disabled)');
    } else {
      console.log(`✗ Failed: ${result2.error}`);
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }
  console.log();

  console.log('Test 3: Session Reminder Email');
  console.log('-------------------------------');
  try {
    const result3 = await sendSessionReminder(mockMentor, mockSession);
    if (result3.success) {
      console.log('✓ Session reminder email sent successfully');
      if (result3.messageId) console.log(`  Message ID: ${result3.messageId}`);
      if (result3.skipped) console.log('  (Email sending is disabled)');
    } else {
      console.log(`✗ Failed: ${result3.error}`);
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
  }
  console.log();

  console.log('==================');
  console.log('Tests completed!');
  console.log('\nNote: Check your email inbox at', recipientEmail);
  console.log('If using Nodemailer with Ethereal, check https://ethereal.email');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
