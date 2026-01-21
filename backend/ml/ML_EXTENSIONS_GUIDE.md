# ML Extensions Guide - Mentor Ranking & Session Success Prediction

This guide documents the extended ML capabilities for SkillSync, including mentor ranking and session success prediction.

## Table of Contents

1. [Overview](#overview)
2. [Task A: Mentor Ranking](#task-a-mentor-ranking)
3. [Task B: Session Success Prediction](#task-b-session-success-prediction)
4. [API Reference](#api-reference)
5. [Training & Deployment](#training--deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Overview

The ML layer has been extended with two major capabilities:

1. **Mentor Ranking**: Personalized mentor recommendations based on user preferences, skills, and mentor expertise
2. **Session Success Prediction**: Real-time prediction of session success probability to reduce cancellations

Both systems follow the same architectural principles:
- ✅ Non-destructive (no existing code modified)
- ✅ Feature-flagged (environment variables)
- ✅ Two-tier caching (process + database)
- ✅ Graceful fallback modes
- ✅ Explainable features

---

## Task A: Mentor Ranking

### Architecture

```
User Request (skillIds)
    ↓
recommendMentors()
    ↓
Process Cache Check → DB Cache Check → Fresh Computation
    ↓                      ↓                  ↓
Return                 Return          buildMentorFeatures()
                                            ↓
                                       Linear Scoring
                                            ↓
                                    Rank & Cache Results
```

### Feature Engineering

**8-Dimensional Feature Vector:**

1. **Mentor Rating Average** (0.25 weight)
   - Bayesian average rating with confidence adjustment
   - Accounts for review count to prevent new-mentor bias

2. **Session Completion Rate** (0.20 weight)
   - Percentage of completed sessions vs. total
   - Historical reliability indicator

3. **Skill Match Quality** (0.20 weight)
   - Exact/partial match with requested skill
   - Considers mentor's proficiency level (beginner/expert)
   - Bonus for endorsements

4. **Skill Overlap** (0.10 weight)
   - Jaccard similarity between student's learning goals and mentor's expertise
   - Measures alignment of interests

5. **Experience Level** (0.08 weight)
   - Years of experience normalized to [0, 1]
   - Capped at 10 years

6. **Recent Activity** (0.07 weight)
   - Days since last seen, decay over 30 days
   - Ensures active mentors are prioritized

7. **Success Streak** (0.05 weight)
   - Recent sessions with 4+ star ratings
   - Short-term performance indicator

8. **Availability** (0.05 weight)
   - Currently online: 1.0, offline: 0.3
   - Real-time availability boost

### Scoring Model

```
score = Σ(wi × xi)  where i ∈ [0, 7]
```

Final score clamped to [0, 1].

### Files Created

```
backend/
├── models/
│   └── MentorRecommendationCache.js       # Cache storage
├── ml/
│   ├── featureBuilders/
│   │   └── mentorFeatures.js              # Feature engineering
│   └── mentorRecommender.js               # Core recommendation logic
├── controllers/
│   └── recommendationController.js         # Extended with getMentorRecommendations
└── routes/
    └── mlRoutes.js                         # Extended with /recommendations/mentors
```

### API Endpoint

**GET `/api/ml/recommendations/mentors`**

**Query Parameters:**
- `userId` (optional if authenticated): User ID
- `skillIds` (required): Comma-separated skill IDs
- `limit` (optional): Max results, default 10, max 50
- `skipCache` (optional): Force fresh computation

**Example Request:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/ml/recommendations/mentors?skillIds=SKILL_ID_1,SKILL_ID_2&limit=5"
```

**Example Response:**
```json
{
  "success": true,
  "userId": "60f7b3b3...",
  "skillIds": ["60f7b3b3...", "60f7b3b4..."],
  "items": [
    {
      "mentorId": "60f7b3b5...",
      "skillId": "60f7b3b3...",
      "score": 0.87,
      "reason": "Highly rated (4.8★); Expert in this skill; Recently active",
      "fallback": false
    }
  ],
  "meta": {
    "limit": 5,
    "count": 5,
    "mlEnabled": true,
    "fallback": false
  }
}
```

### Fallback Mode

When `ML_MENTOR_RECOMMENDATION_ENABLED=false` or errors occur:
- Falls back to filtering mentors by skill
- Sorts by rating and recency
- Returns same response shape with `fallback: true`

### Cache Strategy

1. **Process Cache**: 5 minutes TTL, max 500 entries
2. **Database Cache**: 24 hours TTL, indexed by userId + skillId + mentorId

---

## Task B: Session Success Prediction

### Architecture

```
Session Request Data
    ↓
predictSessionSuccess()
    ↓
Load Active Model (DB or default)
    ↓
buildSessionFeatures()
    ↓
Logistic Regression Prediction
    ↓
Risk Level Classification
    ↓
Return {probability, riskLevel, fallback}
```

### Machine Learning Model

**Algorithm**: Logistic Regression (custom implementation)

**Training Process:**
1. Load historical session data
2. Label sessions: 
   - `success`: completed + rating ≥ 4
   - `fail`: cancelled or rating < 3
   - `neutral`: other cases
3. Extract features from session context
4. Train using gradient descent
5. Persist weights to MongoDB

### Feature Engineering

**8-Dimensional Feature Vector:**

1. **Mentor Rating** - Normalized to [0, 1]
2. **Student Experience** - Based on skills taught
3. **Skill Match** - Mentor's proficiency in requested skill
4. **Prior Sessions** - History between mentor and student
5. **Time of Day** - Hour normalized to [0, 1]
6. **Day of Week** - Weekday pattern
7. **Duration Match** - Expected vs. actual duration
8. **Availability** - Mentor's current status

### Prediction Output

```javascript
{
  successProbability: 0.85,    // [0, 1] probability
  riskLevel: "low",            // "low" | "medium" | "high"
  fallback: false,             // true if using fallback mode
  modelVersion: "v1234567890"  // trained model version
}
```

**Risk Level Thresholds:**
- **High**: probability < 0.4
- **Medium**: 0.4 ≤ probability < 0.7
- **Low**: probability ≥ 0.7

### Files Created

```
backend/
├── models/
│   ├── SessionSuccessTrainingSample.js    # Training data storage
│   └── SessionSuccessModelParams.js       # Model weights persistence
├── ml/
│   └── sessionSuccessModel.js             # Logistic regression implementation
├── scripts/
│   └── trainSessionSuccessModel.js        # Offline training script
├── controllers/
│   └── analyticsController.js             # Prediction endpoints
└── routes/
    └── analyticsRoutes.js                 # Analytics routes
```

### API Endpoints

#### 1. Predict Single Session

**POST `/api/ml/predict/session-success`**

**Request Body:**
```json
{
  "mentorId": "60f7b3b5...",
  "studentId": "60f7b3b6...",
  "skillId": "60f7b3b3...",
  "slot": "2024-01-15T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "successProbability": 0.85,
    "riskLevel": "low",
    "fallback": false,
    "modelVersion": "v1234567890"
  },
  "meta": {
    "mlEnabled": true,
    "predictedAt": "2024-01-10T12:00:00Z"
  }
}
```

#### 2. Get Model Information

**GET `/api/ml/predict/session-success/info`**

**Response:**
```json
{
  "success": true,
  "activeModel": {
    "version": "v1234567890",
    "trainedAt": "2024-01-01T00:00:00Z",
    "accuracy": 0.85,
    "samplesCount": 1000
  },
  "availableModels": [...],
  "meta": {
    "mlEnabled": true,
    "totalModels": 5
  }
}
```

#### 3. Batch Predictions

**POST `/api/ml/predict/session-success/batch`**

**Request Body:**
```json
{
  "sessions": [
    {
      "mentorId": "...",
      "studentId": "...",
      "skillId": "...",
      "slot": "..."
    }
  ]
}
```

**Max 100 sessions per request.**

### Fallback Mode

When `ML_SESSION_PREDICTION_ENABLED=false` or errors occur:
- Returns neutral probability: 0.7
- Risk level: "medium"
- `fallback: true` flag set

---

## Training & Deployment

### Initial Model Training

1. **Ensure historical session data exists:**
   ```bash
   # Check session count
   mongo skillswap --eval "db.sessions.count()"
   ```

2. **Run training script:**
   ```bash
   node backend/scripts/trainSessionSuccessModel.js
   ```

   **Options:**
   - `--epochs=100` - Number of training iterations
   - `--learning-rate=0.01` - Gradient descent step size
   - `--regularization=0.01` - L2 regularization strength
   - `--no-activate` - Don't set as active model

3. **Verify model saved:**
   ```bash
   mongo skillswap --eval "db.sessionsuccessmodelparams.find()"
   ```

### Retraining Workflow

**When to retrain:**
- Weekly/monthly with new data
- After significant user behavior changes
- When accuracy drops below threshold

**Automated retraining (TODO):**
```javascript
// Add to cron job or scheduler
const { spawn } = require('child_process');

function retrainModel() {
  const proc = spawn('node', [
    'backend/scripts/trainSessionSuccessModel.js',
    '--epochs=150'
  ]);
  
  proc.on('close', (code) => {
    if (code === 0) {
      console.log('Model retrained successfully');
      // Notify admins
    }
  });
}
```

### Model Versioning

Models are versioned by timestamp (`v1234567890`).

**View all models:**
```bash
curl http://localhost:5000/api/ml/predict/session-success/info
```

**Activate specific model:**
```javascript
const SessionSuccessModelParams = require('./models/SessionSuccessModelParams');
await SessionSuccessModelParams.setActiveModel('v1234567890');
```

---

## Monitoring & Maintenance

### Health Checks

1. **Cache Hit Rates:**
   ```bash
   curl http://localhost:5000/api/ml/recommendations/stats
   ```

2. **Model Performance:**
   - Track actual session outcomes vs. predictions
   - Calculate live accuracy metrics
   - Alert if accuracy drops

3. **Latency Monitoring:**
   - Recommendation endpoints: target < 200ms
   - Prediction endpoints: target < 100ms

### Maintenance Tasks

#### Weekly
- [ ] Check cache hit rates
- [ ] Review error logs for fallback activations
- [ ] Monitor prediction accuracy

#### Monthly
- [ ] Retrain session success model
- [ ] Update mentor ranking weights based on A/B tests
- [ ] Clear stale cache entries
- [ ] Review and optimize slow queries

#### Quarterly
- [ ] Analyze feature importance
- [ ] Implement new features based on data insights
- [ ] Performance optimization
- [ ] Documentation updates

### Troubleshooting

**Problem: Low mentor recommendation quality**
- **Check**: Feature weights in `mentorRecommender.js`
- **Action**: Adjust weights based on user feedback
- **Tool**: A/B testing framework (TODO)

**Problem: Session predictions inaccurate**
- **Check**: Training data quality and distribution
- **Action**: Retrain with more recent data
- **Tool**: `trainSessionSuccessModel.js --epochs=200`

**Problem: High latency on recommendations**
- **Check**: Cache hit rates via `/stats` endpoint
- **Action**: Increase process cache TTL or pre-warm caches
- **Tool**: Background cache warming job (TODO)

**Problem: Fallback mode always active**
- **Check**: Environment variables and error logs
- **Action**: Fix configuration or database connectivity
- **Verify**: `LOG_LEVEL=debug` for detailed logs

---

## Environment Configuration

Add to `backend/.env`:

```env
# ML Feature Flags
ML_SKILL_RECOMMENDATION_ENABLED=true
ML_MENTOR_RECOMMENDATION_ENABLED=true
ML_SESSION_PREDICTION_ENABLED=true

# Logging
LOG_LEVEL=info  # debug | info | warn | error
```

---

## Future Enhancements

### Mentor Ranking
- [ ] Incorporate user feedback (likes, bookings)
- [ ] Add timezone matching feature
- [ ] Implement collaborative filtering
- [ ] Real-time availability integration
- [ ] Multi-skill optimization

### Session Success Prediction
- [ ] Add more temporal features (session history patterns)
- [ ] Incorporate chat sentiment analysis
- [ ] Real-time model updates (online learning)
- [ ] Confidence intervals for predictions
- [ ] Explainable AI (SHAP values)

### General
- [ ] A/B testing framework for model variants
- [ ] Automated hyperparameter tuning
- [ ] Model performance dashboards
- [ ] Integration with analytics platform
- [ ] Multi-model ensemble predictions

---

## API Summary

### Mentor Recommendations
```
GET /api/ml/recommendations/mentors?skillIds=X,Y&limit=10
```

### Session Success Prediction
```
POST /api/ml/predict/session-success
GET  /api/ml/predict/session-success/info
POST /api/ml/predict/session-success/batch
```

### Cache Management
```
GET  /api/ml/recommendations/stats
POST /api/ml/recommendations/clear-cache
```

---

## Support

For questions or issues:
1. Check logs with `LOG_LEVEL=debug`
2. Review model info via `/info` endpoints
3. Test with `skipCache=true` to bypass caching
4. Check database for cache and model collections

For model training issues, see `scripts/trainSessionSuccessModel.js` inline documentation.
