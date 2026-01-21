// scripts/trainSessionSuccessModel.js

/**
 * Offline training script for session success prediction model.
 * 
 * Usage:
 *   node backend/scripts/trainSessionSuccessModel.js [--epochs 100] [--learning-rate 0.01]
 * 
 * This script:
 * 1. Loads historical session data
 * 2. Builds training dataset with features and labels
 * 3. Trains logistic regression model
 * 4. Saves model weights to database
 * 5. Optionally sets as active model
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Session } = require('../models/Session');
const SessionSuccessTrainingSample = require('../models/SessionSuccessTrainingSample');
const SessionSuccessModelParams = require('../models/SessionSuccessModelParams');
const { trainSessionSuccessModel } = require('../ml/sessionSuccessModel');
const User = require('../models/User');
const Skill = require('../models/skill');

// Parse command line arguments
const args = process.argv.slice(2);
const epochs = parseInt(args.find(a => a.startsWith('--epochs='))?.split('=')[1]) || 100;
const learningRate = parseFloat(args.find(a => a.startsWith('--learning-rate='))?.split('=')[1]) || 0.01;
const regularization = parseFloat(args.find(a => a.startsWith('--regularization='))?.split('=')[1]) || 0.01;
const setActive = !args.includes('--no-activate');

console.log('=== Session Success Model Training ===');
console.log('Configuration:');
console.log(`  Epochs: ${epochs}`);
console.log(`  Learning Rate: ${learningRate}`);
console.log(`  Regularization: ${regularization}`);
console.log(`  Set Active: ${setActive}`);
console.log('');

async function main() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Step 1: Check if training samples exist, otherwise generate from sessions
    console.log('Step 1: Loading training data...');
    let samples = await SessionSuccessTrainingSample.getTrainingData({}, 10000);

    if (samples.length < 50) {
      console.log(`Only ${samples.length} samples found, generating from sessions...`);
      samples = await generateTrainingSamples();
      console.log(`Generated ${samples.length} training samples\n`);
    } else {
      console.log(`Found ${samples.length} existing training samples\n`);
    }

    if (samples.length < 10) {
      console.error('ERROR: Not enough training data (minimum 10 samples required)');
      process.exit(1);
    }

    // Step 2: Extract features and labels
    console.log('Step 2: Extracting features and labels...');
    const X = [];
    const y = [];

    for (const sample of samples) {
      // Build feature vector from metadata
      const features = [
        sample.metadata?.mentorRating || 0.6,
        sample.metadata?.studentExperience || 0.5,
        sample.metadata?.skillMatch || 0.5,
        sample.metadata?.priorSessions || 0,
        (sample.metadata?.timeslotHour || 12) / 24,
        (sample.metadata?.dayOfWeek || 3) / 7,
        1.0, // durationMatch (placeholder)
        0.7  // availability (placeholder)
      ];

      X.push(features);
      y.push(sample.label === 'success' ? 1 : 0);
    }

    console.log(`Features shape: ${X.length} samples × ${X[0].length} features`);
    console.log(`Label distribution: ${y.filter(l => l === 1).length} success, ${y.filter(l => l === 0).length} fail\n`);

    // Step 3: Train model
    console.log('Step 3: Training model...');
    const trainedModel = trainSessionSuccessModel(X, y, {
      learningRate,
      epochs,
      regularization
    });

    console.log('\nTraining complete!');
    console.log('Model Metrics:');
    console.log(`  Accuracy:  ${(trainedModel.metadata.accuracy * 100).toFixed(2)}%`);
    console.log(`  Precision: ${(trainedModel.metadata.precision * 100).toFixed(2)}%`);
    console.log(`  Recall:    ${(trainedModel.metadata.recall * 100).toFixed(2)}%`);
    console.log(`  F1 Score:  ${(trainedModel.metadata.f1Score * 100).toFixed(2)}%`);
    console.log('');

    // Step 4: Save model to database
    console.log('Step 4: Saving model to database...');
    const modelVersion = `v${Date.now()}`;

    await SessionSuccessModelParams.saveModel({
      modelVersion,
      weights: trainedModel.weights,
      bias: trainedModel.bias,
      featureNames: [
        'mentorRating',
        'studentExperience',
        'skillMatch',
        'priorSessions',
        'timeOfDay',
        'dayOfWeek',
        'durationMatch',
        'availability'
      ],
      trainingMetadata: trainedModel.metadata,
      isActive: false
    });

    console.log(`Model saved as ${modelVersion}\n`);

    // Step 5: Optionally set as active
    if (setActive) {
      console.log('Step 5: Setting model as active...');
      await SessionSuccessModelParams.setActiveModel(modelVersion);
      console.log('Model activated successfully!\n');
    }

    console.log('=== Training Complete ===');
    console.log(`Model Version: ${modelVersion}`);
    console.log('Weights:', trainedModel.weights.map(w => w.toFixed(4)).join(', '));
    console.log('Bias:', trainedModel.bias.toFixed(4));

  } catch (error) {
    console.error('Error during training:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

/**
 * Generate training samples from historical sessions.
 * Labels sessions as success/fail based on completion status and rating.
 * @returns {Promise<Array>}
 */
async function generateTrainingSamples() {
  console.log('Fetching completed sessions...');

  const sessions = await Session.find({
    status: { $in: ['completed', 'cancelled'] },
    skillRef: { $exists: true }
  })
    .limit(1000)
    .lean()
    .exec();

  console.log(`Found ${sessions.length} historical sessions`);

  const samples = [];

  for (const session of sessions) {
    try {
      // Determine label
      let label = 'neutral';
      if (session.status === 'completed' && (session.rating || 0) >= 4) {
        label = 'success';
      } else if (session.status === 'cancelled' || (session.rating || 0) < 3) {
        label = 'fail';
      }

      // Fetch mentor and student data for features
      const [mentor, student] = await Promise.all([
        User.findById(session.mentor).lean().exec(),
        User.findById(session.learner).lean().exec()
      ]);

      if (!mentor || !student) continue;

      const metadata = {
        mentorRating: (mentor.ratings?.average || mentor.rating || 3) / 5,
        studentExperience: Math.min(1, (student.teaches?.length || 0) / 10),
        skillMatch: 0.7, // Placeholder
        priorSessions: 0, // Placeholder
        timeslotHour: new Date(session.scheduledAt).getHours(),
        dayOfWeek: new Date(session.scheduledAt).getDay()
      };

      // Create training sample
      const sample = await SessionSuccessTrainingSample.create({
        mentorId: session.mentor,
        studentId: session.learner,
        skillId: session.skillRef,
        sessionId: session._id,
        scheduledAt: session.scheduledAt,
        durationMins: session.durationMins || 60,
        label,
        metadata
      });

      samples.push(sample);

      if (samples.length % 50 === 0) {
        console.log(`  Processed ${samples.length} samples...`);
      }

    } catch (err) {
      console.warn('Failed to process session:', session._id, err.message);
    }
  }

  return samples;
}

// Run the script
main();
