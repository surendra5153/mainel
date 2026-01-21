import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import useSocket from '../hooks/useSocket';

export default function ChatBox({ session }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState(session?.messages || []);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const listRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const user = useAuthStore(s => s.user);
  const { socket, isConnected, error } = useSocket(session?._id);

  useEffect(() => {
    setMessages(session?.messages || []);
  }, [session]);

  useEffect(() => {
    if (!socket || !session?._id) return;

    const handleMessageReceived = (msg) => {
      if (msg && msg.text && msg.sessionId === session._id) {
        setMessages((m) => [...m, msg]);
      }
    };

    const handleTyping = ({ userId, isTyping }) => {
      if (userId !== user?._id && userId !== user?.id) {
        setOtherUserTyping(isTyping);
        if (isTyping) {
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    };

    const handleUserJoined = ({ userName }) => {
      setMessages(prev => [...prev, { type: 'system', text: `${userName || 'User'} joined the chat`, createdAt: new Date() }]);
    };

    const handleUserLeft = ({ userId }) => {
      // mapping userId to name would require looking up, for now generic or passed name
      setMessages(prev => [...prev, { type: 'system', text: `User left the chat`, createdAt: new Date() }]);
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('typing', handleTyping);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('typing', handleTyping);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
    };
  }, [socket, session?._id, user?._id, user?.id]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = useCallback((e) => {
    setText(e.target.value);

    if (!socket || !session?._id || !isConnected) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      socket.emit('typing:start', { sessionId: session._id });
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { sessionId: session._id });
      typingTimeoutRef.current = null;
    }, 2000);
  }, [socket, session?._id, isConnected]);

  const handleSend = useCallback((e) => {
    e.preventDefault();
    if (!text.trim() || !session || !isConnected) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing:stop', { sessionId: session._id });
      typingTimeoutRef.current = null;
    }

    socket.emit('message:send', {
      sessionId: session._id,
      text: text.trim()
    });

    setText('');
  }, [text, session, socket, isConnected]);

  return (
    <div className="flex flex-col h-full">
      <div className={`px-3 py-1 text-xs text-center border-b ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
        }`}>
        {isConnected ? 'Connected to secure chat' : `Connecting... ${error ? `(${error})` : ''}`}
      </div>
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2 bg-white border rounded">
        {messages.map((m, idx) => {
          // Handle system messages (user joined/left)
          if (!m.text && (m.userId || m.userName)) { // heuristics if message struct varies
            // or check if m.type === 'system' if backend supported it.
            // But backend emits 'user:joined' separate from 'message:received'. This map loop iterates 'messages' state.
            // We need to inject system events into 'messages' state.
          }

          const isOwnMessage = (m.from === user?._id || m.from === user?.id);

          // Render system messages if we adapt state (see below in handleUserJoined)
          if (m.type === 'system') {
            return (
              <div key={idx} className="text-center text-xs text-gray-400 my-2">
                {m.text}
              </div>
            );
          }
          return (
            <div key={m._id || m.createdAt || idx} className={`text-sm ${isOwnMessage ? 'text-right' : ''}`}>
              {!isOwnMessage && <div className="text-xs text-gray-500">{m.fromName || m.from}</div>}
              <div className={`inline-block p-2 rounded ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                {m.text}
              </div>
              {isOwnMessage && <div className="text-xs text-gray-400 mt-1">You</div>}
            </div>
          );
        })}
        {otherUserTyping && (
          <div className="text-sm text-gray-500 italic">
            Typing...
          </div>
        )}
      </div>
      <form onSubmit={handleSend} className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={handleInputChange}
          onBlur={() => {
            if (typingTimeoutRef.current && socket && session?._id) {
              clearTimeout(typingTimeoutRef.current);
              socket.emit('typing:stop', { sessionId: session._id });
              typingTimeoutRef.current = null;
            }
          }}
          className="flex-1 border px-3 py-2 rounded"
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          disabled={!isConnected || !text.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
