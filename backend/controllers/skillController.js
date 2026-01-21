// controllers/skillController.js
const Skill = require('../models/skill');
const User = require('../models/User');
const Category = require('../models/Category'); // <-- new: ensure categories exist
const axios = require('axios');

/** simple slugger */
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Create a skill in the global catalog.
 * Body: { name, category (key), description, tags }
 * If category key doesn't exist, auto-create it (you can change to reject if desired).
 */
exports.createSkill = async (req, res, next) => {
  try {
    const { name, category, description, tags } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const slug = slugify(name);
    const exists = await Skill.findOne({ $or: [{ name }, { slug }] });
    if (exists) return res.status(409).json({ message: 'Skill already exists' });

    // === PATCH: ensure category exists (accepts category as key) ===
    let categoryValue = category || 'general';
    if (category) {
      const cat = await Category.findOne({ key: category });
      if (!cat) {
        // create category automatically (alternatively you can reject instead)
        await Category.create({ key: category, title: category, description: '', tags: [] });
      }
    }
    // === end patch ===

    const skill = await Skill.create({
      name,
      slug,
      category: categoryValue,
      description: description || '',
      tags: tags || [],
      createdBy: req.user?.id
    });

    res.status(201).json({ skill });
  } catch (err) {
    next(err);
  }
};

exports.getSkill = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const skill = await Skill.findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    res.json({ skill });
  } catch (err) {
    next(err);
  }
};

exports.updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.name) updates.slug = slugify(updates.name);
    updates.updatedAt = new Date();

    // If category is being updated and it doesn't exist, create it (same logic as create)
    if (updates.category) {
      const cat = await Category.findOne({ key: updates.category });
      if (!cat) {
        await Category.create({ key: updates.category, title: updates.category, description: '', tags: [] });
      }
    }

    const skill = await Skill.findByIdAndUpdate(id, updates, { new: true });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    res.json({ skill });
  } catch (err) {
    next(err);
  }
};

exports.deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Skill.findByIdAndDelete(id);
    // remove references in users (teaches/learns)
    await User.updateMany({}, { $pull: { teaches: { skillRef: id }, learns: { skillRef: id } } });
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    next(err);
  }
};

exports.listSkills = async (req, res, next) => {
  try {
    const { q, tags, category, sort = 'popularity', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim()) };

    // If q is present, prefer text search (requires a text index) — fallback to regex name search
    let useText = false;
    try {
      const indexes = Skill.schema.indexes();
      useText = indexes.some(idx => Object.keys(idx[0]).some(k => idx[0][k] === 'text' || k === 'name' || k === 'description'));
    } catch (e) {
      useText = false;
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const sortBy = sort === 'newest' ? { createdAt: -1 } : { popularity: -1 };

    let query;
    if (q) {
      // text search if available
      if (useText) {
        query = Skill.find({ ...filter, $text: { $search: q } });
      } else {
        query = Skill.find({ ...filter, name: { $regex: q, $options: 'i' } });
      }
    } else {
      query = Skill.find(filter);
    }

    const items = await query.sort(sortBy).skip(skip).limit(parseInt(limit, 10)).exec();
    const total = await Skill.countDocuments(filter);

    res.json({ items, total, page: parseInt(page, 10), limit: parseInt(limit, 10) });
  } catch (err) {
    next(err);
  }
};

// Fetch skill recommendations for a user
exports.getRecommendations = async (req, res) => {
  const userId = req.params.userId;

  try {
    const response = await axios.get(`http://localhost:5001/recommend`, {
      params: { user_id: userId }
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
