import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.MODE === 'production' ? "https://mainel.onrender.com" : "http://localhost:5000");

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Socket.io: Connected to server', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Socket.io: Connection error', err.message);
});

socket.on('disconnect', (reason) => {
  console.log('Socket.io: Disconnected', reason);
});

socket.on('error', (error) => {
  console.error('Socket.io: Server error', error);
});

export default socket;
