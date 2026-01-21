import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from 'react-avatar';
import { useAuthStore } from '../store/authStore';

export default function RequestCard({ 
  session, 
  onConfirm, 
  onCancel, 
  onComplete, 
  onAccept, 
  onReject, 
  onSchedule 
}) {
  const user = useAuthStore(s => s.user);
  
  // Helper to safely get ID string from object or string
  const getID = (obj) => (obj && typeof obj === 'object' ? obj._id : obj);

  const currentUserId = getID(user);
  const mentorId = getID(session.mentor);
  
  // Determine if the current user is the mentor (receiver of the request)
  // We use loose equality (==) or toString() to handle potential type mismatches (string vs ObjectId)
  const isMentor = currentUserId && mentorId && currentUserId.toString() === mentorId.toString();

  // Determine the "other" person to show in the card
  const otherPerson = isMentor ? session.learner : session.mentor;
  
  // If populated, use name/avatar. If not, fallback.
  const otherName = otherPerson?.name || 'Unknown User';
  const otherAvatar = otherPerson?.avatarUrl;
  
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    accepted: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusLabel = session.status.charAt(0).toUpperCase() + session.status.slice(1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        
        {/* User Info & Skill */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {otherAvatar ? (
              <img src={otherAvatar} alt={otherName} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
            ) : (
              <Avatar name={otherName} size="48" round={true} className="text-sm" />
            )}
            {/* Role Badge */}
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-white">
              {isMentor ? 'LEARNER' : 'MENTOR'}
            </span>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900">{session.skillName || 'Skill Session'}</h4>
            <p className="text-sm text-gray-500">with <span className="font-medium text-gray-700">{otherName}</span></p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[session.status] || 'bg-gray-100 text-gray-800'}`}>
          {statusLabel}
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }) : 'Not scheduled yet'}
          </span>
        </div>
        
        {session.meetingLink && (
          <div className="flex items-center gap-2 text-blue-600 truncate">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
              Join Meeting
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-3 justify-end">
        <Link 
          to={`/session/${session._id}`}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          View Details
        </Link>

        {/* Mentor Actions: Accept/Reject */}
        {isMentor && session.status === 'pending' && (
          <>
            <button 
              onClick={() => onReject && onReject(session)}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Reject
            </button>
            <button 
              onClick={() => onAccept && onAccept(session)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
            >
              Accept Request
            </button>
          </>
        )}

        {/* Mentor Actions: Schedule */}
        {isMentor && session.status === 'accepted' && !session.scheduledAt && (
          <button 
            onClick={() => onSchedule && onSchedule(session)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
          >
            Schedule Session
          </button>
        )}

        {/* Mentor Actions: Confirm (if scheduled but not confirmed? usually confirm is for learner or system?) 
            Actually in SessionCard it was: {onConfirm && <button ...>Confirm</button>}
            Let's keep it generic if passed.
        */}
        {onConfirm && (
          <button 
            onClick={() => onConfirm(session)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm"
          >
            Confirm
          </button>
        )}

        {/* Complete */}
        {onComplete && (
          <button 
            onClick={() => onComplete(session)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            Mark Complete
          </button>
        )}

        {/* Cancel */}
        {onCancel && ['pending', 'accepted', 'scheduled'].includes(session.status) && (
          <button 
            onClick={() => onCancel(session)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
