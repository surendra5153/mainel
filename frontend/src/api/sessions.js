import { client } from './client';

export async function requestSession(payload) {
  return client.post('/sessions', payload);
}

export async function listMySessions() {
  return client.get('/sessions/me');
}

export async function getSession(sessionId) {
  return client.get(`/sessions/${sessionId}`);
}

export async function logVideoStart(sessionId) {
  return client.post(`/sessions/${sessionId}/video-start`);
}

export async function confirmSession(sessionId) {
  // Alias to acceptSession since we merged the backend logic
  return client.put(`/sessions/${sessionId}/accept`);
}

export async function completeSession(sessionId, payload) {
  return client.put(`/sessions/${sessionId}/complete`, payload);
}

export async function cancelSession(sessionId) {
  return client.delete(`/sessions/${sessionId}`);
}

export async function submitRating(sessionId, payload) {
  return client.post(`/sessions/${sessionId}/rate`, payload);
}

export async function acceptSession(sessionId) {
  return client.put(`/sessions/${sessionId}/accept`);
}

export async function rejectSession(sessionId) {
  return client.put(`/sessions/${sessionId}/reject`);
}

export async function scheduleSession(sessionId, payload) {
  return client.put(`/sessions/${sessionId}/schedule`, payload);
}

export async function updateSessionDetails(sessionId, payload) {
  return client.patch(`/sessions/${sessionId}/details`, payload);
}
