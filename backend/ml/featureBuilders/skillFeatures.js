// ml/featureBuilders/skillFeatures.js

/**
 * Build feature vector for skill recommendation.
 * All features are normalized to [0, 1] range for consistent weighting.
 * 
 * @param {Object} params - Feature building parameters
 * @param {Object} params.user - User object with teaches/learns arrays
 * @param {Object} params.skill - Skill object with tags, category, popularity
 * @param {Object} params.history - Optional: user's session history and interaction data
 * @returns {Object} { features: number[], explanation: string }
 */
function buildSkillFeatures({ user, skill, history = {} }) {
  const features = [];
  const explanationParts = [];

  // ===== Feature 1: Tag Similarity (Jaccard index) =====
  const userTags = extractUserTags(user);
  const skillTags = skill.tags || [];
  const tagSimilarity = jaccardSimilarity(userTags, skillTags);
  features.push(tagSimilarity);
  
  if (tagSimilarity > 0.3) {
    explanationParts.push(`Strong tag overlap (${(tagSimilarity * 100).toFixed(0)}%)`);
  }

  // ===== Feature 2: Category Match =====
  const userCategories = extractUserCategories(user);
  const categoryMatch = userCategories.has(skill.category) ? 1.0 : 0.0;
  features.push(categoryMatch);
  
  if (categoryMatch > 0) {
    explanationParts.push(`Matches your ${skill.category} interests`);
  }

  // ===== Feature 3: Skill Popularity (normalized) =====
  // Normalize popularity using log scale (assuming popularity ranges 0-1000+)
  const normalizedPopularity = normalizePopularity(skill.popularity || 0);
  features.push(normalizedPopularity);
  
  if (normalizedPopularity > 0.7) {
    explanationParts.push('Highly popular skill');
  }

  // ===== Feature 4: Learning Gap Indicator =====
  // Check if user wants to learn this or similar skills
  const learningGap = calculateLearningGap(user, skill);
  features.push(learningGap);
  
  if (learningGap > 0.5) {
    explanationParts.push('Aligns with your learning goals');
  }

  // ===== Feature 5: Recency Score =====
  // If history provided, compute recency of interest in similar skills
  const recencyScore = calculateRecency(user, skill, history);
  features.push(recencyScore);
  
  if (recencyScore > 0.6) {
    explanationParts.push('Recently active in related skills');
  }

  // ===== Feature 6: Complementary Skill Indicator =====
  // Skills that complement what user already teaches
  const complementaryScore = calculateComplementarity(user, skill);
  features.push(complementaryScore);
  
  if (complementaryScore > 0.5) {
    explanationParts.push('Complements your existing skills');
  }

  // ===== Feature 7: User Skill Level Gap =====
  // Prefer skills user doesn't already teach at expert level
  const skillLevelGap = calculateSkillLevelGap(user, skill);
  features.push(skillLevelGap);

  const explanation = explanationParts.length > 0 
    ? explanationParts.join('; ')
    : 'Recommended based on general popularity';

  return { features, explanation };
}

/**
 * Extract all unique tags from user's teaches and learns skills.
 * @private
 * @param {Object} user
 * @returns {Set<string>}
 */
function extractUserTags(user) {
  const tags = new Set();
  
  const teaches = user.teaches || [];
  const learns = user.learns || [];
  
  [...teaches, ...learns].forEach(skill => {
    if (skill.name) {
      // Use skill name as a tag
      tags.add(skill.name.toLowerCase());
    }
    // If skills have tags embedded, extract them
    if (skill.tags && Array.isArray(skill.tags)) {
      skill.tags.forEach(tag => tags.add(tag.toLowerCase()));
    }
  });
  
  return tags;
}

/**
 * Extract categories from user's skills.
 * @private
 * @param {Object} user
 * @returns {Set<string>}
 */
function extractUserCategories(user) {
  const categories = new Set();
  
  // Note: User skill schema doesn't have category directly
  // This is a placeholder for when categories are added to user skills
  // or inferred from skillRef
  
  // For now, we can infer some categories from skill names
  const teaches = user.teaches || [];
  const learns = user.learns || [];
  
  [...teaches, ...learns].forEach(skill => {
    // This would ideally look up the skillRef to get actual category
    // For deterministic behavior, we skip this for now
    if (skill.category) {
      categories.add(skill.category);
    }
  });
  
  return categories;
}

/**
 * Calculate Jaccard similarity between two sets.
 * @private
 * @param {Set|Array} setA
 * @param {Set|Array} setB
 * @returns {number} Similarity score [0, 1]
 */
