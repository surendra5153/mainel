import React, { useEffect, useState } from 'react';
import { fetchSkills } from '../api/skills';
import { browseMentors } from '../api/mentors';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';

export default function Home() {
  const [skills, setSkills] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const sk = await fetchSkills({ limit: 8 });
        const ms = await browseMentors({ limit: 6 });
        if (!mounted) return;
        setSkills(sk.items || sk.skills || sk || []);
        setMentors(ms.mentors || ms || []);
      } catch (err) {
        console.error('Home load error', err);
        if (mounted) {
          setSkills([]);
          setMentors([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero / Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-600 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative p-8 sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
            Welcome to SkillSwap
          </h1>
          <p className="text-indigo-100 text-lg max-w-2xl mb-8">
            Connect with mentors, master new skills, and accelerate your career growth. What would you like to do today?
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/mentors" className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg shadow hover:bg-indigo-50 transition-colors">
              Find a Mentor
            </Link>
            <Link to="/skills" className="px-6 py-3 bg-indigo-700 text-white font-bold rounded-lg border border-indigo-500 hover:bg-indigo-800 transition-colors">
              Browse Skills
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/skills" className="group card hover:border-indigo-200 transition-all">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Explore Skills</h3>
          <p className="text-gray-500 text-sm">Discover thousands of skills taught by community experts.</p>
        </Link>

        <Link to="/profile" className="group card hover:border-green-200 transition-all">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Your Profile</h3>
          <p className="text-gray-500 text-sm">Update your expertise and manage your learning journey.</p>
        </Link>

        <Link to="/chat" className="group card hover:border-yellow-200 transition-all">
          <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Messages</h3>
          <p className="text-gray-500 text-sm">Chat with mentors and students in real-time.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Popular Skills Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Popular Skills</h2>
            <Link to="/skills" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all &rarr;</Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
              ))
            ) : (
              skills.map((s) => (
                <Link 
                  key={s._id || s.name} 
                  to="/skills" 
                  className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-center text-center h-full"
                >
                  <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{s.name}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{s.category}</div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Featured Mentors Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Featured Mentors</h2>
            <Link to="/mentors" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all &rarr;</Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
              ))
            ) : (
              mentors.slice(0, 5).map((m) => (
                <Link 
                  key={m._id} 
                  to={`/mentor/${m._id}`} 
                  className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
                >
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                  ) : (
                    <Avatar name={m.name} size="48" round={true} className="text-sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{m.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {m.teaches?.length > 0 ? `Teaches ${m.teaches[0].name}` : 'Mentor'}
                    </div>
                  </div>
                  <div className="flex items-center text-yellow-500 text-xs font-bold">
                    <svg className="w-3 h-3 fill-current mr-1" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {m.rating || 'New'}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
