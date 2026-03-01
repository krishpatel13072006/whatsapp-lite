import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Custom hook for Socket.io connection
 * @param {String} username - Current user's username
 * @param {Object} options - Socket configuration options
 * @returns {Object} Socket instance and utility functions
 */
export const useSocket = (username, options = {}) => {
  const socketRef = useRef(null);
  const listenersRef = useRef({});

  // Initialize socket connection
  useEffect(() => {
    if (!username) return;

    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling'],
      ...options
    });

    // User comes online
    socketRef.current.emit('user-online', username);

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('user-offline', username);
        socketRef.current.disconnect();
      }
    };
  }, [username]);

  // Subscribe to an event
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      listenersRef.current[event] = callback;
    }
  }, []);

  // Unsubscribe from an event
  const off = useCallback((event) => {
    if (socketRef.current && listenersRef.current[event]) {
      socketRef.current.off(event, listenersRef.current[event]);
      delete listenersRef.current[event];
    }
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback((messageData) => {
    emit('send-message', messageData);
  }, [emit]);

  // Send a group message
  const sendGroupMessage = useCallback((messageData) => {
    emit('send-group-message', messageData);
  }, [emit]);

  // Send typing indicator
  const sendTyping = useCallback((toUsername, isTyping) => {
    emit('typing', { to: toUsername, isTyping });
  }, [emit]);

  // Send group typing indicator
  const sendGroupTyping = useCallback((groupId, isTyping) => {
    emit('group-typing', { groupId, isTyping });
  }, [emit]);

  // Join a group room
  const joinGroup = useCallback((groupId) => {
    emit('join-group', groupId);
  }, [emit]);

  // Leave a group room
  const leaveGroup = useCallback((groupId) => {
    emit('leave-group', groupId);
  }, [emit]);

  return {
    socket: socketRef.current,
    on,
    off,
    emit,
    sendMessage,
    sendGroupMessage,
    sendTyping,
    sendGroupTyping,
    joinGroup,
    leaveGroup
  };
};

export default useSocket;
