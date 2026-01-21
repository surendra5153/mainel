// routes/categories.js
const express = require('express');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

const router = express.Router();

// Public
router.get('/', ctrl.listCategories);
router.get('/:key', ctrl.getCategory);

// Protected (only auth for now; plug admin check later)
router.post('/', auth, ctrl.createCategory);
router.put('/:key', auth, ctrl.updateCategory);
router.delete('/:key', auth, ctrl.deleteCategory);

module.exports = router;
