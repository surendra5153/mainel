import { client } from './client';

export const uploadDemoVideo = async (file, title, onProgress) => {
  const formData = new FormData();
  formData.append('video', file);
  if (title) formData.append('title', title);

  // Note: Axios/client support onUploadProgress
  return client.post('/videos/upload', formData, {
    // No need to set Content-Type, client handles it for FormData
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
};

export const getDemoVideos = async () => {
  return client.get('/user/demo-videos');
};

export const deleteDemoVideo = async (publicId) => {
  // Encode the publicId because it might contain slashes
  const encodedId = encodeURIComponent(publicId);
  return client.delete(`/user/demo-videos/${encodedId}`);
};
