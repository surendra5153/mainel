import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, logVideoStart } from '../api/sessions';
import { useAuthStore } from '../store/authStore';
import { notifyError } from '../utils/toast';

export default function VideoCall() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore(s => s.user);
    const jitsiContainerRef = useRef(null);
    const [jitsiApi, setJitsiApi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('initializing'); // initializing, joining, in-meeting, left
    const [roomInfo, setRoomInfo] = useState(null); // { roomName, password }

    // Fetch session info on mount
    useEffect(() => {
        let mounted = true;
        async function fetchInfo() {
            try {
                const session = await getSession(sessionId);
                if (session && session.meetingLink) {
                    const roomName = session.meetingLink.split('/').pop();
                    if (mounted) {
                        setRoomInfo({
                            roomName,
                            password: session.meetingPassword
                        });
                        setLoading(false);
                    }
                } else {
                    // No meeting link?
                    if (mounted) {
                        notifyError('Meeting link not found');
                        navigate(`/session/${sessionId}`);
                    }
                }
            } catch (err) {
                console.error(err);
                if (mounted) navigate('/dashboard');
            }
        }
        fetchInfo();
        return () => { mounted = false; };
    }, [sessionId, navigate]);

    // Initialize Jitsi when roomInfo is ready
    useEffect(() => {
        if (!roomInfo || !user) return;

        const { roomName, password } = roomInfo;

        // Load Jitsi script
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
            const domain = 'meet.jit.si';
            const options = {
                roomName: roomName,
                width: '100%',
                height: '100%',
                parentNode: jitsiContainerRef.current,
                userInfo: {
                    email: user.email,
                    displayName: user.name
                },
                configOverwrite: {
                    startWithAudioMuted: true,
                    disableDeepLinking: true,
                    prejoinPageEnabled: false
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                        'e2ee'
                    ]
                }
            };

            const api = new window.JitsiMeetExternalAPI(domain, options);
            setJitsiApi(api);

            // Set password if exists (wait a beat for api init)
            api.addEventListener('videoConferenceJoined', () => {
                setStatus('in-meeting');
                logVideoStart(sessionId).catch(console.error);
                if (password) {
                    api.executeCommand('password', password);
                }
            });

            // Event listeners
            api.addEventListener('videoConferenceLeft', () => {
                setStatus('left');
                setTimeout(() => navigate(`/session/${sessionId}`), 1000);
            });
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            if (jitsiApi) jitsiApi.dispose();
        };
    }, [roomInfo, user, navigate, sessionId]);

    return (
        <div className="h-screen w-screen overflow-hidden bg-gray-900 flex flex-col relative">
            {(loading || status === 'initializing') && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900 text-white">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p>Connecting to secure session...</p>
                    </div>
                </div>
            )}
            {status === 'left' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900 text-white">
                    <p>You have left the meeting. Redirecting...</p>
                </div>
            )}
            <div ref={jitsiContainerRef} className="flex-1 w-full h-full" />
        </div>
    );
}
