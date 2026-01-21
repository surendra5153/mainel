// ml/featureBuilders/mentorFeatures.js

/**
 * Build feature vector for mentor recommendation.
 * All features normalized to [0, 1] range.
 * 
 * @param {Object} params - Feature building parameters
 * @param {Object} params.user - Student user object
 * @param {Object} params.mentor - Mentor user object
 * @param {Object} params.skill - Skill object
 * @param {Object} params.history - Session history data (optional)
 * @returns {Object} { features: number[], explanation: string }
 */
function buildMentorFeatures({ user, mentor, skill, history = {} }) {
  const features = [];
  const explanationParts = [];

  // ===== Feature 1: Mentor Rating Average =====
  const ratingScore = normalizeMentorRating(mentor);
  features.push(ratingScore);
  
  if (ratingScore > 0.8) {
    explanationParts.push(`Highly rated (${mentor.ratings?.average?.toFixed(1) || 'N/A'}★)`);
  }

  // ===== Feature 2: Session Completion Rate =====
  const completionRate = calculateCompletionRate(mentor, history);
  features.push(completionRate);
  
  if (completionRate > 0.85) {
    explanationParts.push(`High completion rate (${(completionRate * 100).toFixed(0)}%)`);
  }

  // ===== Feature 3: Skill Match Quality =====
  const skillMatch = calculateSkillMatch(mentor, skill);
  features.push(skillMatch);
  
  if (skillMatch > 0.7) {
    explanationParts.push('Expert in this skill');
  }

  // ===== Feature 4: Skill Overlap with Student =====
  const skillOverlap = calculateSkillOverlap(user, mentor);
  features.push(skillOverlap);
  
  if (skillOverlap > 0.4) {
    explanationParts.push('Shares your interests');
  }

  // ===== Feature 5: Experience Level =====
  const experienceScore = normalizeExperience(mentor);
  features.push(experienceScore);
  
  if (experienceScore > 0.7) {
    explanationParts.push(`${mentor.yearsOfExperience || 0}+ years experience`);
  }

  // ===== Feature 6: Recent Activity =====
  const activityScore = calculateActivityRecency(mentor);
  features.push(activityScore);
  
  if (activityScore > 0.8) {
    explanationParts.push('Recently active');
  }

  // ===== Feature 7: Successful Session Streak =====
  const streakScore = calculateSuccessStreak(mentor, history);
  features.push(streakScore);
  
  if (streakScore > 0.7) {
    explanationParts.push('Consistent success record');
  }

  // ===== Feature 8: Availability Indicator =====
  const availabilityScore = mentor.isOnline ? 1.0 : 0.3;
  features.push(availabilityScore);
  
  if (mentor.isOnline) {
    explanationParts.push('Currently online');
  }

  const explanation = explanationParts.length > 0
    ? explanationParts.join('; ')
    : 'Recommended mentor';

  return { features, explanation };
}

/**
 * Normalize mentor rating to [0, 1].
 * @private
 * @param {Object} mentor
 * @returns {number}
 */
function normalizeMentorRating(mentor) {
  const rating = mentor.ratings?.average || mentor.rating || 0;
  const count = mentor.ratings?.count || mentor.reviewsCount || 0;
  
  if (count === 0) return 0.5; // Neutral for new mentors
  
  // Normalize rating from [1, 5] to [0, 1]
  const normalizedRating = (rating - 1) / 4;
  
  // Apply confidence based on review count (more reviews = higher confidence)
  // Using Bayesian average with prior of 3.5 and weight of 5 reviews
  const prior = 3.5;
  const priorWeight = 5;
  const bayesianAvg = (rating * count + prior * priorWeight) / (count + priorWeight);
  const normalizedBayesian = (bayesianAvg - 1) / 4;
  
  return Math.max(0, Math.min(1, normalizedBayesian));
}

/**
 * Calculate session completion rate for mentor.
 * @private
 * @param {Object} mentor
 * @param {Object} history
 * @returns {number}
 */
