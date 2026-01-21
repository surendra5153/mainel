import React from 'react';
import { Link } from 'react-router-dom';
import VideoCallButton from './VideoCallButton';

export default function SessionCard({ session, onConfirm, onCancel, onComplete, onAccept, onReject, onSchedule }) {
  return (
    <Link to={`/session/${session._id}`} className="block p-4 border rounded bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold">{session.skillName || session.skillRef?.name || 'Session'}</div>
          <div className="text-sm text-gray-600">{new Date(session.scheduledAt).toLocaleString()}</div>
        </div>
        <div className="text-sm text-gray-500">{session.status}</div>
      </div>
      {session.meetingLink && (
        <div className="mt-3" onClick={(e) => e.preventDefault()}>
          <VideoCallButton meetingLink={session.meetingLink} />
        </div>
      )}
      <div className="mt-3 flex gap-2" onClick={(e) => e.preventDefault()}>
        {onAccept && session.status === 'pending' && <button onClick={() => onAccept(session)} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>}
        {onReject && session.status === 'pending' && <button onClick={() => onReject(session)} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>}
        {onSchedule && session.status === 'accepted' && <button onClick={() => onSchedule(session)} className="px-3 py-1 bg-purple-600 text-white rounded">Schedule</button>}
        {onConfirm && <button onClick={() => onConfirm(session)} className="px-3 py-1 bg-green-600 text-white rounded">Confirm</button>}
        {onComplete && <button onClick={() => onComplete(session)} className="px-3 py-1 bg-blue-600 text-white rounded">Complete</button>}
        {onCancel && <button onClick={() => onCancel(session)} className="px-3 py-1 border rounded">Cancel</button>}
      </div>
    </Link>
  );
}
