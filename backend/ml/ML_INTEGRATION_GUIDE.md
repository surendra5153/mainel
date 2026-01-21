# ML Skill Recommendation System - Integration Guide

## Overview

This document describes the lightweight ML-powered skill recommendation system for SkillSync. The system uses explainable linear models and deterministic feature engineering for transparent, fast recommendations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ML Recommendation Flow                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client Request                                              │
│       ↓                                                      │
│  mlRoutes.js (optional auth)                                 │
│       ↓                                                      │
│  recommendationController.js                                 │
│       ↓                                                      │
│  skillRecommender.js                                         │
│       ├─→ Check process cache (simpleCache)                 │
│       ├─→ Check DB cache (SkillRecommendationCache)         │
│       ├─→ Compute fresh if needed                           │
│       │   ├─→ buildSkillFeatures() → 7D feature vector      │
│       │   ├─→ Linear scoring: score = w·x                   │
│       │   └─→ Rank and cache results                        │
│       └─→ Fallback to popularity on error                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

### 1. Models
- **`backend/models/SkillRecommendationCache.js`**
  - Mongoose schema for caching recommendations
  - Compound index on `{userId, skillId}` for fast lookups
  - TTL management with `isStale()` method
  - Bulk upsert operations for efficiency

### 2. ML Layer
- **`backend/ml/featureBuilders/skillFeatures.js`**
  - Builds 7-dimensional feature vector
  - Features: tag similarity, category match, popularity, learning gap, recency, complementarity, skill level gap
  - Returns human-readable explanations
  - Deterministic, no external dependencies

- **`backend/ml/skillRecommender.js`**
  - Core recommendation engine
  - Linear model with hardcoded weights
  - Two-tier caching: process-level (5min) + database (24h)
  - Automatic fallback to popularity-based recommendations
  - Environment-based feature flag support

### 3. Controllers & Routes
- **`backend/controllers/recommendationController.js`**
  - Express controller handlers
  - Error handling with graceful degradation
  - Supports authenticated and unauthenticated requests

- **`backend/routes/mlRoutes.js`**
  - Express router for `/ml/*` endpoints
  - Optional authentication middleware
  - Three endpoints: recommendations, stats, cache clearing

## Integration Steps

### Step 1: Mount ML Routes in server.js

Add this to your `backend/server.js` after other route definitions:

```javascript
// ML-powered endpoints
const mlRoutes = require('./routes/mlRoutes');
app.use('/ml', mlRoutes);
```

### Step 2: Set Environment Variables

Add to `backend/.env`:

```env
# ML Configuration
ML_SKILL_RECOMMENDATION_ENABLED=true
LOG_LEVEL=info
```

### Step 3: Ensure Database Indexes

The model automatically creates indexes, but you can verify with:

```javascript
const SkillRecommendationCache = require('./models/SkillRecommendationCache');
// Indexes will be created on first model use
```

### Step 4: Test the Endpoints

