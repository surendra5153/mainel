import axios from 'axios';

// Create a dedicated axios instance or use the shared one if available. 
// Assuming there is a global axios setup, but let's be safe and use relative path which vite proxy handles.
const api = axios.create({
    baseURL: '/api',
    withCredentials: true
});

export const fetchRoadmaps = async () => {
    try {
        const response = await api.get('/roadmaps/list');
        return response.data;
    } catch (error) {
        console.error('Error fetching roadmap list:', error);
        throw error;
    }
};

export const fetchRoadmapBySlug = async (slug) => {
    try {
        const response = await api.get(`/roadmaps/${slug}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching roadmap:', error);
        throw error;
    }
};

export const updateUserRoadmapGoal = async (slug) => {
    try {
        const response = await api.patch('/user/profile', { roadmapGoal: slug });
        return response.data;
    } catch (error) {
        console.error('Error updating roadmap goal:', error);
        throw error;
    }
};
