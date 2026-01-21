const { Session } = require('../models/Session');
const User = require('../models/User');

async function setupChatHandlers(io, socket) {
  const userId = socket.userId;

  socket.on('join:session', async ({ sessionId }) => {
    try {
      if (!sessionId) {
        socket.emit('error', { message: 'Session ID required' });
        return;
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
               
      const isParticipant =
        session.mentor.toString() === userId ||
        session.learner.toString() === userId;

      if (!isParticipant) {
        socket.emit('error', { message: 'Unauthorized: You are not a participant in this session' });
        return;
      }

      const roomName = `session-${sessionId}`;
      socket.join(roomName);

      const user = await User.findById(userId);
      const userName = user ? user.name : 'Unknown User';

      socket.to(roomName).emit('user:joined', {
        userId,
        userName,
        sessionId
      });

      console.log(`User ${userId} (${userName}) joined session room: ${roomName}`);
    } catch (err) {
      console.error('Error joining session:', err);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  socket.on('leave:session', ({ sessionId }) => {
    try {
      if (!sessionId) return;

      const roomName = `session-${sessionId}`;
      socket.leave(roomName);

      socket.to(roomName).emit('user:left', { userId, sessionId });

      console.log(`User ${userId} left session room: ${roomName}`);
    } catch (err) {
      console.error('Error leaving session:', err);
    }
  });

  socket.on('message:send', async ({ sessionId, text }) => {
    try {
      if (!sessionId || !text) {
        socket.emit('error', { message: 'Session ID and message text required' });
        return;
      }

      if (text.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (text.length > 5000) {
        socket.emit('error', { message: 'Message too long (max 5000 characters)' });
        return;
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      const isParticipant =
        session.mentor.toString() === userId ||
        session.learner.toString() === userId;

      if (!isParticipant) {
        socket.emit('error', { message: 'Unauthorized: You are not a participant in this session' });
        return;
      }

      const user = await User.findById(userId);
      const fromName = user ? user.name : 'Unknown User';

      const message = {
        from: userId,
        fromName,
        text: text.trim(),
        createdAt: new Date()
      };

      session.messages.push(message);
      await session.save();

      const roomName = `session-${sessionId}`;
      io.to(roomName).emit('message:received', {
        ...message,
        sessionId
      });

      console.log(`Message sent in session ${sessionId} by ${fromName}`);
    } catch (err) {
      console.error('Error sending message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing:start', async ({ sessionId }) => {
    try {
      if (!sessionId) return;

      const session = await Session.findById(sessionId);
      if (!session) return;

      const isParticipant =
        session.mentor.toString() === userId ||
        session.learner.toString() === userId;

      if (!isParticipant) return;

      const roomName = `session-${sessionId}`;
      socket.to(roomName).emit('typing', {
        userId,
        isTyping: true,
        sessionId
      });
    } catch (err) {
      console.error('Error in typing:start:', err);
    }
  });

  socket.on('typing:stop', async ({ sessionId }) => {
    try {
      if (!sessionId) return;

      const session = await Session.findById(sessionId);
      if (!session) return;

      const isParticipant =
        session.mentor.toString() === userId ||
        session.learner.toString() === userId;

      if (!isParticipant) return;

      const roomName = `session-${sessionId}`;
      socket.to(roomName).emit('typing', {
        userId,
        isTyping: false,
        sessionId
      });
    } catch (err) {
      console.error('Error in typing:stop:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} socket disconnected`);
  });
}

module.exports = setupChatHandlers;
