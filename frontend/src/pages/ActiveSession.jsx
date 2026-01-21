import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listMySessions, submitRating } from '../api/sessions';
import { useAuthStore } from '../store/authStore';
import ChatBox from '../components/ChatBox';
import VideoCallButton from '../components/VideoCallButton';
import { notifySuccess, notifyError } from '../utils/toast';
export default function ActiveSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [session, setSession] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const data = await listMySessions();
      const s = (data.sessions || []).find(x => x._id === id);
      setSession(s || null);
    } catch (err) { console.error(err); }
  }

  const [hasRated, setHasRated] = useState(false); // Local state to prevent rapid clicks and show thank you immediately

  async function handleSubmitRating() {
    if (!rating || rating < 1) { notifyError('Please select a rating'); return; }
    if (submitting || hasRated) return;

    setSubmitting(true);
    try {
      await submitRating(id, { rating, feedback });
      setHasRated(true);
      notifySuccess('Thank you for your feedback!');
      // No navigation, let them linger or leave manually, or maybe redirect after long delay
      // Requirement says "Permanently disable rating UI"
    } catch (err) {
      if (err.response && err.response.status === 409) {
        notifyError('You have already rated this session');
        setHasRated(true); // Disable if already done
      } else {
        console.error(err);
        notifyError(err.message || 'Failed to submit rating');
      }
    } finally { setSubmitting(false); }
  }

  if (!session) return <div className="p-6">Session not found or loading...</div>;

  const isLearner = user?._id === session.learner?._id || user?.id === session.learner;

  return (
    <div className="p-6 h-[80vh]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        <div className="md:col-span-2 h-full flex flex-col">
          <div className="flex-1 relative bg-white rounded shadow-sm border overflow-hidden">
            {/* Chat View */}
            <div className="absolute inset-0 z-10">
              <ChatBox session={session} />
            </div>
          </div>
        </div>
        <aside className="md:col-span-1">
          <div className="p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold">Session details</h3>
            <div className="mt-2 text-sm">Skill: {session.skillName}</div>
            <div className="mt-1 text-sm">When: {new Date(session.scheduledAt).toLocaleString()}</div>
            <div className="mt-1 text-sm">Status: {session.status}</div>

            {session.meetingLink && (
              <div className="mt-4">
                <VideoCallButton meetingLink={session.meetingLink} />
              </div>
            )}

            {isLearner && session.status === 'completed' && !session.rating && !hasRated && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium mb-2">Rate this session</div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRating(n)} disabled={submitting} className={`px-2 py-1 rounded ${rating === n ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                      {n}★
                    </button>
                  ))}
                </div>
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Optional feedback..." rows="3" disabled={submitting} />
                <button onClick={handleSubmitRating} disabled={submitting || rating < 1} className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit rating'}</button>
              </div>
            )}
            {(session.rating || hasRated) && (
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-100">
                <div className="text-sm font-medium text-green-800">✓ Feedback submitted</div>
                {session.rating && <div className="text-sm mt-1">You rated: {session.rating}★</div>}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
