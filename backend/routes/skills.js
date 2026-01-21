// routes/skills.js
const express = require('express');
const { createSkill, listSkills, getSkill, updateSkill, deleteSkill, getRecommendations } = require('../controllers/skillController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public listing & read
router.get('/', listSkills);
router.get('/:idOrSlug', getSkill);

// Protected create/update/delete (admins or creators ideally)
router.post('/', auth, createSkill);
router.put('/:id', auth, updateSkill);
router.delete('/:id', auth, deleteSkill);

// Route to get skill recommendations for a user
router.get('/recommendations/:userId', getRecommendations);

module.exports = router;
