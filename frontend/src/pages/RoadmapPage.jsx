import React, { useEffect, useState } from 'react';
import SkillTree from '../components/SkillTree';
import { useAuthStore } from '../store/authStore';
import { fetchRoadmaps, fetchRoadmapBySlug, updateUserRoadmapGoal } from '../api/roadmap';
import { fetchMe } from '../api/auth'; // To refresh user data if needed

export default function RoadmapPage() {
    const user = useAuthStore(s => s.user);
    const setUser = useAuthStore(s => s.setUser);
    const [roadmap, setRoadmap] = useState(null);
    const [roadmapList, setRoadmapList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial load: Fetch list and current roadmap
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                // 1. Fetch all available roadmaps
                const listData = await fetchRoadmaps();
                setRoadmapList(listData.data || []);

                // 2. Determine target slug (user preference or default)
                const targetSlug = user?.roadmapGoal || 'full-stack';

                // 3. Fetch specific roadmap
                const roadmapData = await fetchRoadmapBySlug(targetSlug);
                setRoadmap(roadmapData.data);
            } catch (err) {
                console.error("Failed to load roadmap data", err);
                setError("Failed to load roadmap.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            init();
        }
    }, [user?.roadmapGoal]); // Re-run if user's goal changes in store

    const handleGoalChange = async (e) => {
        const newSlug = e.target.value;
        try {
            setLoading(true);

            // 1. Update backend
            await updateUserRoadmapGoal(newSlug);

            // 2. Update local user store (optimistic or re-fetch)
            const updatedUser = { ...user, roadmapGoal: newSlug };
            setUser(updatedUser);

            // 3. Fetch new roadmap data
            const roadmapData = await fetchRoadmapBySlug(newSlug);
            setRoadmap(roadmapData.data);

        } catch (err) {
            console.error("Failed to change roadmap", err);
            // Optionally revert or show toast
        } finally {
            setLoading(false);
        }
    };

    // Combine skills user teaches and learns to highlight them on the tree
    const userSkills = React.useMemo(() => [
        ...(user?.teaches?.map(s => s.name) || []),
        ...(user?.learns?.map(s => s.name) || [])
    ], [user]);

    if (loading && !roadmap) return <div className="p-10 text-center">Loading roadmap...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{roadmap?.title || 'Skill Roadmap'}</h1>
                    <p className="text-gray-600 mt-2">{roadmap?.description || 'Visualize your learning path.'}</p>
                </div>

                {/* Goal Selector */}
                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <label htmlFor="roadmap-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Current Goal:
                    </label>
                    <select
                        id="roadmap-select"
                        value={user?.roadmapGoal || 'full-stack'}
                        onChange={handleGoalChange}
                        className="block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        {roadmapList.map(r => (
                            <option key={r.slug} value={r.slug}>{r.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4 h-[700px]">
                {roadmap && (
                    <SkillTree
                        userSkills={userSkills}
                        nodes={roadmap.nodes}
                        edges={roadmap.edges}
                    />
                )}
            </div>

            <div className="mt-4 flex gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                    <span className="w-3 h-3 bg-emerald-500 rounded mr-2"></span>
                    Completed / In Progress
                </div>
                <div className="flex items-center">
                    <span className="w-3 h-3 bg-white border border-gray-400 rounded mr-2"></span>
                    Not Started
                </div>
            </div>
        </div>
    );
}
