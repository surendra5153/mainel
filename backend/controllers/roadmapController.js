const Roadmap = require('../models/Roadmap');

/**
 * List all available roadmaps
 * GET /api/roadmaps/list
 */
exports.listRoadmaps = async (req, res) => {
    try {
        const roadmaps = await Roadmap.find({}, 'title slug description');
        res.json({ success: true, data: roadmaps });
    } catch (err) {
        console.error('Error listing roadmaps:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get full roadmap definition by slug
 * GET /api/roadmaps/:slug
 */
exports.getRoadmapBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const roadmap = await Roadmap.findOne({ slug });

        if (!roadmap) {
            return res.status(404).json({ success: false, message: 'Roadmap not found' });
        }

        res.json({ success: true, data: roadmap });
    } catch (err) {
        console.error('Error fetching roadmap:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
