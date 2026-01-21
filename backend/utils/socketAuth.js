const jwt = require('jsonwebtoken');

function authenticateSocket(socket, next) {
  try {
    let token = null;

    if (socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    }

    if (!token && socket.handshake.headers.cookie) {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      token = cookies.accessToken;
    }

    if (!token) {
      const error = new Error('Authentication error: No token provided');
      error.data = { message: 'No token provided' };
      return next(error);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret);
    socket.userId = decoded.id;
    
    console.log(`Socket.io: User ${socket.userId} authenticated`);
    next();
  } catch (err) {
    console.error('Socket authentication error:', err.message);
    const error = new Error('Authentication error: Invalid token');
    error.data = { message: 'Invalid or expired token' };
    next(error);
  }
}

function parseCookies(cookieString) {
  const cookies = {};
  if (!cookieString) return cookies;

  cookieString.split(';').forEach(cookie => {
    const parts = cookie.trim().split('=');
    if (parts.length === 2) {
      cookies[parts[0]] = parts[1];
    }
  });

  return cookies;
}

module.exports = authenticateSocket;
