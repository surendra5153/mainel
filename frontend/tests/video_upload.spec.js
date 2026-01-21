import { test, expect } from '@playwright/test';

test('should upload and delete a demo video', async ({ request }) => {
  const backendUrl = 'http://localhost:5000';
  
  // 1. Register a new user
  const uniqueId = Date.now();
  const user = {
    name: `Video User ${uniqueId}`,
    email: `video${uniqueId}@example.com`,
    password: 'password123'
  };

  const registerRes = await request.post(`${backendUrl}/api/auth/register`, {
    data: user
  });
  expect(registerRes.ok()).toBeTruthy();
  const registerData = await registerRes.json();
  const token = registerData.accessToken;

  // 2. Upload a video
  // Create a buffer for a dummy video (minimal MP4 header)
  // This is a very minimal MP4 structure, might not play but should pass file type checks
  const buffer = Buffer.from(
    '00000018667479706d703432000000006d70343269736f6d', 
    'hex'
  );

  const uploadRes = await request.post(`${backendUrl}/api/user/demo-videos/upload`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    multipart: {
      video: {
        name: 'test-video.mp4',
        mimeType: 'video/mp4',
        buffer: buffer
      },
      title: 'My Test Video'
    }
  });

  if (!uploadRes.ok()) {
    console.log('Upload failed status:', uploadRes.status());
    console.log('Upload failed body:', await uploadRes.text());
  }
  expect(uploadRes.ok()).toBeTruthy();
  const uploadData = await uploadRes.json();
  
  console.log('Upload response:', uploadData);

  expect(uploadData).toHaveProperty('url');
  expect(uploadData).toHaveProperty('publicId');
  expect(uploadData.title).toBe('My Test Video');

  // 3. Get videos
  const getRes = await request.get(`${backendUrl}/api/user/demo-videos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  expect(getRes.ok()).toBeTruthy();
  const videos = await getRes.json();
  expect(videos.length).toBe(1);
  expect(videos[0].publicId).toBe(uploadData.publicId);

  // 4. Delete video
  const deleteRes = await request.delete(`${backendUrl}/api/user/demo-videos/${encodeURIComponent(uploadData.publicId)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  expect(deleteRes.ok()).toBeTruthy();

  // 5. Verify deletion
  const getRes2 = await request.get(`${backendUrl}/api/user/demo-videos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const videos2 = await getRes2.json();
  expect(videos2.length).toBe(0);
});
