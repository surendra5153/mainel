import { create } from 'zustand';
import { getDemoVideos, uploadDemoVideo, deleteDemoVideo } from '../api/videoApi';

const useDemoVideoStore = create((set, get) => ({
  videos: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,
  isUploading: false,

  fetchVideos: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getDemoVideos();
      set({ videos: response, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch videos', isLoading: false });
    }
  },

  addVideo: async (file, title) => {
    set({ isUploading: true, uploadProgress: 0, error: null });
    try {
      const response = await uploadDemoVideo(file, title, (percent) => {
        set({ uploadProgress: percent });
      });
      // Add the new video to the list
      set((state) => ({
        videos: [...state.videos, response],
        isUploading: false,
        uploadProgress: 0
      }));
      return response;
    } catch (err) {
      set({ 
        error: err.response?.data?.message || err.message || 'Upload failed', 
        isUploading: false, 
        uploadProgress: 0 
      });
      throw err;
    }
  },

  removeVideo: async (publicId) => {
    set({ isLoading: true, error: null });
    try {
      await deleteDemoVideo(publicId);
      set((state) => ({
        videos: state.videos.filter((v) => v.publicId !== publicId),
        isLoading: false
      }));
    } catch (err) {
      set({ error: err.message || 'Failed to delete video', isLoading: false });
    }
  },

  resetError: () => set({ error: null })
}));

export default useDemoVideoStore;
