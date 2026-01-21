import { useEffect, useState, useCallback } from 'react';
import socket from '../api/socket';

function useSocket(sessionId) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onConnect = () => {
      console.log('useSocket: Connected');
      setIsConnected(true);
      setError(null);
    };

    const onDisconnect = (reason) => {
      console.log('useSocket: Disconnected', reason);
      setIsConnected(false);
    };

    const onConnectError = (err) => {
      console.error('useSocket: Connection error', err);
      setError(err.message || 'Connection failed');
      setIsConnected(false);
    };

    const onError = (errorData) => {
      console.error('useSocket: Server error', errorData);
      setError(errorData.message || 'Server error');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('error', onError);

    if (!socket.connected) {
      socket.connect();
    } else {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('error', onError);
    };
  }, []);

  useEffect(() => {
    if (!sessionId || !isConnected) return;

    console.log('useSocket: Joining session', sessionId);
    socket.emit('join:session', { sessionId });

    return () => {
      console.log('useSocket: Leaving session', sessionId);
      socket.emit('leave:session', { sessionId });
    };
  }, [sessionId, isConnected]);

  const joinSession = useCallback((sid) => {
    if (!sid) return;
    console.log('useSocket: Manually joining session', sid);
    socket.emit('join:session', { sessionId: sid });
  }, []);

  const leaveSession = useCallback((sid) => {
    if (!sid) return;
    console.log('useSocket: Manually leaving session', sid);
    socket.emit('leave:session', { sessionId: sid });
  }, []);

  return {
    socket,
    isConnected,
    error,
    joinSession,
    leaveSession
  };
}

export default useSocket;
