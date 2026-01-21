import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { fetchMe } from "../api/auth";
import { listMySessions, acceptSession, rejectSession, cancelSession } from "../api/sessions";
import { notifySuccess, notifyError } from "../utils/toast";
import ProfileDemoVideos from "../components/ProfileDemoVideos";
import RVVerificationSection from "../components/RVVerificationSection";
import RVVerificationBadge from "../components/RVVerificationBadge";
import { getRVVerificationStatus } from "../api/rvVerification";

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [rvVerificationStatus, setRvVerificationStatus] = useState(null);

  useEffect(() => {
    if (!user) {
      fetchMe().then(res => { if (res.user) setUser(res.user); }).catch(console.error);
    }
    loadSessions();
    loadRVVerificationStatus();
  }, [user]);

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const data = await listMySessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  }

  async function loadRVVerificationStatus() {
    try {
      const data = await getRVVerificationStatus();
      setRvVerificationStatus(data);
    } catch (err) {
      console.error('Failed to load RV verification status:', err);
    }
  }

  async function handleAccept(sessionId) {
    try {
      await acceptSession(sessionId);
      notifySuccess('Session accepted!');
      await loadSessions();
    } catch (err) {
      notifyError(err.message || 'Failed to accept session');
    }
  }

  async function handleReject(sessionId) {
    try {
      await rejectSession(sessionId);
      notifySuccess('Session rejected!');
      await loadSessions();
    } catch (err) {
      notifyError(err.message || 'Failed to reject session');
    }
  }

  async function handleCancel(sessionId) {
    try {
      await cancelSession(sessionId);
      notifySuccess('Session cancelled!');
      await loadSessions();
    } catch (err) {
      notifyError(err.message || 'Failed to cancel session');
    }
  }

  if (!user) return <div className="p-10">Please login to view profile.</div>;

  const profileCompleteness = () => {
    if (!user) return 0;
    let score = 0;
    if (user.name) score += 40;
    if (user.avatarUrl) score += 20;
    if (user.teaches && user.teaches.length > 0) score += 25;
    if (user.learns && user.learns.length > 0) score += 15;
    return Math.min(score, 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Instagram-like Header */}
      <div className="flex items-center space-x-6 mb-8">
        <img
          src={user.avatarUrl || `https://api.dicebear.com/7.x/thumbs/svg?seed=${user.name}`} alt="avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>

            <RVVerificationBadge status={rvVerificationStatus?.status} expiresAt={rvVerificationStatus?.expiresAt} />
            <button onClick={() => navigate('/profile/edit')} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
              Edit Profile
            </button>
          </div>

          {user.title && <div className="text-lg text-gray-700 font-medium mb-2">{user.title}</div>}

          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
            {user.location && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {user.location}
              </div>
            )}
            {user.yearsOfExperience > 0 && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {user.yearsOfExperience} years exp
              </div>
            )}
          </div>

          <div className="flex space-x-8 mb-4 text-sm">
            <div><strong>{user.teaches?.length || 0}</strong> skills taught</div>
            <div><strong>{user.learns?.length || 0}</strong> skills learning</div>
            <div><strong className="text-purple-600">{user.level || 'Novice'}</strong> Level</div>
            <div><strong>{user.rating || 5.0}</strong> ★ rating</div>
          </div>

          <p className="text-gray-700 mb-4 leading-relaxed">{user.bio || 'No bio yet.'}</p>

          <div className="flex gap-3">
            {user.github && (
              <a href={`https://github.com/${user.github.replace('https://github.com/', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              </a>
            )}
            {user.linkedin && (
              <a href={`https://linkedin.com/in/${user.linkedin.replace('https://linkedin.com/in/', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
              </a>
            )}
            {user.twitter && (
              <a href={`https://twitter.com/${user.twitter.replace('https://twitter.com/', '')}`} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
              </a>
            )}
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Demo Videos Section */}
      <div className="mb-8">
        <ProfileDemoVideos />
      </div>

      {/* Project Files Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {user.projectFiles?.map((file, index) => (
          <div key={`file-${index}`} className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-center p-4">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm text-blue-600 hover:underline">{file.description || 'Project File'}</p>
            </a>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Teaches (Skills you offer)</h2>
        <div className="grid gap-3">
          {user.teaches && user.teaches.length ? user.teaches.map(t => (
            <div key={t._id} className="flex items-center justify-between bg-white p-4 rounded shadow">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-gray-500 capitalize">{t.level}</div>
              </div>
            </div>
          )) : <div className="text-sm text-gray-500">You haven't added any teaching skills yet.</div>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Learns (Skills you want to learn)</h2>
        <div className="grid gap-3">
          {user.learns && user.learns.length ? user.learns.map(l => (
            <div key={l._id} className="flex items-center justify-between bg-white p-4 rounded shadow">
              <div>
                <div className="font-semibold">{l.name}</div>
              </div>
            </div>
          )) : <div className="text-sm text-gray-500">You haven't added any learning skills yet.</div>}
        </div>
      </section>



      {/* RV College Verification */}
      <section className="mt-8">
        <RVVerificationSection />
      </section>

      {/* Requests & Pending Sessions */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Requests & Pending Sessions</h2>

        {sessionsLoading ? (
          <div className="text-center py-4 text-gray-500">Loading requests...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incoming Requests (where user is mentor) */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-lg mb-3 text-blue-900">📥 Incoming Requests</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sessions.filter(s => s.mentor?._id === user?._id && s.status === 'pending').length ? (
                  sessions.filter(s => s.mentor?._id === user?._id && s.status === 'pending').map(session => (
                    <div key={session._id} className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-sm">{session.learner?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-600">Wants to learn: {session.skillName}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            📅 {new Date(session.scheduledAt).toLocaleDateString()} {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">Pending</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleAccept(session._id)} className="flex-1 px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                          ✓ Accept
                        </button>
                        <button onClick={() => handleReject(session._id)} className="flex-1 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600 text-center py-4">No incoming requests</div>
                )}
              </div>
            </div>

            {/* Outgoing Requests (where user is learner) */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold text-lg mb-3 text-green-900">📤 Sent Requests</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sessions.filter(s => s.learner?._id === user?._id && s.status === 'pending').length ? (
                  sessions.filter(s => s.learner?._id === user?._id && s.status === 'pending').map(session => (
                    <div key={session._id} className="bg-white p-3 rounded border-l-4 border-green-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-sm">{session.mentor?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-600">Teaching: {session.skillName}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            📅 {new Date(session.scheduledAt).toLocaleDateString()} {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">💰 Cost: {session.pointsCost} points</div>
                        </div>
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">Pending</span>
                      </div>
                      <button onClick={() => handleCancel(session._id)} className="w-full px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 mt-3">
                        Cancel Request
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600 text-center py-4">No pending requests</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active & Accepted Sessions */}
        {sessions.filter(s => s.status === 'accepted' || s.status === 'scheduled' || s.status === 'confirmed').length > 0 && (
          <div className="mt-6 border rounded-lg p-4 bg-purple-50">
            <h3 className="font-semibold text-lg mb-3 text-purple-900">✅ Active Sessions</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {sessions.filter(s => s.status === 'accepted' || s.status === 'scheduled' || s.status === 'confirmed').map(session => (
                <div key={session._id} className="bg-white p-3 rounded border-l-4 border-purple-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-sm">
                        {session.mentor?._id === user?._id ? session.learner?.name : session.mentor?.name} • {session.skillName}
                      </div>
                      <div className="text-xs text-gray-600">
                        {session.status === 'scheduled' ? '📅 Scheduled' : '✓ Accepted'} • {session.durationMins}min
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(session.scheduledAt).toLocaleDateString()} {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {session.meetingLink && (
                        <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                          Join Meeting →
                        </a>
                      )}
                    </div>
                    <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded capitalize">{session.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed & Rejected Sessions Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-100 p-3 rounded text-center">
            <div className="text-2xl font-bold text-gray-800">{sessions.filter(s => s.status === 'completed').length}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="bg-red-100 p-3 rounded text-center">
            <div className="text-2xl font-bold text-red-800">{sessions.filter(s => s.status === 'rejected').length}</div>
            <div className="text-xs text-red-600">Rejected</div>
          </div>
          <div className="bg-orange-100 p-3 rounded text-center">
            <div className="text-2xl font-bold text-orange-800">{sessions.filter(s => s.status === 'cancelled').length}</div>
            <div className="text-xs text-orange-600">Cancelled</div>
          </div>
          <div className="bg-blue-100 p-3 rounded text-center">
            <div className="text-2xl font-bold text-blue-800">{sessions.length}</div>
            <div className="text-xs text-blue-600">Total Sessions</div>
          </div>
        </div>
      </section>
    </div>
  );
}
