const { updateSecuritySettings, getRecoveryCheck, resetPasswordViaQuestion } = require('../controllers/authController');
const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Mock Req/Res
const mockReq = (body, user) => ({ body, user });
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};
const mockNext = (err) => { if (err) console.error(err); };

async function testSecurityFlow() {
    console.log('--- Connecting to Mongo ---');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillswap');

    const testEmail = `test_recovery_${Date.now()}@example.com`;
    const testPassword = 'password123';

    console.log(`--- Creating User: ${testEmail} ---`);
    // clean up first
    await User.deleteMany({ email: testEmail });

    const user = new User({
        name: 'Test Recovery',
        email: testEmail,
        passwordHash: await bcrypt.hash(testPassword, 10),
        isVerified: true
    });
    await user.save();

    console.log('--- 1. Set Security Question ---');
    const req1 = mockReq({
        securityQuestion: "What is your pet's name?",
        securityAnswer: "Fluffy"
    }, { id: user._id });
    const res1 = mockRes();

    await updateSecuritySettings(req1, res1, mockNext);
    console.log('Result:', res1.data);

    console.log('--- 2. Check Recovery Option (Should be True) ---');
    const req2 = mockReq({ email: testEmail });
    const res2 = mockRes();
    await getRecoveryCheck(req2, res2, mockNext);
    console.log('Result:', res2.data);
    if (!res2.data.hasSecurityQuestion || res2.data.question !== "What is your pet's name?") console.error("FAILED Check");

    console.log('--- 3. Attempt Reset with WRONG Answer ---');
    const req3 = mockReq({
        email: testEmail,
        listAnswer: "fido",
        newPassword: "newpassword123"
    });
    const res3 = mockRes();
    await resetPasswordViaQuestion(req3, res3, mockNext);
    console.log('Result:', res3.data || res3.statusCode);
    if (res3.statusCode !== 400) console.error("FAILED Wrong Answer Check");

    console.log('--- 4. Attempt Reset with CORRECT Answer ---');
    const req4 = mockReq({
        email: testEmail,
        listAnswer: "FLUFFY", // Case insensitive check
        newPassword: "newpassword123"
    });
    const res4 = mockRes();
    await resetPasswordViaQuestion(req4, res4, mockNext);
    console.log('Result:', res4.data);
    if (res4.data.message !== 'Password reset successful. You can now login.') console.error("FAILED Reset");

    console.log('--- 5. Verify New Password Login ---');
    const updatedUser = await User.findOne({ email: testEmail }).select('+passwordHash');
    const isMatch = await bcrypt.compare("newpassword123", updatedUser.passwordHash);
    console.log('Password Match:', isMatch);

    // Cleanup
    await User.deleteMany({ email: testEmail });
    await mongoose.disconnect();
}

testSecurityFlow();
