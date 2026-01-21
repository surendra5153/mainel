// controllers/categoryController.js
const Category = require('../models/Category');

/**
 * Create a category
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { key, title, description, tags } = req.body;
    if (!key || !title) return res.status(400).json({ message: 'key and title required' });

    const exists = await Category.findOne({ $or: [{ key }, { title }] });
    if (exists) return res.status(409).json({ message: 'Category exists' });

    const cat = await Category.create({
      key,
      title,
      description: description || '',
      tags: tags || []
    });

    res.status(201).json({ category: cat });
  } catch (err) {
    next(err);
  }
};

exports.listCategories = async (req, res, next) => {
  try {
    const cats = await Category.find({}).sort({ title: 1 }).lean();
    res.json({ items: cats });
  } catch (err) {
    next(err);
  }
};

exports.getCategory = async (req, res, next) => {
  try {
    const { key } = req.params;
    const cat = await Category.findOne({ key });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json({ category: cat });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { key } = req.params;
    const updates = req.body;
    const cat = await Category.findOneAndUpdate({ key }, updates, { new: true });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json({ category: cat });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { key } = req.params;
    await Category.deleteOne({ key });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
