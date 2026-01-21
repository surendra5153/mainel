import { useEffect, useState } from 'react';
import { getSkillRecommendations } from '../api/ml';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

export default function SkillRecommendations({ limit = 5 }) {
  const user = useAuthStore(s => s.user);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  async function loadRecommendations() {
    if (!user?._id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getSkillRecommendations({
        userId: user._id,
        limit
      });

      if (data.success && data.items) {
        setRecommendations(data.items);
      }
    } catch (err) {
      console.error('Failed to load skill recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;
  if (loading) {
    return (
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>✨</span>
          Recommended Skills
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) return null;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <span>✨</span>
          Recommended Skills
        </h3>
        <Link
          to="/skills"
          className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, limit).map((rec, idx) => (
          <div
            key={rec.skillId || idx}
            className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                    {rec.name}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-full border border-indigo-200">
                    <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs font-semibold text-indigo-600">
                      {Math.round(rec.score * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {rec.reason || 'Recommended for you'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length > limit && (
        <button
          onClick={() => setLimit(prev => prev === 5 ? recommendations.length : 5)}
          className="mt-3 text-xs text-indigo-600 hover:text-indigo-500 font-medium"
        >
          {limit === 5 ? `Show ${recommendations.length - 5} more →` : 'Show less'}
        </button>
      )}
    </div>
  );
}
