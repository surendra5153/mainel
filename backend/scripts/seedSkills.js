// scripts/seedSkills.js
require('dotenv').config();
const connectDB = require('../config/db');
const Skill = require('../models/skill');
const Category = require('../models/Category');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skill-swap';

const categories = [
  { key: 'programming', title: 'Programming', description: 'Coding, software engineering', tags: ['web','backend','frontend','fullstack'] },
  { key: 'music', title: 'Music', description: 'Instruments & theory', tags: ['guitar','piano','singing'] },
  { key: 'design', title: 'Design', description: 'UI/UX, graphics, illustration', tags: ['ui','ux','figma','photoshop'] },
  { key: 'language', title: 'Languages', description: 'Spoken and written languages', tags: ['english','spanish','japanese'] },
  { key: 'productivity', title: 'Productivity', description: 'Time management, tools, workflows', tags: ['notion','todo','gtD'] },
  { key: 'marketing', title: 'Marketing', description: 'Digital & content marketing', tags: ['seo','ads','content'] },
  { key: 'photography', title: 'Photography', description: 'Cameras, editing, composition', tags: ['dslr','lightroom'] }
];

const skills = [
  { name: 'React.js', category: 'programming', description: 'Modern frontend framework', tags: ['react','frontend','javascript'] },
  { name: 'Node.js', category: 'programming', description: 'Server-side JavaScript', tags: ['node','backend','js'] },
  { name: 'Express.js', category: 'programming', description: 'Minimal Node web framework', tags: ['express','backend'] },
  { name: 'MongoDB', category: 'programming', description: 'NoSQL database', tags: ['mongodb','database'] },
  { name: 'Guitar (acoustic)', category: 'music', description: 'Beginner to intermediate guitar lessons', tags: ['guitar','music'] },
  { name: 'Piano Basics', category: 'music', description: 'Piano fundamentals', tags: ['piano','music'] },
  { name: 'UI/UX Design', category: 'design', description: 'Designing interfaces and experiences', tags: ['ui','ux','figma'] },
  { name: 'English Conversation', category: 'language', description: 'Improve spoken English', tags: ['english','speaking'] },
  { name: 'Notion Workflows', category: 'productivity', description: 'Templates and productivity flows in Notion', tags: ['notion','productivity'] },
  { name: 'SEO Basics', category: 'marketing', description: 'Search engine optimization fundamentals', tags: ['seo','marketing'] },
  { name: 'Portrait Photography', category: 'photography', description: 'Lighting and posing for portraits', tags: ['photography','portrait'] }
];

async function seed() {
  try {
    await connectDB(MONGO_URI);
    console.log('Connected to DB for seeding');

    // Insert categories (upsert)
    for (const c of categories) {
      const existing = await Category.findOne({ key: c.key });
      if (!existing) {
        await Category.create(c);
        console.log('Created category:', c.key);
      } else {
        console.log('Category exists:', c.key);
      }
    }

    // Insert skills (upsert by slug)
    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    for (const s of skills) {
      const slug = slugify(s.name);
      const exists = await Skill.findOne({ $or: [{ slug }, { name: s.name }] });
      if (!exists) {
        await Skill.create({
          name: s.name,
          slug,
          category: s.category || 'general',
          description: s.description || '',
          tags: s.tags || [],
          popularity: Math.floor(Math.random() * 30)
        });
        console.log('Created skill:', s.name);
      } else {
        console.log('Skill exists:', s.name);
      }
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
}

seed();
