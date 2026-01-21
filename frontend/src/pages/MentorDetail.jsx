import { useEffect, useState } from 'react';
import { getMentorProfile, getMentorReviews } from '../api/mentors';
import { requestSession } from '../api/sessions';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { notifySuccess, notifyError } from '../utils/toast';
import SessionSuccessIndicator from '../components/SessionSuccessIndicator';

export default function MentorDetail() {
  const { id } = useParams();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showScheduler, setShowScheduler] = useState(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [showSuccessPredictor, setShowSuccessPredictor] = useState(false);
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    try {
      const data = await getMentorProfile(id);
      setMentor(data.mentor || null);

      // Fetch reviews if mentor exists
      if (data.mentor) {
        getMentorReviews(id).then(res => {
          setReviews(res.reviews || []);
          setTotalReviews(res.total || 0);
        }).catch(console.error);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleBook(teach) {
    if (!user) return navigate('/login');
    setShowScheduler(teach);
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setScheduledDate(nextWeek);
  }

  async function confirmScheduling(teach) {
    if (!scheduledDate) {
      notifyError('Please select a date');
      return;
    }

    setBooking(true);
    try {
      const payload = {
        mentorId: id,
        skillId: teach.skillRef,
        skillName: teach.name,
        scheduledAt: new Date(scheduledDate).toISOString(),
        pointsCost: 1,
        meetingLink: `https://zoom.us/meeting/${Math.random().toString(36).substr(2, 9)}`
      };
      const data = await requestSession(payload);
      if (data.session) {
        notifySuccess('Session requested! Waiting for mentor approval');
        setShowScheduler(null);
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (err) { notifyError(err.message || 'Booking failed'); }
    finally { setBooking(false); }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!mentor) return <div className="p-6 text-center">Mentor not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={() => navigate('/mentors')} className="mb-4 px-3 py-1 border rounded text-sm hover:bg-gray-100">← Back to Mentors</button>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded shadow-md p-6 mb-6">
          <div className="flex gap-6 mb-6">
            {mentor.avatarUrl && <img src={mentor.avatarUrl} alt={mentor.name} className="w-32 h-32 rounded-full object-cover" />}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{mentor.name}</h1>

              </div>

              <div className="text-lg text-gray-700 font-medium mt-1">{mentor.title}</div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-base">⭐</span>
                  <span className="font-semibold text-gray-900">{mentor.rating || 5}</span>
                  <span className="text-gray-400">({mentor.reviewsCount || 0} reviews)</span>
                </div>

                {mentor.location && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {mentor.location}
                  </div>
                )}

                {mentor.yearsOfExperience > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {mentor.yearsOfExperience} years exp
                  </div>
                )}
              </div>

              {mentor.bio && <p className="text-gray-700 mt-4 leading-relaxed max-w-2xl">{mentor.bio}</p>}

              {/* REVIEWS SECTION */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Recent Reviews</h3>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{r.rating} ★</span>
                          <span className="text-gray-500">• {new Date(r.createdAt).toLocaleDateString()}</span>
                          <span className="text-gray-400">• {r.reviewerName}</span>
                        </div>
                        {r.feedback && <p className="text-gray-700 italic">"{r.feedback}"</p>}
                      </div>
                    ))}
                    {totalReviews > 5 && (
                      <div className="text-center mt-2">
                        <span className="text-xs text-cool-gray-500">Showing 5 of {totalReviews} reviews</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No written reviews yet.</p>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                {mentor.github && (
                  <a href={`https://github.com/${mentor.github.replace('https://github.com/', '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                  </a>
                )}
                {mentor.linkedin && (
                  <a href={`https://linkedin.com/in/${mentor.linkedin.replace('https://linkedin.com/in/', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                  </a>
                )}
                {mentor.twitter && (
                  <a href={`https://twitter.com/${mentor.twitter.replace('https://twitter.com/', '')}`} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                  </a>
                )}
                {mentor.website && (
                  <a href={mentor.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                  </a>
                )}

                <button
                  onClick={() => handleBook({ name: 'General Mentorship', skillRef: null })}
                  disabled={booking}
                  className="ml-auto px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all hover:shadow-md flex items-center gap-2"
                >
                  {booking ? 'Booking...' : (
                    <>
                      <span>📅</span>
                      Request Mentorship
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {mentor.demoVideos && mentor.demoVideos.length > 0 && (
          <div className="bg-white rounded shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">📹 Demo Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentor.demoVideos.map((video, i) => (
                <div key={i} className="border rounded p-4">
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Watch Video</a>
                  {video.description && <p className="text-sm text-gray-600 mt-2">{video.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded shadow-md p-6">
            <h3 className="font-bold text-lg mb-3">🎓 I Teach ({mentor.teaches?.length || 0})</h3>
            {mentor.teaches && mentor.teaches.length ? (
              <div className="space-y-3">
                {mentor.teaches.map((teach, i) => (
                  <div key={i} className="border-l-4 border-blue-600 pl-3 py-2">
                    <div className="font-medium">{teach.name}</div>
                    <div className="text-xs text-gray-500 uppercase">Level: {teach.level}</div>
                    {teach.description && <p className="text-sm text-gray-600 mt-1">{teach.description}</p>}
                    <button onClick={() => handleBook(teach)} disabled={booking} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                      {booking ? 'Booking...' : '📅 Request Session'}
                    </button>
                  </div>
                ))}
              </div>
            ) : <div className="text-gray-500">No skills listed</div>}
          </div>

          <div className="bg-white rounded shadow-md p-6">
            <h3 className="font-bold text-lg mb-3">📚 Wants to Learn ({mentor.learns?.length || 0})</h3>
            {mentor.learns && mentor.learns.length ? (
              <div className="space-y-2">
                {mentor.learns.map((learn, i) => (
                  <div key={i} className="border-l-4 border-green-600 pl-3 py-2">
                    <div className="font-medium">{learn.name}</div>
                    <div className="text-xs text-gray-500">Level: {learn.level}</div>
                  </div>
                ))}
              </div>
            ) : <div className="text-gray-500">No learning interests</div>}
          </div>
        </div>

        {mentor.projectFiles && mentor.projectFiles.length > 0 && (
          <div className="bg-white rounded shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">📂 Project Files</h2>
            <div className="space-y-2">
              {mentor.projectFiles.map((file, i) => (
                <div key={i} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">📄 Download File</a>
                    {file.description && <p className="text-sm text-gray-600 mt-1">{file.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showScheduler && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Schedule Session: {showScheduler.name}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => {
                    setScheduledDate(e.target.value);
                    setShowSuccessPredictor(true);
                  }}
                  className="w-full px-3 py-2 border rounded"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* ML Success Prediction */}
              {showSuccessPredictor && scheduledDate && showScheduler.skillRef && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-2">Success Probability:</div>
                  <SessionSuccessIndicator
                    mentorId={id}
                    studentId={user?._id}
                    skillId={showScheduler.skillRef}
                    slot={scheduledDate}
                  />
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600">📹 Virtual Meeting: Zoom link will be shared after mentor approves</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => {
                  setShowScheduler(null);
                  setShowSuccessPredictor(false);
                }} className="flex-1 px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                <button onClick={() => confirmScheduling(showScheduler)} disabled={booking} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {booking ? 'Sending...' : 'Request Session'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