function jaccardSimilarity(setA, setB) {
  const a = new Set(Array.isArray(setA) ? setA.map(s => s.toLowerCase()) : setA);
  const b = new Set(Array.isArray(setB) ? setB.map(s => s.toLowerCase()) : setB);
  
  if (a.size === 0 && b.size === 0) return 0;
  
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Normalize popularity using log scale.
 * @private
 * @param {number} popularity - Raw popularity count
 * @returns {number} Normalized [0, 1]
 */
function normalizePopularity(popularity) {
  // Using log scale to handle wide range of popularity values
  // Assumes max popularity around 1000
  if (popularity <= 0) return 0;
  const normalized = Math.log10(popularity + 1) / Math.log10(1001);
  return Math.min(1, Math.max(0, normalized));
}

/**
 * Calculate learning gap: how much user wants to learn this skill.
 * @private
 * @param {Object} user
 * @param {Object} skill
 * @returns {number} Gap score [0, 1]
 */
function calculateLearningGap(user, skill) {
  const learns = user.learns || [];
  const teaches = user.teaches || [];
  
  // Check if skill name matches what user wants to learn
  const skillNameLower = skill.name.toLowerCase();
  const wantsToLearn = learns.some(s => s.name.toLowerCase().includes(skillNameLower));
  const alreadyTeaches = teaches.some(s => s.name.toLowerCase().includes(skillNameLower));
  
  if (wantsToLearn && !alreadyTeaches) return 1.0;
  if (wantsToLearn && alreadyTeaches) return 0.5;
  
  // Check tag overlap with learning interests
  const learnTags = new Set();
  learns.forEach(s => learnTags.add(s.name.toLowerCase()));
  
  const tagOverlap = jaccardSimilarity(learnTags, skill.tags || []);
  return tagOverlap;
}

/**
 * Calculate recency of user interaction with similar skills.
 * @private
 * @param {Object} user
 * @param {Object} skill
 * @param {Object} history
 * @returns {number} Recency score [0, 1]
 */
function calculateRecency(user, skill, history) {
  // TODO: Integrate with actual session history when available
  // For now, use simple heuristic based on lastSeen
  
  if (!user.lastSeen) return 0;
  
  const daysSinceLastSeen = (Date.now() - new Date(user.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
  
  // Decay: active in last 7 days = 1.0, after 30 days = 0
  const recency = Math.max(0, 1 - daysSinceLastSeen / 30);
  
  return recency;
}

/**
 * Calculate how well skill complements user's existing skills.
 * @private
 * @param {Object} user
 * @param {Object} skill
 * @returns {number} Complementarity score [0, 1]
 */
function calculateComplementarity(user, skill) {
  const teaches = user.teaches || [];
  
  // Common skill pairing heuristics (hardcoded for deterministic behavior)
  const complementaryPairs = {
    'javascript': ['typescript', 'react', 'node', 'nodejs'],
    'python': ['django', 'flask', 'machine learning', 'data science'],
    'react': ['redux', 'nextjs', 'typescript'],
    'html': ['css', 'javascript'],
    'css': ['html', 'sass', 'tailwind'],
    'java': ['spring', 'kotlin', 'android'],
    'sql': ['database', 'postgresql', 'mysql']
  };
  
  const skillNameLower = skill.name.toLowerCase();
  let maxComplementarity = 0;
  
  for (const teachSkill of teaches) {
    const teachNameLower = teachSkill.name.toLowerCase();
    
    // Check if current skill complements a taught skill
    if (complementaryPairs[teachNameLower]) {
      const isComplementary = complementaryPairs[teachNameLower].some(comp => 
        skillNameLower.includes(comp) || comp.includes(skillNameLower)
      );
      if (isComplementary) maxComplementarity = Math.max(maxComplementarity, 0.8);
    }
  }
  
  return maxComplementarity;
}

/**
 * Calculate skill level gap (prefer skills user doesn't already master).
 * @private
 * @param {Object} user
 * @param {Object} skill
 * @returns {number} Gap score [0, 1]
 */
function calculateSkillLevelGap(user, skill) {
  const teaches = user.teaches || [];
  const skillNameLower = skill.name.toLowerCase();
  
  // Find matching skill in user's teaches array
  const matchingSkill = teaches.find(s => s.name.toLowerCase().includes(skillNameLower));
  
  if (!matchingSkill) return 1.0; // User doesn't have this skill
  
  // If user teaches it, score based on level (prefer if not expert)
  const levelScores = {
    'beginner': 0.8,
    'intermediate': 0.6,
    'advanced': 0.3,
    'expert': 0.1
  };
  
  return levelScores[matchingSkill.level] || 1.0;
}

module.exports = { buildSkillFeatures };
