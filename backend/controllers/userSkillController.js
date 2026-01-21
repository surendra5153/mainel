// controllers/userSkillController.js
const User = require('../models/User');
const Skill = require('../models/skill');

/**
 * Add a skill to user's 'teaches' list (optionally linking to catalog)
 * body: { skillId (optional), name, level, description }
 */
exports.addTeachSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skillId, name, level, description } = req.body;
    if (!skillId && !name) return res.status(400).json({ message: 'skillId or name is required' });

    let skillRef = null;
    let displayName = name;
    if (skillId) {
      const s = await Skill.findById(skillId);
      if (!s) return res.status(404).json({ message: 'Skill catalog item not found' });
      skillRef = s._id;
      displayName = s.name;
      // bump popularity
      s.popularity = (s.popularity || 0) + 1;
      await s.save();
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // prevent duplicate teachings of same skill name
    if (user.teaches.some(t => t.name.toLowerCase() === displayName.toLowerCase())) {
      return res.status(409).json({ message: 'Skill already in your teaches list' });
    }

    user.teaches.push({
      skillRef,
      name: displayName,
      level: level || 'beginner',
      description: description || ''
    });

    await user.save();
    res.status(201).json({ teaches: user.teaches });
  } catch (err) {
    next(err);
  }
};

exports.removeTeachSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { teachId } = req.params; // teachId is subdoc id
    await User.updateOne({ _id: userId }, { $pull: { teaches: { _id: teachId } } });
    const user = await User.findById(userId);
    res.json({ teaches: user.teaches });
  } catch (err) {
    next(err);
  }
};

// Add learn skill
exports.addLearnSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skillId, name, level, description } = req.body;
    if (!skillId && !name) return res.status(400).json({ message: 'skillId or name is required' });

    let skillRef = null;
    let displayName = name;
    if (skillId) {
      const s = await Skill.findById(skillId);
      if (!s) return res.status(404).json({ message: 'Skill catalog item not found' });
      skillRef = s._id;
      displayName = s.name;
      // bump popularity
      s.popularity = (s.popularity || 0) + 1;
      await s.save();
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.learns.some(t => t.name.toLowerCase() === displayName.toLowerCase())) {
      return res.status(409).json({ message: 'Skill already in your learns list' });
    }

    user.learns.push({
      skillRef,
      name: displayName,
      level: level || 'beginner',
      description: description || ''
    });
    await user.save();
    res.status(201).json({ learns: user.learns });
  } catch (err) {
    next(err);
  }
};

exports.removeLearnSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { learnId } = req.params;
    await User.updateOne({ _id: userId }, { $pull: { learns: { _id: learnId } } });
    const user = await User.findById(userId);
    res.json({ learns: user.learns });
  } catch (err) {
    next(err);
  }
};

/**
 * Endorse a user's taught skill
 * POST /api/user-skills/:targetUserId/endorse
 * body: { teachId, comment }
 */
exports.endorseTeachSkill = async (req, res, next) => {
  try {
    const fromUserId = req.user.id;
    const { targetUserId } = req.params;
    const { teachId, comment } = req.body;
    if (!teachId) return res.status(400).json({ message: 'teachId is required' });

    if (fromUserId === targetUserId) return res.status(400).json({ message: "You can't endorse yourself" });

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

    const teach = targetUser.teaches.id(teachId);
    if (!teach) return res.status(404).json({ message: 'Teach skill not found' });

    // prevent duplicate endorsement by same user
    if (teach.endorsements && teach.endorsements.some(e => e.by.toString() === fromUserId)) {
      return res.status(409).json({ message: 'You have already endorsed this skill' });
    }

    teach.endorsements.push({ by: fromUserId, comment: comment || '' });
    teach.endorsementsCount = (teach.endorsementsCount || 0) + 1;

    // Save and possibly award badge
    await targetUser.save();

    // Optional: award badge thresholds
    const thresholds = [3, 10, 25]; // example thresholds
    const current = teach.endorsementsCount;
    const awardedBadges = [];

    for (const t of thresholds) {
      if (current >= t) {
        const key = `endorsed_${teach._id}_${t}`; // unique per teach-skill-threshold
        if (!targetUser.badges.some(b => b.key === key)) {
          targetUser.badges.push({ key, title: `Endorsed ${t}x for ${teach.name}`, awardedAt: new Date() });
          awardedBadges.push(key);
        }
      }
    }

    if (awardedBadges.length > 0) await targetUser.save();

    res.json({ message: 'endorsed', endorsementsCount: teach.endorsementsCount, awardedBadges });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a teach skill (subdoc)
 * PUT /api/user-skills/me/teaches/:teachId
 * body: { level, description }
 */
exports.updateTeachSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { teachId } = req.params;
    const { level, description } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const skill = user.teaches.id(teachId);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    if (level) {
      const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (validLevels.includes(level.toLowerCase())) {
        skill.level = level.toLowerCase();
      }
    }
    if (description !== undefined) skill.description = description;

    await user.save();
    res.json({ message: 'Updated', skill });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a learn skill (subdoc)
 * PUT /api/user-skills/me/learns/:learnId
 * body: { level, description }
 */
exports.updateLearnSkill = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { learnId } = req.params;
    const { level, description } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const learn = user.learns.id(learnId);
    if (!learn) return res.status(404).json({ message: 'Learn skill not found' });

    if (level) learn.level = level;
    if (description !== undefined) learn.description = description;

    await user.save();
    res.json({ learns: user.learns });
  } catch (err) {
    next(err);
  }
};
