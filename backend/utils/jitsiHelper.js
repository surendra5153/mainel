const { v4: uuidv4 } = require('uuid');

function generateMeetingLink(sessionId) {
  const baseUrl = process.env.JITSI_BASE_URL || 'https://meet.jit.si';
  const roomId = `session-${sessionId}-${uuidv4()}`;
  const password = uuidv4().slice(0, 8); // Simple 8-char password

  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return {
    link: `${cleanBaseUrl}/${roomId}`,
    password: password
  };
}

module.exports = { generateMeetingLink };