**Get Recommendations (Authenticated):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/ml/recommendations/skills?limit=10"
```

**Get Recommendations (Unauthenticated with userId):**
```bash
curl "http://localhost:5000/ml/recommendations/skills?userId=USER_ID&limit=10"
```

**Get System Stats:**
```bash
curl "http://localhost:5000/ml/recommendations/stats"
```

**Clear Cache (Admin):**
```bash
curl -X POST "http://localhost:5000/ml/recommendations/clear-cache"
```

## API Reference

### GET `/ml/recommendations/skills`

**Query Parameters:**
- `userId` (optional): User ID if not authenticated
- `limit` (optional): Number of recommendations (default: 10, max: 50)
- `skipCache` (optional): Force fresh computation (default: false)

**Response:**
```json
{
  "success": true,
  "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "items": [
    {
      "skillId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "score": 0.85,
      "reason": "Strong tag overlap (75%); Matches your programming interests",
      "fallback": false
    }
  ],
  "meta": {
    "limit": 10,
    "count": 10,
    "mlEnabled": true,
    "fallback": false
  }
}
```

### GET `/ml/recommendations/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "processCache": {
      "hits": 120,
      "misses": 15,
      "sets": 15,
      "evictions": 0,
      "size": 15,
      "hitRate": 0.888
    },
    "modelWeights": [0.25, 0.15, 0.10, 0.25, 0.10, 0.10, 0.05],
    "cacheTtlMs": 86400000
  }
}
```

### POST `/ml/recommendations/clear-cache`

**Response:**
```json
{
  "success": true,
  "message": "Caches cleared successfully",
  "result": {
    "processCache": true,
    "dbCacheCleared": 1234
  }
}
```

## Feature Engineering

### Feature Vector (7 dimensions)

1. **Tag Similarity (0.25 weight)**
   - Jaccard index between user's skill tags and candidate skill tags
   - Normalized to [0, 1]

2. **Category Match (0.15 weight)**
   - Binary: 1 if category matches user's interests, 0 otherwise

3. **Skill Popularity (0.10 weight)**
   - Log-normalized popularity score
   - Formula: `log10(pop + 1) / log10(1001)`

4. **Learning Gap (0.25 weight)**
   - How much user wants to learn this skill
   - Based on user's "learns" array and skill matching

5. **Recency Score (0.10 weight)**
   - Activity recency decay over 30 days
   - Formula: `max(0, 1 - daysSinceLastSeen / 30)`

6. **Complementarity (0.10 weight)**
   - Whether skill complements user's existing skills
   - Uses hardcoded skill pairing heuristics

7. **Skill Level Gap (0.05 weight)**
   - Prefers skills user doesn't already master
   - Higher score for skills user lacks or has at beginner level

### Linear Scoring Model

```
score = Σ(wi × xi)  where i ∈ [0, 6]
```

Final score is clamped to [0, 1] range.

## Caching Strategy

### Two-Tier Cache

1. **Process Cache (In-Memory)**
   - TTL: 5 minutes
   - Max size: 500 entries
   - Tool: `simpleCache.js` utility
   - Purpose: Avoid repeated DB queries within same process

2. **Database Cache (MongoDB)**
   - TTL: 24 hours
   - Collection: `skillrecommendationcaches`
   - Purpose: Persist computations across server restarts

### Cache Invalidation

- Manual: POST `/ml/recommendations/clear-cache`
- Automatic: Stale entries excluded from queries
- Periodic cleanup: TODO - implement background job

## Fallback Mode

When ML is disabled (`ML_SKILL_RECOMMENDATION_ENABLED=false`) or errors occur:
- Returns top skills sorted by popularity
- Response shape remains consistent
- `fallback: true` flag set in items

## Performance Characteristics

- **Cold start** (no cache): ~100-300ms depending on skill count
- **Warm cache** (process): <5ms
- **DB cache hit**: ~20-50ms
- **Concurrent requests**: Process cache is thread-safe for single Node.js process

## Future Enhancements (TODOs)

1. **Collaborative Filtering**
   - Use session history to find similar users
   - Recommend skills popular among similar users

2. **Embedding-Based Similarity**
   - Generate skill embeddings offline
   - Use vector similarity for recommendations

3. **Online Learning**
   - Collect user feedback (likes, dislikes, session bookings)
   - Periodically retrain model weights

4. **A/B Testing Framework**
   - Test different weight configurations
   - Measure conversion rates (session bookings)

5. **Background Workers**
   - Precompute recommendations for all active users
   - Scheduled cache warming

6. **Advanced Features**
   - User-to-user similarity (collaborative filtering)
   - Temporal patterns (time-of-day, day-of-week preferences)
   - Skill difficulty matching

7. **Monitoring & Analytics**
   - Track recommendation acceptance rate
   - Monitor cache hit rates
   - Alert on fallback mode usage

## Testing Recommendations

### Unit Tests (TODO)
```javascript
// Test feature builder
const { buildSkillFeatures } = require('./ml/featureBuilders/skillFeatures');
// Test with mock user and skill data

// Test recommender
const { recommendSkillsForUser } = require('./ml/skillRecommender');
// Test caching, fallback, error handling
```

### Integration Tests (TODO)
```javascript
// Test full endpoint with authenticated/unauthenticated requests
// Test cache behavior
// Test fallback mode
```

### Load Tests (TODO)
```bash
# Test concurrent recommendations
ab -n 1000 -c 10 "http://localhost:5000/ml/recommendations/skills?userId=TEST_USER"
```

## Security Considerations

- **Rate Limiting**: Add rate limiting to prevent abuse (TODO)
- **Admin Endpoints**: Secure `/stats` and `/clear-cache` with admin-only middleware (TODO)
- **Input Validation**: UserId validation added, but consider additional sanitization
- **PII Protection**: Ensure recommendations don't leak private user data

## Monitoring Checklist

- [ ] Track endpoint latency (p50, p95, p99)
- [ ] Monitor cache hit rates
- [ ] Alert on fallback mode activation
- [ ] Track recommendation acceptance (session bookings)
- [ ] Monitor database cache growth

## Troubleshooting

**Problem: No recommendations returned**
- Check `ML_SKILL_RECOMMENDATION_ENABLED` env var
- Verify skills exist in database
- Check logs for errors

**Problem: Slow responses**
- Check cache hit rates via `/ml/recommendations/stats`
- Consider warming cache for popular users
- Review database indexes

**Problem: Irrelevant recommendations**
- Adjust model weights in `skillRecommender.js`
- Review feature engineering logic
- Collect user feedback for training

**Problem: Fallback mode always active**
- Check environment variable settings
- Review error logs for ML failures
- Verify database connectivity

## Support

For questions or issues with the ML system:
1. Check logs with `LOG_LEVEL=debug`
2. Review `/ml/recommendations/stats` for cache metrics
3. Test with `skipCache=true` to bypass caching
4. Check database for SkillRecommendationCache entries
