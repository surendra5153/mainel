// routes/userSkills.js
const express = require('express');
const userSkillController = require('../controllers/userSkillController');
const auth = require('../middleware/auth');

const router = express.Router();

// Add/remove teach skills
router.post('/me/teaches', auth, userSkillController.addTeachSkill);
router.delete('/me/teaches/:teachId', auth, userSkillController.removeTeachSkill);

// Update teach skill
router.put('/me/teaches/:teachId', auth, userSkillController.updateTeachSkill);

// Add/remove learn skills
router.post('/me/learns', auth, userSkillController.addLearnSkill);
router.delete('/me/learns/:learnId', auth, userSkillController.removeLearnSkill);

// Update learn skill
router.put('/me/learns/:learnId', auth, userSkillController.updateLearnSkill);

// Endorse someone else's teach skill
router.post('/:targetUserId/endorse', auth, userSkillController.endorseTeachSkill);

module.exports = router;
