require('dotenv').config();
const mongoose = require('mongoose');
const RVVerification = require('../models/RVVerification');
const User = require('../models/User');

async function checkIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('=== RVVerification Collection Indexes ===');
    const rvIndexes = await RVVerification.collection.getIndexes();
    console.log(JSON.stringify(rvIndexes, null, 2));

    console.log('\n=== User Collection Indexes (role field) ===');
    const userIndexes = await User.collection.getIndexes();
    console.log(JSON.stringify(userIndexes, null, 2));

    console.log('\n=== Query Performance Test ===');

    // Test userId lookup (should use unique index)
    const userId = '507f1f77bcf86cd799439011'; // dummy ID
    console.time('RVVerification.findOne({userId})');
    await RVVerification.findOne({ userId }).explain('executionStats');
    console.timeEnd('RVVerification.findOne({userId})');

    // Test batch loading query (should use index)
    const userIds = Array(10).fill(null).map(() => mongoose.Types.ObjectId());
    console.time('RVVerification.find({userId: {$in: userIds}})');
    await RVVerification.find({ userId: { $in: userIds }, status: 'verified' }).explain('executionStats');
    console.timeEnd('RVVerification.find({userId: {$in: userIds}})');

    console.log('\n✅ Index check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkIndexes();
