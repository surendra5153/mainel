const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Roadmap = require('../models/Roadmap');

dotenv.config({ path: '.env' }); // Running from backend root

const roadmaps = [
    {
        title: 'Full Stack Web Development',
        slug: 'full-stack',
        description: 'Master both frontend and backend technologies to build complete web applications.',
        nodes: [
            { id: 'web-dev', position: { x: 250, y: 0 }, data: { label: 'Web Development Basics' }, type: 'input' },
            // Frontend
            { id: 'html', position: { x: 100, y: 100 }, data: { label: 'HTML5' } },
            { id: 'css', position: { x: 100, y: 200 }, data: { label: 'CSS3' } },
            { id: 'js', position: { x: 100, y: 300 }, data: { label: 'JavaScript' } },
            { id: 'react', position: { x: 100, y: 400 }, data: { label: 'React.js' } },
            // Backend
            { id: 'nodejs', position: { x: 400, y: 100 }, data: { label: 'Node.js' } },
            { id: 'express', position: { x: 400, y: 200 }, data: { label: 'Express.js' } },
            { id: 'mongodb', position: { x: 400, y: 300 }, data: { label: 'MongoDB' } },
            // Finish
            { id: 'deployment', position: { x: 250, y: 500 }, data: { label: 'Deployment' }, type: 'output' }
        ],
        edges: [
            { id: 'e1-1', source: 'web-dev', target: 'html' },
            { id: 'e1-2', source: 'web-dev', target: 'nodejs' },
            { id: 'e2-1', source: 'html', target: 'css' },
            { id: 'e2-2', source: 'css', target: 'js' },
            { id: 'e2-3', source: 'js', target: 'react' },
            { id: 'e3-1', source: 'nodejs', target: 'express' },
            { id: 'e3-2', source: 'express', target: 'mongodb' },
            { id: 'e4-1', source: 'react', target: 'deployment' },
            { id: 'e4-2', source: 'mongodb', target: 'deployment' }
        ]
    },
    {
        title: 'Data Science',
        slug: 'data-science',
        description: 'Learn to analyze data, build ML models, and visualize insights.',
        nodes: [
            { id: 'ds-basics', position: { x: 250, y: 0 }, data: { label: 'Data Science Basics' }, type: 'input' },
            { id: 'python', position: { x: 250, y: 100 }, data: { label: 'Python' } },
            // Analysis
            { id: 'pandas', position: { x: 150, y: 200 }, data: { label: 'Pandas' } },
            { id: 'numpy', position: { x: 350, y: 200 }, data: { label: 'NumPy' } },
            // Viz
            { id: 'matplotlib', position: { x: 250, y: 300 }, data: { label: 'Matplotlib' } },
            // ML
            { id: 'sklearn', position: { x: 250, y: 400 }, data: { label: 'Scikit-Learn' } },
            { id: 'dl', position: { x: 250, y: 500 }, data: { label: 'Deep Learning (PyTorch)' }, type: 'output' }
        ],
        edges: [
            { id: 'ds-1', source: 'ds-basics', target: 'python' },
            { id: 'ds-2', source: 'python', target: 'pandas' },
            { id: 'ds-3', source: 'python', target: 'numpy' },
            { id: 'ds-4', source: 'pandas', target: 'matplotlib' },
            { id: 'ds-5', source: 'numpy', target: 'matplotlib' },
            { id: 'ds-6', source: 'matplotlib', target: 'sklearn' },
            { id: 'ds-7', source: 'sklearn', target: 'dl' }
        ]
    }
];

const seedDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // clear existing roadmaps
        await Roadmap.deleteMany({});
        console.log('Cleared existing roadmaps');

        await Roadmap.insertMany(roadmaps);
        console.log('Roadmaps seeded successfully');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
