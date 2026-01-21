import { client } from './client';

export async function browseMentors(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  return client.get(`/mentors?${qs.toString()}`);
}

export async function getMentorProfile(mentorId) {
  return client.get(`/mentors/${mentorId}`);
}

export async function getMentorReviews(mentorId, page = 1) {
  return client.get(`/mentors/${mentorId}/reviews?page=${page}&limit=5`);
}
