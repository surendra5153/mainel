import { useEffect, useState } from 'react';
import { getMentorRecommendations } from '../api/ml';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';

export default function MentorRecommendations({ skillIds = [], limit = 3 }) {
  const user = useAuthStore(s => s.user);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && skillIds.length > 0) {
      loadRecommendations();
    }
  }, [user, skillIds.join(',')]);

  async function loadRecommendations() {
    if (!user?._id || skillIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getMentorRecommendations({
        userId: user._id,
        skillIds: skillIds.join(','),
        limit
      });

      if (data.success && data.items) {
        setRecommendations(data.items);
      }
    } catch (err) {
      console.error('Failed to load mentor recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user || skillIds.length === 0) return null;

  if (loading) {
    return (
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>👨‍🏫</span>
          Recommended Mentors
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
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
          <span>👨‍🏫</span>
          Recommended Mentors
        </h3>
        <Link
          to="/mentors"
          className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <Link
            key={rec.mentorId}
            to={`/mentor/${rec.mentorId}`}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <Avatar
              name={rec.mentorId}
              size="48"
              round={true}
              className="flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  Mentor
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 rounded text-xs font-semibold text-indigo-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {Math.round(rec.score * 100)}%
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                {rec.reason || 'Recommended mentor for your skill'}
              </p>
            </div>

            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
