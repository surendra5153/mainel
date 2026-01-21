import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { listMySessions, acceptSession, rejectSession, scheduleSession } from '../api/sessions';
import RequestCard from '../components/RequestCard';
import SkillRecommendations from '../components/SkillRecommendations';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';
import SessionDetailsModal from '../components/SessionDetailsModal';
import { Link } from 'react-router-dom';
import { notifySuccess, notifyError } from '../utils/toast';
import Avatar from 'react-avatar';

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await listMySessions();
      setSessions(data.sessions || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const profileCompleteness = Math.min(100, ((user?.name ? 40 : 0) + (user?.avatarUrl ? 20 : 0) + ((user?.teaches && user.teaches.length > 0) ? 25 : 0) + ((user?.learns && user.learns.length > 0) ? 15 : 0)));

  async function handleAccept(session) {
    try {
      await acceptSession(session._id);
      notifySuccess('Session accepted!');
      await load();
    } catch (err) {
      console.error(err);
      notifyError(err.message || 'Failed to accept session');
    }
  }

  async function handleReject(session) {
    try {
      await rejectSession(session._id);
      notifySuccess('Session rejected!');
      await load();
    } catch (err) {
      console.error(err);
      notifyError(err.message || 'Failed to reject session');
    }
  }

  async function handleSchedule(sessionId, payload) {
    try {
      await scheduleSession(sessionId, payload);
      notifySuccess('Session scheduled!');
      await load();
    } catch (err) {
      console.error(err);
      notifyError(err.message || 'Failed to schedule session');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-gray-500">Manage your sessions, points, and profile.</p>
        </div>
        <Link to="/mentors" className="btn-primary self-start sm:self-auto">
          Find a Mentor
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar: Profile & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="card">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar name={user?.name} size="64" round={true} className="text-xl shadow-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-indigo-900">Available Points</span>
                  <span className="text-2xl font-bold text-indigo-600">{user?.points || 0}</span>
                </div>

              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Profile Completeness</span>
                  <span className="text-gray-500">{profileCompleteness}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
                {profileCompleteness < 100 && (
                  <Link to="/profile" className="text-xs text-indigo-600 hover:text-indigo-500 mt-2 inline-block font-medium">
                    Complete your profile &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">Your Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{user?.teaches?.length || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1 font-medium">Skills Taught</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{user?.learns?.length || 0}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1 font-medium">Skills Learning</div>
              </div>
            </div>
          </div>

          {/* ML-Powered Skill Recommendations */}
          <SkillRecommendations limit={5} />
        </div>

        {/* Main Content: Sessions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Your Sessions</h3>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600">All</span>
                <span className="px-2 py-1 hover:bg-white hover:border-gray-200 border border-transparent rounded text-xs font-medium text-gray-500 cursor-pointer transition-colors">Pending</span>
              </div>
            </div>

            <div className="p-6 flex-1">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4 h-full">
                  {sessions.length > 0 ? (
                    sessions.map(s => (
                      <div key={s._id} className="relative group">
                        <RequestCard
                          session={s}
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onSchedule={(session) => setScheduleModal(session)}
                        />
                        {/* Only show "View Details" for active/scheduled sessions */}
                        {(s.status === 'scheduled' || s.status === 'confirmed' || s.status === 'completed' || s.status === 'accepted') && (
                          <div className="absolute top-4 right-4 hidden group-hover:block">
                            <button
                              onClick={() => setDetailsModal(s)}
                              className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-full shadow-sm hover:bg-gray-50 transition"
                            >
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No sessions yet</h3>
                      <p className="text-gray-500 max-w-sm mx-auto mb-8">
                        You haven't booked or received any session requests yet. Start by finding a mentor!
                      </p>
                      <Link
                        to="/mentors"
                        className="btn-primary"
                      >
                        Browse Mentors
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personalized ML Recommendations */}
      <PersonalizedRecommendations limit={6} />

      {scheduleModal && (
        <ScheduleModal
          session={scheduleModal}
          onClose={() => setScheduleModal(null)}
          onSchedule={handleSchedule}
        />
      )}

      {detailsModal && (
        <SessionDetailsModal
          session={detailsModal}
          onClose={() => setDetailsModal(null)}
          onUpdate={load}
        />
      )}
    </div>
  );
}

// Modern Schedule Modal Component
function ScheduleModal({ session, onClose, onSchedule }) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [agenda, setAgenda] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!scheduledAt) {
      notifyError('Please select a date and time');
      return;
    }

    setLoading(true);
    try {
      await onSchedule(session._id, { scheduledAt, meetingLink, agenda });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Schedule Session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input-field"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (optional)</label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Agenda (optional)</label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="What will be covered in this session?"
              className="input-field"
              rows={3}
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary disabled:opacity-70"
          >
            {loading ? 'Scheduling...' : 'Confirm Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
