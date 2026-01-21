import { client } from './client';

export async function registerUser(payload) {
  return client.post('/auth/register', payload);
}

export async function loginUser(payload) {
  return client.post('/auth/login', payload);
}

export async function fetchMe() {
  return client.get('/auth/me');
}

export async function logoutUser() {
  return client.post('/auth/logout');
}

export async function updateMe(payload) {
  return client.put('/auth/me', payload);
}