function calculateCompletionRate(mentor, history) {
  // TODO: Query actual session history when available
  // For now, use heuristic based on mentor stats
  
  if (history.mentorSessions && history.mentorSessions[mentor._id]) {
    const sessions = history.mentorSessions[mentor._id];
    const completed = sessions.filter(s => s.status === 'completed').length;
    return completed / Math.max(1, sessions.length);
  }
  
  // Fallback: assume good completion rate for high-rated mentors
  const rating = mentor.ratings?.average || mentor.rating || 3;
  return Math.max(0, Math.min(1, (rating - 2) / 3));
}

/**
 * Calculate how well mentor matches the requested skill.
 * @private
 * @param {Object} mentor
 * @param {Object} skill
 * @returns {number}
 */
function calculateSkillMatch(mentor, skill) {
  const teaches = mentor.teaches || [];
  const skillNameLower = skill.name.toLowerCase();
  
  // Find exact or partial match
  let bestMatch = 0;
  
  for (const teachSkill of teaches) {
    const teachNameLower = teachSkill.name.toLowerCase();
    
    // Exact match
    if (teachNameLower === skillNameLower) {
      const levelScores = {
        'beginner': 0.4,
        'intermediate': 0.6,
        'advanced': 0.8,
        'expert': 1.0
      };
      bestMatch = Math.max(bestMatch, levelScores[teachSkill.level] || 0.5);
    }
    // Partial match
    else if (teachNameLower.includes(skillNameLower) || skillNameLower.includes(teachNameLower)) {
      bestMatch = Math.max(bestMatch, 0.5);
    }
  }
  
  // Check endorsements for this skill
  const endorsementBoost = teaches.find(s => 
    s.name.toLowerCase() === skillNameLower && s.endorsementsCount > 0
  );
  if (endorsementBoost) {
    const endorsementScore = Math.min(0.2, endorsementBoost.endorsementsCount * 0.02);
    bestMatch = Math.min(1, bestMatch + endorsementScore);
  }
  
  return bestMatch;
}

/**
 * Calculate skill overlap between student's interests and mentor's expertise.
 * @private
 * @param {Object} user - Student
 * @param {Object} mentor
 * @returns {number}
 */
function calculateSkillOverlap(user, mentor) {
  const userLearns = new Set((user.learns || []).map(s => s.name.toLowerCase()));
  const mentorTeaches = new Set((mentor.teaches || []).map(s => s.name.toLowerCase()));
  
  if (userLearns.size === 0 || mentorTeaches.size === 0) return 0;
  
  let overlapCount = 0;
  for (const skill of userLearns) {
    if (mentorTeaches.has(skill)) overlapCount++;
  }
  
  return overlapCount / Math.max(1, userLearns.size);
}

/**
 * Normalize mentor's years of experience to [0, 1].
 * @private
 * @param {Object} mentor
 * @returns {number}
 */
function normalizeExperience(mentor) {
  const years = mentor.yearsOfExperience || 0;
  // Assume 10+ years is maximum useful experience
  return Math.min(1, years / 10);
}

/**
 * Calculate mentor's recent activity score.
 * @private
 * @param {Object} mentor
 * @returns {number}
 */
function calculateActivityRecency(mentor) {
  if (!mentor.lastSeen) return 0.3; // Default low score
  
  const daysSinceLastSeen = (Date.now() - new Date(mentor.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
  
  // Decay: active today = 1.0, after 30 days = 0
  const recency = Math.max(0, 1 - daysSinceLastSeen / 30);
  
  return recency;
}

/**
 * Calculate mentor's success streak based on recent sessions.
 * @private
 * @param {Object} mentor
 * @param {Object} history
 * @returns {number}
 */
function calculateSuccessStreak(mentor, history) {
  // TODO: Implement based on actual session history
  // For now, use rating as proxy
  
  if (history.mentorSessions && history.mentorSessions[mentor._id]) {
    const recentSessions = history.mentorSessions[mentor._id]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
    const successCount = recentSessions.filter(s => 
      s.status === 'completed' && (s.rating || 0) >= 4
    ).length;
    
    return successCount / Math.max(1, recentSessions.length);
  }
  
  // Fallback based on overall rating
  const rating = mentor.ratings?.average || mentor.rating || 0;
  return Math.max(0, (rating - 2) / 3);
}

module.exports = { buildMentorFeatures };
