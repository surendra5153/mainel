require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { Session } = require('../models/Session');
const RVVerification = require('../models/RVVerification');
const Skill = require('../models/skill');
const { recommendSkillsForUser } = require('../ml/skillRecommender');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap';

async function runVerification() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    try {
        // 1. Skill Proficiency Levels
        console.log('\n--- Verifying Skill Proficiency Levels ---');
        const testUser = new User({
            name: 'Test User Premium',
            email: `test_premium_${Date.now()}@example.com`,
            passwordHash: 'hash',
            teaches: []
        });

        testUser.teaches.push({
            name: 'Advanced React',
            level: 'expert', // Premium level
            description: 'Testing expert level'
        });

        await testUser.save();
        console.log('User created with "expert" skill:', testUser.teaches[0].level === 'expert' ? 'PASS' : 'FAIL');

        // 2. Session Agenda & Notes
        console.log('\n--- Verifying Session Agenda & Notes ---');
        const noteSession = new Session({
            mentor: testUser._id,
            learner: testUser._id, // Self-session for test simplicity
            scheduledAt: new Date(),
            status: 'confirmed',
            agenda: 'Initial Agenda',
            learnerNotes: ''
        });
        await noteSession.save();

        // Update fields
        noteSession.agenda = 'Updated Premium Agenda';
        noteSession.learnerNotes = 'My private learning notes';
        await noteSession.save();

        const reloadedSession = await Session.findById(noteSession._id);
        console.log('Agenda saved:', reloadedSession.agenda === 'Updated Premium Agenda' ? 'PASS' : 'FAIL');
        console.log('Notes saved:', reloadedSession.learnerNotes === 'My private learning notes' ? 'PASS' : 'FAIL');

        // 3. RV Verification Expiry
        console.log('\n--- Verifying RV Verification Expiry ---');
        // Simulate successful OTP verification logic
        const expiresAtExpected = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        const verification = new RVVerification({
            userId: testUser._id,
            rvEmail: 'test@rv.edu.in',
            idCardImageUrl: 'http://img',
            status: 'verified',
            expiresAt: expiresAtExpected
        });
        await verification.save();

        console.log('ExpiresAt exists:', verification.expiresAt ? 'PASS' : 'FAIL');
        const daysDiff = Math.round((verification.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
        console.log('Expires in approx 180 days:', Math.abs(daysDiff - 180) < 2 ? 'PASS' : `FAIL (${daysDiff})`);

        // 4. ML Explanations
        console.log('\n--- Verifying ML Explanations ---');
        // Ensure at least one skill exists in DB for recommendation
        const skill = new Skill({ name: 'Java', category: 'Programming', popularity: 100 });
        await skill.save();

        const recs = await recommendSkillsForUser({ userId: testUser._id, limit: 1 });
        if (recs.items.length > 0) {
            console.log('Recommendation Reason present:', recs.items[0].reason ? `PASS ("${recs.items[0].reason}")` : 'FAIL');
        } else {
            console.log('No recommendations generated (skip reason check)');
        }

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await Session.deleteOne({ _id: noteSession._id });
        await RVVerification.deleteOne({ _id: verification._id });
        await Skill.deleteOne({ _id: skill._id });

        console.log('\nVerification Complete.');

    } catch (err) {
        console.error('Verification Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runVerification();
