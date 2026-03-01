import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  // Chat state
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState({}); // { userId: [messages] }
  const [contacts, setContacts] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // Group state
  const [groups, setGroups] = useState([]);
  const [groupMessages, setGroupMessages] = useState({});
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState({});
  const [groupTypingUsers, setGroupTypingUsers] = useState({});
  
  // Online status
  const [contactsOnlineStatus, setContactsOnlineStatus] = useState({});
  
  // Muted chats
  const [mutedChats, setMutedChats] = useState({});
  const [mutedGroups, setMutedGroups] = useState({});

  // Get auth headers helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users`, {
        headers: getAuthHeaders()
      });
      setContacts(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching contacts:', error.message);
      return [];
    }
  }, []);

  // Fetch recent chats
  const fetchRecentChats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/recent-chats`, {
        headers: getAuthHeaders()
      });
      setRecentChats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent chats:', error.message);
      return [];
    }
  }, []);

  // Fetch unread counts
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/unread-counts`, {
        headers: getAuthHeaders()
      });
      setUnreadCounts(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread counts:', error.message);
      return {};
    }
  }, []);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/groups`, {
        headers: getAuthHeaders()
      });
      setGroups(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error.message);
      return [];
    }
  }, []);

  // Fetch messages for a chat
  const fetchMessages = useCallback(async (username) => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/${username}`, {
        headers: getAuthHeaders()
      });
      setChats(prev => ({
        ...prev,
        [username]: response.data
      }));
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error.message);
      return [];
    }
  }, []);

  // Fetch group messages
  const fetchGroupMessages = useCallback(async (groupId) => {
    try {
      const response = await axios.get(`${API_URL}/api/group-messages/${groupId}`, {
        headers: getAuthHeaders()
      });
      setGroupMessages(prev => ({
        ...prev,
        [groupId]: response.data
      }));
      return response.data;
    } catch (error) {
      console.error('Error fetching group messages:', error.message);
      return [];
    }
  }, []);

  // Add message to chat
  const addMessage = useCallback((username, message) => {
    setChats(prev => ({
      ...prev,
      [username]: [...(prev[username] || []), message]
    }));
  }, []);

  // Add group message
  const addGroupMessage = useCallback((groupId, message) => {
    setGroupMessages(prev => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), message]
    }));
  }, []);

  // Update typing status
  const setTyping = useCallback((username, isTyping) => {
    setTypingUsers(prev => ({
      ...prev,
      [username]: isTyping
    }));
  }, []);

  // Update group typing status
  const setGroupTyping = useCallback((groupId, username, isTyping) => {
    setGroupTypingUsers(prev => {
      const current = prev[groupId] || [];
      if (isTyping && !current.includes(username)) {
        return { ...prev, [groupId]: [...current, username] };
      } else if (!isTyping) {
        return { ...prev, [groupId]: current.filter(u => u !== username) };
      }
      return prev;
    });
  }, []);

  // Update online status
  const updateOnlineStatus = useCallback((username, status) => {
    setContactsOnlineStatus(prev => ({
      ...prev,
      [username]: status
    }));
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (username) => {
    try {
      await axios.post(`${API_URL}/api/mark-read/${username}`, {}, {
        headers: getAuthHeaders()
      });
      setUnreadCounts(prev => ({
        ...prev,
        [username]: 0
      }));
    } catch (error) {
      console.error('Error marking as read:', error.message);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback((username) => {
    setMutedChats(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  }, []);

  // Toggle group mute
  const toggleGroupMute = useCallback((groupId) => {
    setMutedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);

  const value = {
    // State
    selectedChat,
    setSelectedChat,
    chats,
    setChats,
    contacts,
    setContacts,
    recentChats,
    setRecentChats,
    unreadCounts,
    setUnreadCounts,
    groups,
    setGroups,
    groupMessages,
    setGroupMessages,
    typingUsers,
    groupTypingUsers,
    contactsOnlineStatus,
    mutedChats,
    mutedGroups,
    
    // Actions
    fetchContacts,
    fetchRecentChats,
    fetchUnreadCounts,
    fetchGroups,
    fetchMessages,
    fetchGroupMessages,
    addMessage,
    addGroupMessage,
    setTyping,
    setGroupTyping,
    updateOnlineStatus,
    markAsRead,
    toggleMute,
    toggleGroupMute
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
