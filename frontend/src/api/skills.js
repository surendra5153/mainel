import { client } from './client';

export async function fetchCategories() {
  return client.get('/categories');
}

export async function fetchSkills(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  return client.get(`/skills?${qs.toString()}`);
}

export async function addTeachSkill(payload) {
  return client.post('/user-skills/me/teaches', payload);
}

export async function updateTeachSkill(teachId, payload) {
  return client.put(`/user-skills/me/teaches/${teachId}`, payload);
}

export async function removeTeachSkillApi(teachId) {
  return client.delete(`/user-skills/me/teaches/${teachId}`);
}

export async function addLearnSkill(payload) {
  return client.post('/user-skills/me/learns', payload);
}

export async function removeLearnSkillApi(learnId) {
  return client.delete(`/user-skills/me/learns/${learnId}`);
}
