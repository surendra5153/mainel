// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

// Database and Models
const connectDB = require('./config/db');
const Session = require('./models/Session');
const User = require('./models/User');

// Configuration
const setupPassport = require('./config/passport');

// Routes
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const skillRoutes = require('./routes/skills');
const categoryRoutes = require('./routes/categories');
const userSkillRoutes = require('./routes/userSkills');
const sessionRoutes = require('./routes/sessions');
const mentorRoutes = require('./routes/mentors');
const uploadRoutes = require('./routes/upload');
const videoRoutes = require('./routes/videoRoutes');
const userRoutes = require('./routes/userRoutes');
const mlRoutes = require('./routes/mlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const rvVerificationRoutes = require('./routes/rvVerificationRoutes');
const app = express();

// ----------------------------------------------
// CONNECT TO DATABASE
// ----------------------------------------------
connectDB(process.env.MONGO_URI).catch((err) => {
  console.error('MongoDB Connection Error:', err.message);
  console.error('⚠️ Backend running without database - some features unavailable');
  console.warn('Frontend will work but database features disabled');
  // Don't exit - let server start anyway for development
});

// ----------------------------------------------
// MIDDLEWARE
// ----------------------------------------------
app.use(express.json());
app.use(cookieParser());

// CORS for frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://mainel-gilt.vercel.app",
      "https://mainel-gilt.vercel.app/"
    ],
    credentials: true,
  })
);

// Passport OAuth
// Passport OAuth
setupPassport();
app.use(passport.initialize());

// ----------------------------------------------
// ROUTES
// ----------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/categories', categoryRoutes);

// ⭐ HERE IS THE USER SKILL ROUTES YOU ASKED FOR ⭐
app.use('/api/user-skills', userSkillRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/videos', videoRoutes); // For POST /api/videos/upload
app.use('/api/user/demo-videos', videoRoutes); // For GET/DELETE /api/user/demo-videos
app.use('/api/user', userRoutes); // For /api/user/profile
app.use('/api/ml', mlRoutes); // ML-powered skill recommendations
app.use('/api/ml', analyticsRoutes); // ML analytics and predictions
app.use('/api/rv-verification', rvVerificationRoutes); // RV College verification
app.use('/api/roadmaps', require('./routes/roadmapRoutes')); // Dynamic Roadmaps

// ----------------------------------------------
// SOCKET.IO (authenticated real-time chat)
// ----------------------------------------------
const server = http.createServer(app);
const corsOrigin = process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:5173,https://mainel-gilt.vercel.app';
const io = new Server(server, {
  cors: {
    origin: corsOrigin.split(',').map(o => o.trim()),
    methods: ["GET", "POST"],
    credentials: true
  }
});

const authenticateSocket = require('./utils/socketAuth');
const setupChatHandlers = require('./sockets/chatHandler');
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`Socket.io: User ${socket.userId} connected (${socket.id})`);
  setupChatHandlers(io, socket);
});

// ----------------------------------------------
// HEALTH CHECK
// ----------------------------------------------
app.get('/', (req, res) => {
  res.send('SkillSwap API is running...');
});

// ----------------------------------------------
// ERROR HANDLER
// ----------------------------------------------
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ----------------------------------------------
// START SERVER
// ----------------------------------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server (with sockets) running at http://localhost:${PORT}`);
});
