import { client } from './client';

export async function startRVVerification(payload) {
  return client.post('/rv-verification/start', payload);
}

export async function verifyRVOTP(payload) {
  return client.post('/rv-verification/verify-otp', payload);
}

export async function getRVVerificationStatus() {
  return client.get('/rv-verification/status');
}

export async function adminReviewVerification(payload) {
  return client.post('/rv-verification/admin-review', payload);
}

export async function adminListPendingVerifications(params = {}) {
  const query = new URLSearchParams(params).toString();
  return client.get(`/rv-verification/admin/pending${query ? '?' + query : ''}`);
}

export async function updateRVProfile(payload) {
  return client.patch('/rv-verification/rv-profile', payload);
}
