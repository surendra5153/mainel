require('dotenv').config();
const { sendRVVerificationOTP } = require('../services/emailService');

const testData = {
  userName: 'Test User',
  rvEmail: 'test@rvce.edu.in',
  otp: '123456',
  expiryMinutes: 10
};

console.log('Testing RV verification OTP email...');
console.log('Sending to:', testData.rvEmail);

sendRVVerificationOTP(testData)
  .then(result => {
    if (result.success) {
      console.log('✅ Test email sent successfully');
      if (result.skipped) {
        console.log('⚠️  Email was skipped (EMAIL_ENABLED=false)');
      }
    } else {
      console.error('❌ Failed to send test email:', result.error);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
