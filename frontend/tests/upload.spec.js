import { test, expect } from '@playwright/test';

test('should upload a file to Cloudinary', async ({ request }) => {
  const backendUrl = 'http://localhost:5000';
  
  // 1. Register a new user
  const uniqueId = Date.now();
  const user = {
    name: `Test User ${uniqueId}`,
    email: `test${uniqueId}@example.com`,
    password: 'password123'
  };

  const registerRes = await request.post(`${backendUrl}/api/auth/register`, {
    data: user
  });
  expect(registerRes.ok()).toBeTruthy();
  const registerData = await registerRes.json();
  const token = registerData.accessToken;

  // 2. Upload a file
  // Create a buffer for a dummy image (1x1 transparent PNG)
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

  const uploadRes = await request.post(`${backendUrl}/api/upload`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    multipart: {
      file: {
        name: 'test-image.png',
        mimeType: 'image/png',
        buffer: buffer
      }
    }
  });

  expect(uploadRes.ok()).toBeTruthy();
  const uploadData = await uploadRes.json();
  
  console.log('Upload response:', uploadData);

  expect(uploadData).toHaveProperty('url');
  expect(uploadData.url).toContain('cloudinary.com');
  expect(uploadData).toHaveProperty('public_id');
});
