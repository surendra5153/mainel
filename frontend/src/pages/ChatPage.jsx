import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'User A', content: 'Hi there!' },
    { id: 2, sender: 'User B', content: 'Hello! How can I help you?' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => {
        const isDuplicate = prevMessages.some(msg => msg.id === message.id);
        return isDuplicate ? prevMessages : [...prevMessages, message];
      });
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      const message = { id: Date.now(), sender: 'You', content: newMessage };
      socket.emit('sendMessage', message);
      setMessages((prevMessages) => {
        const isDuplicate = prevMessages.some(msg => msg.id === message.id);
        return isDuplicate ? prevMessages : [...prevMessages, message];
      });
      setNewMessage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>
      <div className="bg-gray-100 p-4 rounded shadow mb-4 h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="mb-2">
            <strong>{message.sender}:</strong> <span>{message.content}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 border rounded"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;