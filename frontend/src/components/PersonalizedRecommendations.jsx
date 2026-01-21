import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRecommendationsStore } from '../store/recommendationsStore';
import { Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PersonalizedRecommendations({ limit = 6 }) {
  const user = useAuthStore(s => s.user);
  const { skillRecommendations, isLoading, error, fetchRecommendations } = useRecommendationsStore();
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    if (user) {
      fetchRecommendations(limit);
    }
  }, [user, limit]);

  useEffect(() => {
    async function fetchSkillDetails() {
      if (skillRecommendations.length === 0) {
        setSkills([]);
        return;
      }

      try {
        const skillIds = skillRecommendations.map(rec => rec.skillId);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/skills`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        const skillsMap = new Map(data.skills?.map(s => [s._id, s]) || []);
        const enrichedSkills = skillRecommendations
          .map(rec => {
            const skill = skillsMap.get(rec.skillId);
            return skill ? { ...skill, _recommendationScore: rec.score, _reason: rec.reason } : null;
          })
          .filter(Boolean);
        
        setSkills(enrichedSkills);
      } catch (err) {
        console.error('Failed to fetch skill details:', err);
        setSkills([]);
      }
    }

    fetchSkillDetails();
  }, [skillRecommendations]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
        </div>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
        </div>
        <p className="text-sm text-gray-500">No recommendations available yet. Start by adding skills to your profile!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Recommended for You</h2>
        </div>
        <Link to="/browse" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <div
            key={skill._id}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {skill.name}
              </h3>
              {skill._recommendationScore && skill._recommendationScore >= 0.7 && (
                <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" />
              )}
            </div>

            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {skill.description || 'No description available.'}
            </p>

            {skill._reason && (
              <div className="mb-3 px-2 py-1.5 bg-indigo-50 rounded text-xs text-indigo-700">
                {skill._reason}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium uppercase">
                {skill.category || 'General'}
              </span>
              {skill._recommendationScore && (
                <span className="text-xs text-gray-500 font-medium">
                  {Math.round(skill._recommendationScore * 100)}% match
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
