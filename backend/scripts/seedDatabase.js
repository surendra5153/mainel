require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Skill = require('../models/skill');
const Category = require('../models/Category');
const RVVerification = require('../models/RVVerification');
const connectDB = require('../config/db');

// Sample videos for Skill Showcase
const DEMO_VIDEOS = [
  {
    url: "https://res.cloudinary.com/demo/video/upload/v1687516235/docs_video_demo.mp4",
    title: "Advanced React Patterns",
    publicId: "demo_react_1"
  },
  {
    url: "https://res.cloudinary.com/demo/video/upload/v1687516235/docs_video_demo.mp4",
    title: "System Design Interview Prep",
    publicId: "demo_sys_1"
  },
  {
    url: "https://res.cloudinary.com/demo/video/upload/v1687516235/docs_video_demo.mp4",
    title: "Mastering CSS Grid",
    publicId: "demo_css_1"
  },
  {
    url: "https://res.cloudinary.com/demo/video/upload/v1687516235/docs_video_demo.mp4",
    title: "Intro to Machine Learning",
    publicId: "demo_ml_1"
  }
];

const seedDatabase = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Clear existing data
    await User.deleteMany({});
    await Skill.deleteMany({});
    await Category.deleteMany({});
    await RVVerification.deleteMany({});
    console.log('Cleared existing data');

    // 1. Create Categories
    const categories = [
      { key: 'development', title: 'Development', description: 'Software engineering and coding' },
      { key: 'design', title: 'Design', description: 'UI/UX, Graphic Design, and Art' },
      { key: 'business', title: 'Business', description: 'Product Management, Marketing, and Strategy' },
      { key: 'data', title: 'Data Science', description: 'AI, ML, and Data Analysis' },
      { key: 'music', title: 'Music', description: 'Instruments, production, and theory' },
      { key: 'language', title: 'Languages', description: 'Learning new languages and communication' },
      { key: 'photography', title: 'Photography', description: 'Capturing moments and visual storytelling' },
    ];
    await Category.insertMany(categories);
    console.log('Created categories');

    // 2. Create Skills
    const skillsData = [
      // Development
      { name: 'React.js', slug: 'react-js', category: 'development', description: 'A JavaScript library for building user interfaces', tags: ['frontend', 'js', 'web'], popularity: 95 },
      { name: 'Node.js', slug: 'node-js', category: 'development', description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine', tags: ['backend', 'js', 'api'], popularity: 90 },
      { name: 'Python', slug: 'python', category: 'development', description: 'Versatile programming language for web, data, and automation', tags: ['backend', 'data', 'scripting'], popularity: 98 },
      { name: 'TypeScript', slug: 'typescript', category: 'development', description: 'Typed superset of JavaScript that compiles to plain JavaScript', tags: ['frontend', 'backend', 'types'], popularity: 88 },
      { name: 'Go', slug: 'go', category: 'development', description: 'Open source programming language supported by Google', tags: ['backend', 'systems', 'fast'], popularity: 75 },
      { name: 'Rust', slug: 'rust', category: 'development', description: 'Language empowering everyone to build reliable and efficient software', tags: ['systems', 'fast', 'safety'], popularity: 82 },
      { name: 'Docker', slug: 'docker', category: 'development', description: 'Platform for developing, shipping, and running applications', tags: ['devops', 'containers'], popularity: 85 },
      { name: 'GraphQL', slug: 'graphql', category: 'development', description: 'Query language for APIs and runtime for fulfilling those queries', tags: ['api', 'data'], popularity: 78 },

      // Design
      { name: 'UI Design', slug: 'ui-design', category: 'design', description: 'Designing user interfaces for software and machines', tags: ['interface', 'visual', 'web'], popularity: 92 },
      { name: 'UX Design', slug: 'ux-design', category: 'design', description: 'Enhancing user satisfaction by improving usability and accessibility', tags: ['research', 'usability', 'wireframing'], popularity: 94 },
      { name: 'Figma', slug: 'figma', category: 'design', description: 'Collaborative interface design tool', tags: ['tool', 'prototyping', 'vector'], popularity: 96 },
      { name: 'Adobe Photoshop', slug: 'adobe-photoshop', category: 'design', description: 'Raster graphics editor for image manipulation', tags: ['photo', 'editing', 'graphics'], popularity: 80 },
      { name: 'Blender', slug: 'blender', category: 'design', description: 'Open source 3D creation suite', tags: ['3d', 'modeling', 'animation'], popularity: 85 },
      { name: 'Motion Graphics', slug: 'motion-graphics', category: 'design', description: 'Pieces of animation or digital footage which create the illusion of motion', tags: ['animation', 'video', 'effects'], popularity: 70 },

      // Business
      { name: 'Product Management', slug: 'product-management', category: 'business', description: 'Planning, forecasting, and production, or marketing of a product', tags: ['strategy', 'roadmap', 'agile'], popularity: 88 },
      { name: 'Digital Marketing', slug: 'digital-marketing', category: 'business', description: 'Marketing of products or services using digital technologies', tags: ['seo', 'social', 'ads'], popularity: 84 },
      { name: 'Public Speaking', slug: 'public-speaking', category: 'business', description: 'Performing a speech to a live audience', tags: ['communication', 'leadership', 'presentation'], popularity: 75 },
      { name: 'Project Management', slug: 'project-management', category: 'business', description: 'Initiating, planning, executing, controlling, and closing the work of a team', tags: ['agile', 'scrum', 'planning'], popularity: 82 },
      { name: 'Financial Analysis', slug: 'financial-analysis', category: 'business', description: 'Assessment of the viability, stability, and profitability of a business', tags: ['finance', 'excel', 'money'], popularity: 70 },

      // Data
      { name: 'Data Analysis', slug: 'data-analysis', category: 'data', description: 'Inspecting, cleansing, transforming, and modeling data', tags: ['statistics', 'excel', 'sql'], popularity: 90 },
      { name: 'Machine Learning', slug: 'machine-learning', category: 'data', description: 'Study of computer algorithms that improve automatically through experience', tags: ['ai', 'python', 'algorithms'], popularity: 95 },
      { name: 'SQL', slug: 'sql', category: 'data', description: 'Domain-specific language used in programming and managing data held in a RDBMS', tags: ['database', 'query', 'backend'], popularity: 92 },
      { name: 'Power BI', slug: 'power-bi', category: 'data', description: 'Business analytics service by Microsoft', tags: ['visualization', 'analytics', 'microsoft'], popularity: 78 },

      // Music
      { name: 'Guitar', slug: 'guitar', category: 'music', description: 'Learn to play acoustic or electric guitar', tags: ['instrument', 'strings', 'performance'], popularity: 85 },
      { name: 'Piano', slug: 'piano', category: 'music', description: 'Learn music theory and piano performance', tags: ['instrument', 'keyboard', 'theory'], popularity: 80 },
      { name: 'Music Production', slug: 'music-production', category: 'music', description: 'Process of creating, capturing, manipulating, and preserving music', tags: ['audio', 'mixing', 'mastering'], popularity: 72 },

      // Language
      { name: 'Spanish', slug: 'spanish', category: 'language', description: 'Learn to speak and write Spanish fluently', tags: ['speaking', 'writing', 'communication'], popularity: 88 },
      { name: 'French', slug: 'french', category: 'language', description: 'Learn to speak and write French fluently', tags: ['speaking', 'writing', 'communication'], popularity: 82 },
      { name: 'Mandarin', slug: 'mandarin', category: 'language', description: 'Learn the most spoken language in the world', tags: ['speaking', 'writing', 'chinese'], popularity: 75 },

      // Photography
      { name: 'Photography', slug: 'photography', category: 'photography', description: 'Art, application, and practice of creating durable images', tags: ['camera', 'visual', 'art'], popularity: 85 },
      { name: 'Photo Editing', slug: 'photo-editing', category: 'photography', description: 'Post-processing digital images', tags: ['lightroom', 'retouching', 'color'], popularity: 80 }
    ];
    const createdSkills = await Skill.insertMany(skillsData);
    console.log('Created skills');

    // Helper to find skill ID by name
    const getSkillId = (name) => {
      const skill = createdSkills.find(s => s.name === name);
      return skill ? skill._id : null;
    };

    // 3. Create Users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const users = [
      {
        name: "Aarav Sharma",
        email: "aarav@iitb.ac.in",
        collegeEmail: "aarav@iitb.ac.in",
        passwordHash,
        bio: "3rd Year CS Undergrad at IIT Bombay. Competitive programmer and algorithm enthusiast. I love solving hard problems and teaching DSA.",
        location: "Mumbai, India",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav",
        teaches: [
          { name: "C++", level: "expert", skillRef: getSkillId("C++") },
          { name: "Python", level: "advanced", skillRef: getSkillId("Python") },
          { name: "Data Structures", level: "expert", skillRef: getSkillId("SQL") } // fallback to SQL if DS not in seed
        ],
        learns: [{ name: "Music Production", level: "beginner", skillRef: getSkillId("Music Production") }],
        rating: 4.8,
        reviewsCount: 22,
        isMentor: true,
        isVerified: true,
        points: 2500,
        level: 'Master',
        title: "CS Student @ IIT Bombay",
        yearsOfExperience: 3,
        demoVideos: [DEMO_VIDEOS[1]],
        github: "aarav-codes",
        linkedin: "aarav-sharma-iitb",
        twitter: "aarav_iitb",
        website: "https://aarav.dev"
      },
      {
        name: "Chloe Dubois",
        email: "chloe@sorbonne.fr",
        collegeEmail: "chloe@sorbonne.fr",
        passwordHash,
        bio: "Literature student with a passion for languages. Native French speaker, offering conversation practice and grammar lessons.",
        location: "Paris, France",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe",
        teaches: [
          { name: "French", level: "expert", skillRef: getSkillId("French") }
        ],
        learns: [{ name: "Photography", level: "intermediate", skillRef: getSkillId("Photography") }],
        rating: 4.9,
        reviewsCount: 30,
        isMentor: true,
        isVerified: true,
        points: 1200,
        level: 'Master',
        title: "Literature Major",
        yearsOfExperience: 4,
        demoVideos: [],
        github: "chloe-lit",
        linkedin: "chloe-dubois-paris"
      },
      {
        name: "Rohan Gupta",
        email: "rohan@rvce.edu.in",
        collegeEmail: "rohan@rvce.edu.in",
        passwordHash,
        bio: "Final year ECE student. I build robots and write embedded C code. Also a huge guitar nerd.",
        location: "Bengaluru, India",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",
        teaches: [
          { name: "Guitar", level: "intermediate", skillRef: getSkillId("Guitar") },
          { name: "C", level: "advanced", skillRef: getSkillId("C") }
        ],
        learns: [{ name: "Rust", level: "beginner", skillRef: getSkillId("Rust") }],
        rating: 4.6,
        reviewsCount: 10,
        isMentor: true,
        isVerified: true,
        points: 500,
        level: 'Apprentice',
        title: "ECE Student & Guitarist",
        yearsOfExperience: 2,
        demoVideos: [],
        github: "rohan-robotics",
        linkedin: "rohan-gupta-ece",
        website: "https://rohanbots.com"
      },
      {
        name: "Emily Zhang",
        email: "emily@berklee.edu",
        collegeEmail: "emily@berklee.edu",
        passwordHash,
        bio: "Music Production major at Berklee. I can help you mix your first track or understand music theory.",
        location: "Boston, USA",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
        teaches: [
          { name: "Music Production", level: "expert", skillRef: getSkillId("Music Production") },
          { name: "Piano", level: "advanced", skillRef: getSkillId("Piano") }
        ],
        learns: [{ name: "Digital Marketing", level: "beginner", skillRef: getSkillId("Digital Marketing") }],
        rating: 5.0,
        reviewsCount: 18,
        isMentor: true,
        isVerified: true,
        points: 800,
        level: 'Apprentice',
        title: "Music Student",
        yearsOfExperience: 5,
        demoVideos: [DEMO_VIDEOS[2]],
        linkedin: "emily-zhang-music",
        website: "https://soundcloud.com/emily-z"
      },
      {
        name: "Liam O'Connor",
        email: "liam@tcd.ie",
        collegeEmail: "liam@tcd.ie",
        passwordHash,
        bio: "Photography enthusiast and History student. I capture street life and landscapes. Let's talk about composition.",
        location: "Dublin, Ireland",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Liam",
        teaches: [
          { name: "Photography", level: "advanced", skillRef: getSkillId("Photography") },
          { name: "Photo Editing", level: "intermediate", skillRef: getSkillId("Photo Editing") }
        ],
        learns: [{ name: "Spanish", level: "beginner", skillRef: getSkillId("Spanish") }],
        rating: 4.7,
        reviewsCount: 14,
        isMentor: true,
        isVerified: true,
        points: 420,
        level: 'Apprentice',
        title: "Photographer",
        yearsOfExperience: 3,
        demoVideos: [],
        linkedin: "liam-oconnor-photo",
        twitter: "liam_lens"
      },
      {
        name: "Yuki Tanaka",
        email: "yuki@todai.ac.jp",
        collegeEmail: "yuki@todai.ac.jp",
        passwordHash,
        bio: "Masters student in AI. Specializing in NLP and large language models. I can help with Python and ML math.",
        location: "Tokyo, Japan",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki",
        teaches: [
          { name: "Machine Learning", level: "advanced", skillRef: getSkillId("Machine Learning") },
          { name: "Python", level: "expert", skillRef: getSkillId("Python") }
        ],
        learns: [{ name: "English Conversation", level: "intermediate", skillRef: getSkillId("English Conversation") }], // No specific skill ID map for this, let's allow it to be undefined or map to Language
        rating: 4.9,
        reviewsCount: 55, // >50 for Grandmaster
        isMentor: true,
        isVerified: true,
        points: 5500,
        level: 'Grandmaster',
        title: "AI Researcher",
        yearsOfExperience: 6,
        demoVideos: [DEMO_VIDEOS[3]],
        github: "yuki-nlp",
        linkedin: "yuki-tanaka-ai",
        website: "https://yuki-research.jp"
      },
      {
        name: "Sofia Rossi",
        email: "sofia@polimi.it",
        collegeEmail: "sofia@polimi.it",
        passwordHash,
        bio: "Design student at Politecnico di Milano. I love minimal UI and accessible design. Figma wizard.",
        location: "Milan, Italy",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia",
        teaches: [
          { name: "UI Design", level: "advanced", skillRef: getSkillId("UI Design") },
          { name: "Figma", level: "expert", skillRef: getSkillId("Figma") }
        ],
        learns: [{ name: "React.js", level: "beginner", skillRef: getSkillId("React.js") }],
        rating: 4.8,
        reviewsCount: 9,
        isMentor: true,
        isVerified: true,
        points: 350,
        level: 'Apprentice',
        title: "Design Student",
        yearsOfExperience: 2,
        demoVideos: [DEMO_VIDEOS[2]],
        linkedin: "sofia-rossi-design",
        website: "https://sofia.design"
      },
      {
        name: "James Wilson",
        email: "james@ox.ac.uk",
        collegeEmail: "james@ox.ac.uk",
        passwordHash,
        bio: "Economics undergrad at Oxford. I can help with financial analysis, Excel, and macroeconomics.",
        location: "Oxford, UK",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        teaches: [
          { name: "Financial Analysis", level: "advanced", skillRef: getSkillId("Financial Analysis") }
        ],
        learns: [{ name: "Python", level: "beginner", skillRef: getSkillId("Python") }],
        rating: 4.5,
        reviewsCount: 2,
        isMentor: true,
        isVerified: true,
        points: 100,
        level: 'Novice',
        title: "Economics Student",
        yearsOfExperience: 1,
        demoVideos: [],
        linkedin: "james-wilson-ox"
      },
      {
        name: "Mei Lin",
        email: "mei@nus.edu.sg",
        collegeEmail: "mei@nus.edu.sg",
        passwordHash,
        bio: "Business Analytics student at NUS. I combine data skills with business strategy. Avid traveler.",
        location: "Singapore",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mei",
        teaches: [
          { name: "Data Analysis", level: "advanced", skillRef: getSkillId("Data Analysis") },
          { name: "Power BI", level: "intermediate", skillRef: getSkillId("Power BI") },
          { name: "Mandarin", level: "expert", skillRef: getSkillId("Mandarin") }
        ],
        learns: [{ name: "UX Design", level: "beginner", skillRef: getSkillId("UX Design") }],
        rating: 4.9,
        reviewsCount: 52, // >50 for Grandmaster
        isMentor: true,
        isVerified: true,
        points: 4800,
        level: 'Grandmaster',
        title: "Business Analytics Student",
        yearsOfExperience: 5,
        demoVideos: [],
        linkedin: "mei-lin-analytics",
        twitter: "mei_analytics"
      },
      {
        name: "Carlos Mendez",
        email: "carlos@unam.mx",
        collegeEmail: "carlos@unam.mx",
        passwordHash,
        bio: "Computer Engineering student. I love open source and Linux. Maintainer of a few small libraries.",
        location: "Mexico City, Mexico",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
        teaches: [
          { name: "Go", level: "intermediate", skillRef: getSkillId("Go") },
          { name: "Docker", level: "advanced", skillRef: getSkillId("Docker") }
        ],
        learns: [{ name: "Guitar", level: "beginner", skillRef: getSkillId("Guitar") }],
        rating: 4.7,
        reviewsCount: 15,
        isMentor: true,
        isVerified: true,
        points: 450,
        level: 'Master',
        // Note: 15 reviews usually Apprentice/Master borderline, setting to Master for variety
        title: "Eng Student & OSS Contributor",
        yearsOfExperience: 3,
        demoVideos: [DEMO_VIDEOS[1]],
        github: "carlos-mendez-oss",
        linkedin: "carlos-mendez-mx",
        website: "https://carlos.tech"
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users with gamification and campus details`);

    // 4. Create RV Verification for Rohan
    const rohanUser = createdUsers.find(u => u.email === 'rohan@rvce.edu.in');
    if (rohanUser) {
      await User.findByIdAndUpdate(rohanUser._id, {
        rvProfile: {
          branch: "Electronics & Communication",
          year: 4,
          verifiedAt: new Date(),
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        }
      });

      await RVVerification.create({
        userId: rohanUser._id,
        rvEmail: rohanUser.collegeEmail,
        idCardImageUrl: "https://via.placeholder.com/300x200.png?text=RV+College+ID",
        status: 'verified',
        emailVerified: true,
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      });
      console.log('Created RV Verification for Rohan');
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
