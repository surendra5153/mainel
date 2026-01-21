import { useEffect, useState } from 'react';
import { client as api } from '../api/client'; // Corrected import
import MentorCard from '../components/MentorCard';
import MentorRecommendations from '../components/MentorRecommendations';
import { useAuthStore } from '../store/authStore';

export default function BrowseMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [campusMode, setCampusMode] = useState(false);
  const user = useAuthStore(s => s.user);

  const userSkillIds = user?.learns?.map(s => s.skillRef).filter(Boolean) || [];

  useEffect(() => { loadMentors(); }, [search, minRating, campusMode]);

  async function loadMentors() {
    setLoading(true);
    try {
      const params = { skill: search || undefined, minRating: minRating || undefined, limit: 24 };

      if (campusMode && user?.collegeEmail && user?.isVerified) {
        const domain = user.collegeEmail.split('@')[1];
        if (domain) params.campusDomain = domain;
      }

      const res = await api.get('/mentors', { params });
      // Defensive filter: Ensure current user is not in the list
      const allMentors = res.mentors || [];
      setMentors(user ? allMentors.filter(m => m._id !== user._id) : allMentors);
    } catch (err) {
      console.error(err);
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ML Mentor Recommendations */}
      {user && userSkillIds.length > 0 && (
        <MentorRecommendations skillIds={userSkillIds} limit={3} />
      )}

      {/* Header Section */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4F46E5" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.3,82.2,22.9,71.4,34.5C60.6,46.1,50.3,55.8,39,63.5C27.7,71.2,15.4,76.9,1.2,74.9C-13,72.9,-29.1,63.2,-42.6,52.8C-56.1,42.4,-67,31.3,-74.6,18.2C-82.2,5.1,-86.6,-10,-83.1,-23.7C-79.6,-37.4,-68.2,-49.7,-55.1,-57.3C-42,-64.9,-27.2,-67.9,-13.3,-69.9C0.6,-71.9,14.5,-72.9,30.5,-83.6L44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            Find your perfect <span className="text-indigo-600">Mentor</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Connect with industry experts, master new skills, and accelerate your career growth through 1-on-1 mentorship sessions.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-8 flex flex-col gap-4 max-w-4xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-11 py-3"
                placeholder="Search by skill (e.g. Python, React, Design)..."
              />
            </div>
            <div className="sm:w-56">
              <div className="relative">
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="input-field py-3 appearance-none cursor-pointer"
                >
                  <option value={0}>All Ratings</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={5}>5 Stars Only</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Campus Mode Toggle */}
          {user?.collegeEmail && user?.isVerified && (
            <div className="flex items-center gap-2 mt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={campusMode} onChange={(e) => setCampusMode(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Campus Mode ({user.collegeEmail.split('@')[1]})
                </span>
              </label>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Verified Student</span>
            </div>
          )}
        </div>
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="mt-6 h-10 bg-gray-200 rounded-lg w-full" />
            </div>
          ))
        ) : mentors.length > 0 ? (
          mentors.map(m => (
            <MentorCard key={m._id} mentor={m} />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200 border-dashed">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No mentors found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any mentors matching your criteria. Try adjusting your search terms or filters.
            </p>
            <button
              onClick={() => { setSearch(''); setMinRating(0); setCampusMode(false); }}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
