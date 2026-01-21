export const SKILL_DATA = {
    nodes: [
        { id: 'web-dev', position: { x: 250, y: 0 }, data: { label: 'Web Development Basics' }, type: 'input' },

        // Frontend Branch
        { id: 'html', position: { x: 100, y: 100 }, data: { label: 'HTML5' } },
        { id: 'css', position: { x: 100, y: 200 }, data: { label: 'CSS3' } },
        { id: 'js', position: { x: 100, y: 300 }, data: { label: 'JavaScript' } },
        { id: 'react', position: { x: 100, y: 400 }, data: { label: 'React.js' } },

        // Backend Branch
        { id: 'nodejs', position: { x: 400, y: 100 }, data: { label: 'Node.js' } },
        { id: 'express', position: { x: 400, y: 200 }, data: { label: 'Express.js' } },
        { id: 'mongodb', position: { x: 400, y: 300 }, data: { label: 'MongoDB' } },

        // Deployment
        { id: 'deployment', position: { x: 250, y: 500 }, data: { label: 'Deployment (Vercel/Heroku)' }, type: 'output' }
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
};
