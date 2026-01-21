import { Video } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function VideoCallButton({ meetingLink }) {
  const navigate = useNavigate();
  // We can get sessionId from URL params if this button is used on the session page, 
  // OR we should pass sessionId as prop. Assuming we are on session page or have context?
  // Ideally this component should receive sessionId if available. 
  // Looking at usage might be safer, but `meetingLink` contains the ID if we parse it, 
  // OR we just rely on parent passing it.
  // The user prompt says "Navigate internally to /video-call/:sessionId".
  // If we don't have sessionId prop, let's try to extract it from the link or assume we are on a page where we can get it.
  // Wait, the meeting link format is: .../session-{sessionId}-{uuid}
  // We can extract sessionId from there!

  if (!meetingLink) {
    return null;
  }

  const handleJoinCall = () => {
    // Extract sessionId from link: https://meet.jit.si/session-{sessionId}-{uuid}
    // roomName = session-{sessionId}-{uuid}
    const roomName = meetingLink.split('/').pop();
    const parts = roomName.split('-');
    // parts[0] is 'session', parts[1] is sessionId.
    const derivedSessionId = parts[1];

    if (derivedSessionId) {
      navigate(`/video-call/${derivedSessionId}`, { state: { meetingLink } });
    } else {
      // Fallback if parsing fails (shouldn't happen if link is valid)
      window.open(meetingLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={handleJoinCall}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
    >
      <Video className="w-5 h-5" />
      Join Video Call
    </button>
  );
}
