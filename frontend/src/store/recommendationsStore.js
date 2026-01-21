import { create } from 'zustand';
import { getSkillRecommendations } from '../api/ml';

export const useRecommendationsStore = create((set) => ({
  skillRecommendations: [],
  isLoading: false,
  error: null,

  fetchRecommendations: async (limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getSkillRecommendations({ limit });
      set({ 
        skillRecommendations: response.items || [],
        isLoading: false,
        error: null
      });
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      set({ 
        skillRecommendations: [],
        isLoading: false,
        error: err.message || 'Failed to fetch recommendations'
      });
    }
  },

  clearRecommendations: () => {
    set({ 
      skillRecommendations: [],
      isLoading: false,
      error: null
    });
  }
}));
