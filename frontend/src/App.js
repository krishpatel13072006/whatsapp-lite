import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshTransmissionMaterial } from '@react-three/drei';
import MovingParticles from './components/MovingParticles';
import { CircleParticles, CircleMesh, SquareParticles, SquareMesh, HexagonParticles, HexagonMesh } from './components/AuthShapes';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';
import { Send, Phone, Video, MessageSquare, History, Trash2, LogOut, User, Paperclip, Mic, ArrowLeft, Settings, Image, File, Copy, X, Check, Smile, Info, Sticker, Bell, BellOff, Ban, UserX, Users, UserPlus, Search, Star, Reply, Edit, Pin, Clock, Palette, Plus, Compass, MoreVertical } from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import SkeletonLoader from './components/SkeletonLoader';
import WelcomeScene3D from './components/WelcomeScene3D';
import EmptyChatScene3D from './components/EmptyChatScene3D';
import AuthScene3D from './components/AuthScene3D';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import LandingPage from './components/LandingPage';
import './animations.css';

// API URL for backend requests
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Local sticker packs
const STICKER_PACKS = {
  cuppy: {
    name: 'Cuppy',
    folder: '1',
    stickers: [
      '01_Cuppy_smile.webp', '02_Cuppy_lol.webp', '03_Cuppy_rofl.webp', '04_Cuppy_sad.webp', '05_Cuppy_cry.webp',
      '06_Cuppy_love.webp', '07_Cuppy_hate.webp', '08_Cuppy_lovewithmug.webp', '09_Cuppy_lovewithcookie.webp', '10_Cuppy_hmm.webp',
      '11_Cuppy_upset.webp', '12_Cuppy_angry.webp', '13_Cuppy_curious.webp', '14_Cuppy_weird.webp', '15_Cuppy_bluescreen.webp',
      '16_Cuppy_angry.webp', '17_Cuppy_tired.webp', '18_Cuppy_workhard.webp', '19_Cuppy_shine.webp', '20_Cuppy_disgusting.webp',
      '21_Cuppy_hi.webp', '22_Cuppy_bye.webp', '23_Cuppy_greentea.webp', '24_Cuppy_phone.webp', '25_Cuppy_battery.webp'
    ]
  },
  love: {
    name: 'Sending Love',
    folder: '2',
    stickers: [
      '01_SendingLove.webp', '02_WellDoThisTogether.webp', '03_Heart.webp', '04_AirHighFive.webp', '05_GroupVideoCalling.webp',
      '06_StayConnected.webp', '07_OK.webp', '08_AreYouOK.webp', '09_StayingHomeMug.webp', '10_WorkingFromBed.webp',
      '11_StayCalm.webp', '12_Gymnastics.webp', '13_DoubleChecking.webp', '14_CatOnTheLaptop.webp', '15_WorkingFromHomeF.webp',
      '16_WorkingFromHomeM.webp', '17_WashingHands.webp', '18_DontTouchYourFace.webp', '19_SocialDistancing.webp', '20_SuperheroNurse.webp',
      '21_YouAreMyHero.webp'
    ]
  }
};

// ICE Servers for WebRTC - Using free STUN servers for peer-to-peer connections
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

// Wallpaper options
const WALLPAPERS = {
  default: 'bg-[#0b141a] glassmorphic-dark',
  light: 'bg-[#e5ddd5] glassmorphic',
  dark: 'bg-[#0d1418] glassmorphic-dark',
  solidRed: 'bg-red-900',
  solidBlue: 'bg-blue-900',
  solidGreen: 'bg-[#d9fdd3] dark:bg-green-900',
  solidPurple: 'bg-indigo-900',
  solidYellow: 'bg-yellow-900',
  solidPink: 'bg-pink-900',
  solidGray: 'bg-gray-800',
  gradient: 'bg-gradient-to-br from-[#1a2a32] to-[#0b141a] glassmorphic-dark',
  nature: 'bg-gradient-to-br from-green-900 to-green-700 glassmorphic-dark',
  ocean: 'bg-gradient-to-br from-blue-900 to-blue-700 glassmorphic-dark',
  sunset: 'bg-gradient-to-br from-orange-900 to-red-700 glassmorphic-dark',
  purple: 'bg-gradient-to-br from-purple-900 to-purple-700 glassmorphic-dark'
};

// Block Users List component – shows all registered users with Block/Unblock buttons
function BlockUsersList({ blockedContacts, setBlockedContacts }) {
  const [allUsers, setAllUsers] = React.useState([]);
  const [blockSearch, setBlockSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchAllUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/all-users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllUsers(res.data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllUsers();
  }, []);

  const isBlocked = (userId) => blockedContacts.some(c => c._id === userId);

  const handleBlock = async (user) => {
    try {
      const token = localStorage.getItem('token');
      if (isBlocked(user._id)) {
        await axios.post(`${API_URL}/api/unblock-contact`,
          { contactId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBlockedContacts(prev => prev.filter(c => c._id !== user._id));
      } else {
        await axios.post(`${API_URL}/api/block-contact`,
          { contactId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBlockedContacts(prev => [...prev, user]);
      }
    } catch (err) {
      console.error('Error toggling block:', err);
      alert(err.response?.data?.message || 'Failed to update block status');
    }
  };

  const filtered = allUsers.filter(u =>
    (u.displayName || u.username).toLowerCase().includes(blockSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(blockSearch.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={blockSearch}
        onChange={e => setBlockSearch(e.target.value)}
        className="w-full bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-white p-2.5 rounded-lg outline-none text-sm mb-3 placeholder-[#54656f] dark:placeholder-gray-400 border border-gray-300 dark:border-transparent"
      />
      {loading ? (
        <p className="text-[#54656f] dark:text-gray-400 text-sm text-center py-4">Loading users...</p>
      ) : filtered.length === 0 ? (
        <p className="text-[#54656f] dark:text-gray-400 text-sm text-center py-4">No users found</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {filtered.map(user => (
            <div key={user._id} className="flex items-center justify-between bg-[#2a3942] p-2.5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#111b21] dark:text-white text-sm font-medium">
                      {(user.displayName || user.username)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[#111b21] dark:text-white text-sm">{user.displayName || user.username}</p>
                  <p className="text-[#54656f] dark:text-gray-400 text-xs">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={() => handleBlock(user)}
                className={`px-3 py-1 rounded text-[#111b21] dark:text-white text-xs font-medium transition ${isBlocked(user._id)
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {isBlocked(user._id) ? 'Unblock' : 'Block'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [error, setError] = useState('');

  // Password reset states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: enter identifier, 2: enter code, 3: new password
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetUsername, setResetUsername] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [message, setMessage] = useState("");

  // Video call states
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [caller, setCaller] = useState('');
  const [callType, setCallType] = useState('video'); // 'video' or 'voice'

  // Theme and animation states
  const [theme, setTheme] = useState('dark-theme');
  const [showParticles, setShowParticles] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  // Landing page state
  const [showLandingPage, setShowLandingPage] = useState(() => !localStorage.getItem('token'));

  // Navigation history for back button
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('token') ? 'chat' : 'landing'); // landing, auth, main, settings, profile, etc.

  // Function to navigate and track history
  const navigateTo = (view) => {
    setNavigationHistory([...navigationHistory, currentView]);
    setCurrentView(view);
  };

  // Function to go back to previous page
  const goBack = () => {
    if (navigationHistory.length > 0) {
      const previousView = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(navigationHistory.slice(0, -1));
      setCurrentView(previousView);
    }
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('whatsappTheme') || 'dark-theme';
    setTheme(savedTheme);
    document.documentElement.classList.add(savedTheme);
    if (savedTheme === 'dark-theme') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Request Notification Permission
  useEffect(() => {
    if (isLoggedIn && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, [isLoggedIn]);

  // Add particles to the DOM
  const addParticles = () => {
    if (!showParticles || !animationEnabled) return;

    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (15 + Math.random() * 10) + 's';
      particlesContainer.appendChild(particle);
    }

    document.body.appendChild(particlesContainer);
  };

  // Remove particles
  const removeParticles = () => {
    const particles = document.querySelector('.particles');
    if (particles) {
      particles.remove();
    }
  };

  // Toggle particles
  const toggleParticles = () => {
    setShowParticles(!showParticles);
    if (showParticles) {
      removeParticles();
    } else {
      addParticles();
    }
  };

  // Toggle animations
  const toggleAnimations = () => {
    setAnimationEnabled(!animationEnabled);
    if (!animationEnabled) {
      // Enable animations
      document.querySelectorAll('*').forEach(el => {
        el.style.animationPlayState = 'running';
      });
    } else {
      // Disable animations
      document.querySelectorAll('*').forEach(el => {
        el.style.animationPlayState = 'paused';
      });
    }
  };

  // Apply theme classes to elements
  const applyThemeClasses = () => {
    const elements = document.querySelectorAll('.glassmorphic, .neumorphic, .card-3d, .btn-3d, .message-bubble, .skeleton');
    elements.forEach(el => {
      el.classList.add('transition-smooth');
    });
  };

  // Initialize animations and effects
  useEffect(() => {
    applyThemeClasses();

    // Cleanup
    return () => {

    };
  }, [theme, showParticles, animationEnabled]);

  // Update theme
  const updateTheme = (newTheme) => {
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
    if (newTheme === 'dark-theme') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTheme(newTheme);
    localStorage.setItem('whatsappTheme', newTheme);
  };

  // Helper to safely parse JSON from localStorage
  const getStoredData = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      const parsed = JSON.parse(stored);
      // Validate that parsed data is an object or array
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Helper to get user-specific localStorage key
  const getUserStorageKey = (key) => {
    const currentUser = localStorage.getItem('username');
    return currentUser ? `${key}_${currentUser}` : null;
  };

  // Initialize state from localStorage - use user-specific keys for privacy
  // Only load data if user is already logged in (has token AND username)
  const getInitialUserData = (key, defaultValue) => {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('username');
    // Only load from storage if both token and username exist
    if (!token || !currentUser) {
      return defaultValue;
    }
    const userKey = `${key}_${currentUser}`;
    return getStoredData(userKey, defaultValue);
  };

  const storedChats = getInitialUserData('chats', {});
  const storedContacts = getInitialUserData('contacts', []);
  const storedRecentChats = getInitialUserData('recentChats', []);
  const storedWallpaper = 'default'; // Always default initially, will be fetched from database
  const storedAbout = localStorage.getItem('about') || 'Hey there! I am using WhatsApp-Lite';

  // Chat states
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState(storedChats); // { userId: [{ from: '', text: '', timestamp: '', type, fileUrl, fileName, messageId }] }
  const [idToCall, setIdToCall] = useState("");
  const [contacts, setContacts] = useState(storedContacts); // All registered users
  const [recentChats, setRecentChats] = useState(storedRecentChats); // Users they've chatted with

  // Group chat states
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupProfilePicture, setNewGroupProfilePicture] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupMessages, setGroupMessages] = useState({}); // { groupId: [messages] }
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // History states
  const [callHistory, setCallHistory] = useState([]);
  const [view, setView] = useState('chat');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [showChatOptionsMenu, setShowChatOptionsMenu] = useState(false);
  // Show all registered users
  const [showAllUsers, setShowAllUsers] = useState(false);
  // FAB menu state
  const [showFabMenu, setShowFabMenu] = useState(false);
  // Starred messages state
  const [starredMessages, setStarredMessages] = useState([]);
  const [showStarredMessages, setShowStarredMessages] = useState(false);
  // Forward message state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [forwardingChats, setForwardingChats] = useState([]); // Array of selected chat IDs
  // QR Code state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQRCodeData] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedContact, setScannedContact] = useState(null);
  // Status (Stories) state
  const [statuses, setStatuses] = useState([]); // Grouped statuses by user
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [currentStatusUser, setCurrentStatusUser] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [showStatusCreator, setShowStatusCreator] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusBackgroundColor, setStatusBackgroundColor] = useState('#25D366');
  const [showViewersList, setShowViewersList] = useState(false);
  const [currentStatusViewers, setCurrentStatusViewers] = useState([]);
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchUserNotFound, setSearchUserNotFound] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  // Broadcast state
  const [showBroadcasts, setShowBroadcasts] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  // Reply state
  const [replyToMessage, setReplyToMessage] = useState(null);
  // Profile view state
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  const [wallpaper, setWallpaper] = useState(storedWallpaper);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Profile states (Core Identity)
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState(storedAbout);
  const [profilePicture, setProfilePicture] = useState('');

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    about: 'everyone',
    status: 'everyone',
    readReceipts: true
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    pushEnabled: false,
    muteAll: false
  });

  // Blocked contacts
  const [blockedContacts, setBlockedContacts] = useState([]);

  // Typing indicator
  const [typingUsers, setTypingUsers] = useState({}); // { username: boolean }
  const [groupTypingUsers, setGroupTypingUsers] = useState({}); // { groupId: [usernames] }
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Online status of contacts
  const [contactsOnlineStatus, setContactsOnlineStatus] = useState({}); // { username: { isOnline, lastSeen } }

  // Unread message counts
  const [unreadCounts, setUnreadCounts] = useState({}); // { username: count }

  // Muted chats
  const [mutedChats, setMutedChats] = useState({}); // { username: boolean }
  const [mutedGroups, setMutedGroups] = useState({}); // { groupId: boolean }

  // Chat options menu
  const [chatOptionsMenu, setChatOptionsMenu] = useState({ show: false, x: 0, y: 0, userId: null });

  // Group options menu
  const [groupOptionsMenu, setGroupOptionsMenu] = useState({ show: false, x: 0, y: 0, groupId: null, groupName: null });

  // Message context menu
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, message: null, messageIndex: null });
  const [copiedMessage, setCopiedMessage] = useState('');

  // File upload states
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // GIF picker
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState([]);

  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Sticker picker
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  // New features states
  const [showReactionPicker, setShowReactionPicker] = useState(null); // messageId
  const [editingMessage, setEditingMessage] = useState(null); // messageId being edited
  const [editText, setEditText] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [chatTheme, setChatTheme] = useState({ wallpaper: 'default', bubbleColor: '#005c4b' });
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [disappearingEnabled, setDisappearingEnabled] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState(0);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const voiceRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // Call states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Group Details state
  const [groupDetails, setGroupDetails] = useState(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  // All Messages state (for export)
  const [allMessages, setAllMessages] = useState([]);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [allMessagesSearch, setAllMessagesSearch] = useState('');

  // Computed: filtered all messages
  const filteredAllMessages = allMessages.filter(msg => {
    if (!allMessagesSearch) return true;
    const searchLower = allMessagesSearch.toLowerCase();
    return (
      (msg.text && msg.text.toLowerCase().includes(searchLower)) ||
      (msg.fromUsername && msg.fromUsername.toLowerCase().includes(searchLower)) ||
      (msg.toUsername && msg.toUsername.toLowerCase().includes(searchLower)) ||
      (msg.chatName && msg.chatName.toLowerCase().includes(searchLower))
    );
  });

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const mediaRecorderRef = useRef();
  const chunks = useRef([]);
  const chatEndRef = useRef(null);

  // Socket ref - each browser tab/window gets its own socket connection
  const socketRef = useRef(null);

  // Refs to track latest state in socket handlers (avoid stale closures)
  const selectedChatRef = useRef(selectedChat);
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  const showGroupSettingsRef = useRef(showGroupSettings);
  useEffect(() => { showGroupSettingsRef.current = showGroupSettings; }, [showGroupSettings]);

  const editingGroupRef = useRef(editingGroup);
  useEffect(() => { editingGroupRef.current = editingGroup; }, [editingGroup]);

  // Initialize socket and media
  const initializeApp = () => {
    // Clean up any existing socket listeners before initializing
    cleanupSocket();

    // Initialize socket connection - always create a new socket for this session
    // Each browser tab/window gets its own socket connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const savedUsername = localStorage.getItem('username');
    console.log('🚀 Initializing app for user:', savedUsername);

    socketRef.current = io.connect(`${API_URL}`, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      if (myVideo.current) myVideo.current.srcObject = currentStream;
    }).catch(err => console.log('Media access error:', err));

    // Register user when socket connects - this is the primary registration point
    const registerUser = () => {
      if (savedUsername && socket.connected) {
        console.log('✅ Registering user:', savedUsername, 'socket:', socket.id);
        socket.emit("register_user", savedUsername);
      }
    };

    socket.on("me", (id) => {
      setMe(id);
      console.log('📱 Received me event, socket id:', id, 'for user:', savedUsername);
      registerUser();
    });

    // Primary registration on connect event
    socket.on("connect", () => {
      console.log('✅ Socket connected:', socket.id, 'for user:', savedUsername);
      // Small delay to ensure socket is fully ready
      setTimeout(() => registerUser(), 50);
    });

    socket.on("disconnect", () => {
      console.log('❌ Socket disconnected for user:', savedUsername);
    });

    socket.on("connect_error", (err) => {
      console.error('❌ Socket connection error:', err);
    });

    // Try to register immediately if already connected
    if (savedUsername && socket.connected) {
      console.log('🔄 Socket already connected, registering now:', savedUsername);
      registerUser();
    }

    socket.on("receive_message", (data) => {
      console.log('📥 Received message:', data.text, 'from:', data.fromUsername);
      const chatKey = data.fromUsername || data.from;
      const currentUsername = localStorage.getItem('username');

      setChats(prev => {
        return {
          ...prev,
          [chatKey]: [...(prev[chatKey] || []), {
            ...data,
            timestamp: new Date(data.timestamp),
            delivered: true,
            _id: data._id,
            clientId: data.clientId,
            starred: (data.starredBy && data.starredBy.includes(currentUsername)) || false,
            starredBy: data.starredBy || []
          }]
        };
      });

      // Send read receipt if chat is open with this user
      if (selectedChatRef.current === chatKey) {
        socket.emit("message_read", {
          fromUsername: data.fromUsername,
          toUsername: currentUsername,
          messageId: data.timestamp
        });
      } else {
        // Increment unread count if chat is not open
        setUnreadCounts(prev => ({
          ...prev,
          [chatKey]: (prev[chatKey] || 0) + 1
        }));
      }

      // Play notification sound and show browser notification
      setNotificationSettings(currentSettings => {
        if (selectedChatRef.current !== chatKey) {
          if (currentSettings.sound && !currentSettings.muteAll) {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));
          }

          if ('Notification' in window && Notification.permission === 'granted' && !currentSettings.muteAll) {
            try {
              new Notification(`New message from ${data.fromUsername || data.from}`, {
                body: data.text || 'Sent an attachment',
                icon: '/logo192.png'
              });
            } catch (err) {
              console.error('Error showing notification:', err);
            }
          }
        }
        return currentSettings;
      });
    });

    // Handle message delivered (double tick)
    socket.on("message_delivered", (data) => {
      setChats(prev => {
        const chatMessages = prev[data.toUsername] || [];
        return {
          ...prev,
          [data.toUsername]: chatMessages.map(m =>
            m.timestamp === data.messageId ? { ...m, delivered: true } : m
          )
        };
      });
    });

    // Handle message read (blue tick)
    socket.on("message_read_receipt", (data) => {
      setChats(prev => {
        const chatMessages = prev[data.toUsername] || [];
        return {
          ...prev,
          [data.toUsername]: chatMessages.map(m =>
            m.timestamp === data.messageId ? { ...m, delivered: true, read: true } : m
          )
        };
      });
    });

    socket.on("incomingCall", (data) => {
      // Only show incoming call if we have valid data
      if (data && data.from && data.signal) {
        setReceivingCall(true);
        setCallerSignal(data.signal);
        setCaller(data.from);
        setCallType(data.callType || 'video');

        // Auto-dismiss after 30 seconds if not answered
        setTimeout(() => {
          setReceivingCall(prev => {
            if (prev) {
              setCaller('');
              return false;
            }
            return prev;
          });
        }, 30000);
      }
    });

    socket.on("callEnded", () => {
      setCallEnded(true);
      setCallAccepted(false);
      setReceivingCall(false);
      setCaller('');
      if (userVideo.current) userVideo.current.srcObject = null;
    });

    // Handle message deletion from other user
    socket.on("message_deleted", (data) => {
      setChats(prev => ({
        ...prev,
        [data.from]: prev[data.from]?.map((m, i) =>
          i === data.messageIndex ? { ...m, deletedForEveryone: true } : m
        )
      }));
    });

    // Handle group message deletion
    socket.on("group_message_deleted", (data) => {
      const { groupId, messageId } = data;
      setGroupMessages(prev => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter(m => m._id !== messageId)
      }));
    });

    // Handle typing indicator
    socket.on("user_typing", (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.from]: data.isTyping
      }));
    });

    // Handle group typing indicator
    socket.on("group_user_typing", (data) => {
      const { groupId, fromUsername, isTyping } = data;
      const currentUsername = localStorage.getItem('username');
      // Don't show typing indicator for current user
      if (fromUsername === currentUsername) return;

      setGroupTypingUsers(prev => {
        const currentTypingUsers = prev[groupId] || [];
        if (isTyping) {
          if (!currentTypingUsers.includes(fromUsername)) {
            return {
              ...prev,
              [groupId]: [...currentTypingUsers, fromUsername]
            };
          }
        } else {
          return {
            ...prev,
            [groupId]: currentTypingUsers.filter(u => u !== fromUsername)
          };
        }
        return prev;
      });
    });

    // Handle user online status updates
    socket.on("user_online", (data) => {
      setContactsOnlineStatus(prev => ({
        ...prev,
        [data.username]: { isOnline: true, lastSeen: new Date() }
      }));
    });

    // Handle user offline status updates
    socket.on("user_offline", (data) => {
      setContactsOnlineStatus(prev => ({
        ...prev,
        [data.username]: { isOnline: false, lastSeen: data.lastSeen }
      }));
    });

    // Handle call accepted
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    });

    // Handle call blocked
    socket.on("call_blocked", (data) => {
      alert(data.message || "Cannot call this user");
      setCallEnded(true);
    });

    // Handle message blocked
    socket.on("message_blocked", (data) => {
      alert(data.message || "Cannot send message to this user");
    });

    // Handle incoming group message
    socket.on("receive_group_message", (data) => {
      console.log('📥 Received group message:', data);
      const currentUsername = localStorage.getItem('username');

      setGroupMessages(prev => ({
        ...prev,
        [data.groupId]: [...(prev[data.groupId] || []), {
          ...data,
          starred: (data.starredBy && data.starredBy.includes(currentUsername)) || false,
          starredBy: data.starredBy || []
        }]
      }));

      // Show notification if not in this group chat
      if (selectedChat !== `group_${data.groupId}`) {
        // Could add unread count for groups here
        console.log(`New message in group ${data.groupId}`);
      }
    });

    // Handle new group created - add to groups list
    socket.on("group_created", (group) => {
      console.log('📥 Received new group:', group);
      setGroups(prev => {
        // Avoid duplicates
        if (prev.find(g => g._id === group._id)) {
          return prev;
        }
        return [...prev, group];
      });
    });

    // Handle group updates
    socket.on("group_updated", (updatedGroup) => {
      console.log('📥 Received group update:', updatedGroup);
      setGroups(prev => prev.map(g =>
        g._id === updatedGroup._id ? updatedGroup : g
      ));
      // Update editingGroup if this group's settings modal is open
      if (editingGroupRef.current && editingGroupRef.current._id === updatedGroup._id) {
        setEditingGroup(updatedGroup);
      }
    });

    // Handle group deletion
    socket.on("group_deleted", (data) => {
      const { groupId, groupName } = data;
      setGroups(prev => prev.filter(g => g._id !== groupId));
      setGroupMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[groupId];
        return newMessages;
      });
      // Close chat if open
      setSelectedChat(prev => prev === `group_${groupId}` ? null : prev);
      // Close settings modal if open for this group
      setShowGroupSettings(prev => {
        if (prev && editingGroupRef.current && editingGroupRef.current._id === groupId) {
          return false;
        }
        return prev;
      });
      setEditingGroup(prev => {
        if (prev && prev._id === groupId) {
          return null;
        }
        return prev;
      });
      console.log('📥 Received group deletion:', data);
    });

    socket.on("message_saved", (data) => {
      const currentUsername = localStorage.getItem('username');
      setChats(prev => {
        const chatKey = data.toUsername;
        const chatMessages = prev[chatKey] || [];
        const updated = chatMessages.map(msg =>
          msg.clientId === data.clientId ? {
            ...msg,
            _id: data._id,
            replyTo: data.replyTo,
            starred: (data.starredBy && data.starredBy.includes(currentUsername)) || false,
            starredBy: data.starredBy || []
          } : msg
        );
        return { ...prev, [chatKey]: updated };
      });
    });

    socket.on("group_message_saved", (data) => {
      const currentUsername = localStorage.getItem('username');
      setGroupMessages(prev => {
        const groupMsgs = prev[data.groupId] || [];
        const updated = groupMsgs.map(msg =>
          msg.clientId === data.clientId ? {
            ...msg,
            _id: data._id,
            replyTo: data.replyTo,
            starred: (data.starredBy && data.starredBy.includes(currentUsername)) || false,
            starredBy: data.starredBy || []
          } : msg
        );
        return { ...prev, [data.groupId]: updated };
      });
    });

    // New features socket listeners
    // Message reaction updates
    socket.on("message_reaction", (data) => {
      const { messageId, reactions } = data;
      setChats(prev => {
        const updated = { ...prev };
        for (const chatKey in updated) {
          updated[chatKey] = updated[chatKey].map(msg =>
            msg._id === messageId ? { ...msg, reactions } : msg
          );
        }
        return updated;
      });
    });

    socket.on("group_message_reaction", (data) => {
      const { messageId, groupId, reactions } = data;
      setGroupMessages(prev => ({
        ...prev,
        [groupId]: prev[groupId]?.map(msg =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ) || []
      }));
    });

    // Message edit updates
    socket.on("message_edited", (data) => {
      const { messageId, text, edited, editedAt } = data;
      setChats(prev => {
        const updated = { ...prev };
        for (const chatKey in updated) {
          updated[chatKey] = updated[chatKey].map(msg =>
            msg._id === messageId ? { ...msg, text, edited, editedAt } : msg
          );
        }
        return updated;
      });
    });

    socket.on("group_message_edited", (data) => {
      const { messageId, groupId, text, edited, editedAt } = data;
      setGroupMessages(prev => ({
        ...prev,
        [groupId]: prev[groupId]?.map(msg =>
          msg._id === messageId ? { ...msg, text, edited, editedAt } : msg
        ) || []
      }));
    });

    // Message pin updates
    socket.on("message_pinned", (data) => {
      const { messageId, pinned, pinnedBy } = data;
      setChats(prev => {
        const updated = { ...prev };
        for (const chatKey in updated) {
          updated[chatKey] = updated[chatKey].map(msg =>
            msg._id === messageId ? { ...msg, pinned, pinnedBy, pinnedAt: pinned ? new Date() : null } : msg
          );
        }
        return updated;
      });
    });

    // Group message pin updates
    socket.on("group_message_pinned", (data) => {
      const { messageId, groupId, pinned, pinnedBy } = data;
      setGroupMessages(prev => ({
        ...prev,
        [groupId]: prev[groupId]?.map(msg =>
          msg._id === messageId ? { ...msg, pinned, pinnedBy, pinnedAt: pinned ? new Date() : null } : msg
        ) || []
      }));
    });

    // Fetch user settings
    fetchUserSettings();
    fetchBlockedContacts();
    fetchStatuses();
    loadGroups();
  };

  // Cleanup socket listeners
  const cleanupSocket = () => {
    if (socketRef.current) {
      socketRef.current.off("me");
      socketRef.current.off("receive_message");
      socketRef.current.off("incomingCall");
      socketRef.current.off("callAccepted");
      socketRef.current.off("callEnded");
      socketRef.current.off("message_deleted");
      socketRef.current.off("user_online");
      socketRef.current.off("user_offline");
      socketRef.current.off("call_blocked");
      socketRef.current.off("message_blocked");
      socketRef.current.off("connect");
      socketRef.current.off("disconnect");
      socketRef.current.off("connect_error");
      socketRef.current.off("message_delivered");
      socketRef.current.off("message_read_receipt");
      socketRef.current.off("receive_group_message");
      socketRef.current.off("group_user_typing");
      socketRef.current.off("user_typing");
      socketRef.current.off("message_saved");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats, selectedChat]);

  // Fetch online status when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchContactOnlineStatus(selectedChat);
    }
  }, [selectedChat]);

  // Load chat history from database when a chat is selected
  useEffect(() => {
    if (selectedChat && localStorage.getItem('token')) {
      loadChatHistory(selectedChat);
      fetchChatTheme();
    }
  }, [selectedChat]);

  // Check for existing token on load and load data
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    console.log('Checking auth - Token exists:', !!token, 'Username:', savedUsername);
    if (token) {
      setIsLoggedIn(true);
      initializeApp();
      // Load contacts and recent chats from API (will update localStorage)
      console.log('Loading data after token check');
      loadContacts();
      loadRecentChats();
      loadUnreadCounts();
      loadCallHistory();
      loadStarredMessages();
    }

    return () => {
      cleanupSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save chats to localStorage whenever they change - use user-specific key for privacy
  useEffect(() => {
    // Always save chats, even if empty object
    if (chats) {
      const currentUser = localStorage.getItem('username');
      if (currentUser) {
        localStorage.setItem(`chats_${currentUser}`, JSON.stringify(chats));
        console.log('💾 Saved chats to localStorage for user', currentUser, ':', Object.keys(chats).length, 'conversations');
      }
    }
  }, [chats]);

  // Save contacts to localStorage whenever they change - use user-specific key for privacy
  useEffect(() => {
    if (contacts) {
      const currentUser = localStorage.getItem('username');
      if (currentUser) {
        localStorage.setItem(`contacts_${currentUser}`, JSON.stringify(contacts));
        console.log('💾 Saved contacts to localStorage for user', currentUser, ':', contacts.length, 'contacts');
      }
    }
  }, [contacts]);

  // Save recentChats to localStorage whenever they change - use user-specific key for privacy
  useEffect(() => {
    if (recentChats) {
      const currentUser = localStorage.getItem('username');
      if (currentUser) {
        localStorage.setItem(`recentChats_${currentUser}`, JSON.stringify(recentChats));
        console.log('💾 Saved recentChats to localStorage for user', currentUser, ':', recentChats.length, 'chats');
      }
    }
  }, [recentChats]);

  // Wallpaper is now stored in database, no need for localStorage sync
  // The wallpaper is fetched from database via fetchUserSettings() on login

  // Save about to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('about', about);
  }, [about]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Only close menus if clicking outside of a menu element
      const target = e.target;
      const isContextMenuClick = target.closest('.context-menu');

      if (contextMenu.show && !isContextMenuClick) {
        setContextMenu({ show: false, x: 0, y: 0, message: null, messageIndex: null });
      }
      if (chatOptionsMenu.show && !isContextMenuClick) {
        setChatOptionsMenu({ show: false, x: 0, y: 0, userId: null });
      }
      if (groupOptionsMenu.show && !isContextMenuClick) {
        setGroupOptionsMenu({ show: false, x: 0, y: 0, groupId: null, groupName: null });
      }
    };

    // Handle Escape key to dismiss modals
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        setReceivingCall(false);
        setCaller('');
        setShowSettings(false);
        setShowSearch(false);
        setShowStarredMessages(false);
        setShowBroadcasts(false);
        setShowCreateGroup(false);
        setShowGroupSettings(false);
        setShowFileUpload(false);
        setShowGifPicker(false);
        setShowStickerPicker(false);
        setShowAllMessages(false);
        setShowGroupDetails(false);
        setViewingUserProfile(null);
        setContextMenu({ show: false, x: 0, y: 0, message: null, messageIndex: null });
        setChatOptionsMenu({ show: false, x: 0, y: 0, userId: null });
        setGroupOptionsMenu({ show: false, x: 0, y: 0, groupId: null, groupName: null });
      }
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [contextMenu.show, chatOptionsMenu.show, groupOptionsMenu.show]);

  // Auth functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setError('');
    console.log('Attempting login with:', username);
    try {
      const res = await axios.post(`${API_URL}/api/login`, { username, password });
      console.log('Login success:', res.data);

      // Clear any previous user's data from state before setting new user
      setChats({});
      setContacts([]);
      setRecentChats([]);
      setSelectedChat(null);

      // Reset all modal states to prevent stuck overlays
      setReceivingCall(false);
      setCaller('');
      setShowSettings(false);
      setShowSearch(false);
      setShowStarredMessages(false);
      setShowBroadcasts(false);
      setShowCreateGroup(false);
      setShowGroupSettings(false);
      setShowFileUpload(false);
      setShowGifPicker(false);
      setShowStickerPicker(false);
      setShowAllMessages(false);
      setShowGroupDetails(false);
      setViewingUserProfile(null);
      setContextMenu({ show: false, x: 0, y: 0, message: null, messageIndex: null });
      setChatOptionsMenu({ show: false, x: 0, y: 0, userId: null });
      setGroupOptionsMenu({ show: false, x: 0, y: 0, groupId: null, groupName: null });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      setIsLoggedIn(true);
      // Initialize app (creates socket connection and registers user)
      initializeApp();
      // Load contacts and recent chats after login
      loadContacts();
      loadRecentChats();
      loadCallHistory();
      loadStarredMessages();
    } catch (err) {
      console.log('Login error:', err);
      console.log('Error response:', err.response?.data);
      console.log('Error status:', err.response?.status);

      let errorMessage = 'Login failed. ';

      if (!err.response) {
        errorMessage += 'Cannot connect to server. Make sure backend is running on port 5000.';
      } else if (err.response.status === 401) {
        errorMessage += 'Invalid username or password.';
      } else if (err.response.status === 500) {
        errorMessage += 'Server error: ' + (err.response.data?.error || 'Unknown error');
      } else {
        errorMessage += err.response?.data?.message || 'Unknown error occurred.';
      }

      setError(errorMessage);
      setPassword('');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/register`, {
        username,
        password,
        email: registerEmail,
        phoneNumber: registerPhone
      });
      console.log('Registration successful for:', username);
      setIsRegistering(false);
      setUsername('');
      setPassword('');
      setRegisterEmail('');
      setRegisterPhone('');
      // Show success message and stay on register page
      alert('✅ Account created successfully!\n\nNow please sign in with your new credentials.');
    } catch (err) {
      console.log('Registration error:', err.response?.data);
      setError(err.response?.data?.message || 'Registration failed. Username may already be taken.');
      setPassword('');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    // Keep user-specific data in localStorage for next login
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    window.location.reload();
  };

  // Password Reset Functions
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/request-password-reset`, {
        identifier: resetIdentifier
      });
      setResetUsername(res.data.username);
      setResetStep(2);
      setResetSuccess(`Verification code sent! (Demo code: ${res.data.demoCode})`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/verify-reset-code`, {
        username: resetUsername,
        code: resetCode
      });
      setResetStep(3);
      setResetSuccess('Code verified! Please enter your new password.');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsAuthLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setIsAuthLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/reset-password`, {
        username: resetUsername,
        code: resetCode,
        newPassword
      });
      setResetSuccess('Password reset successfully! You can now login.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetStep(1);
        setResetIdentifier('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const resetForgotPasswordState = () => {
    setShowForgotPassword(false);
    setResetStep(1);
    setResetIdentifier('');
    setResetUsername('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setResetSuccess('');
  };

  // Fetch user settings
  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/user-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWallpaper(res.data.wallpaper || 'default');
      setUserEmail(res.data.email || '');
      setUserPhone(res.data.phoneNumber || res.data.phone || '');
      setDisplayName(res.data.displayName || '');
      setAbout(res.data.about || 'Hey there! I am using WhatsApp-Lite');
      setProfilePicture(res.data.profilePicture || '');
      setPrivacySettings(res.data.privacySettings || {
        lastSeen: 'everyone',
        profilePhoto: 'everyone',
        about: 'everyone',
        status: 'everyone',
        readReceipts: true
      });
      // Also fetch notification settings
      try {
        const notifRes = await axios.get(`${API_URL}/api/notifications/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotificationSettings(notifRes.data);
      } catch (err) {
        console.error('Error fetching notification settings:', err);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Fetch blocked contacts
  const fetchBlockedContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/blocked-contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedContacts(res.data || []);
    } catch (err) {
      console.error('Error fetching blocked contacts:', err);
    }
  };

  // Fetch statuses (stories)
  const fetchStatuses = async () => {
    try {
      console.log('Fetching statuses...');
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Statuses fetched:', res.data);
      setStatuses(res.data || []);
    } catch (err) {
      console.error('Error fetching statuses:', err);
    }
  };

  // Create a new status
  const createStatus = async (type, data) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('type', type);

      if (type === 'text') {
        formData.append('text', data.text);
        formData.append('backgroundColor', data.backgroundColor || '#25D366');
        formData.append('textColor', data.textColor || '#ffffff');
      } else if (data.file) {
        formData.append('file', data.file);
        if (data.caption) formData.append('caption', data.caption);
      }

      const res = await axios.post(`${API_URL}/api/status`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh statuses
      fetchStatuses();
      return res.data;
    } catch (err) {
      console.error('Error creating status:', err);
      throw err;
    }
  };

  // View a status
  const viewStatus = async (statusId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/status/${statusId}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error viewing status:', err);
    }
  };

  // Delete a status
  const deleteStatus = async (statusId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/status/${statusId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStatuses();
    } catch (err) {
      console.error('Error deleting status:', err);
    }
  };

  // Toggle Notification Setting
  const toggleNotificationSetting = async (setting, value) => {
    try {
      const newSettings = { ...notificationSettings, [setting]: value };
      setNotificationSettings(newSettings); // Optimistic UI update

      // Handle push manager unsubscription if push is turned off
      if (setting === 'pushEnabled' && !value) {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            // Optionally tell backend to delete subscription
            await axios.post(`${API_URL}/api/notifications/subscribe`, null, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
          }
        }
      }

      // If push is enabled, ask for permission and subscribe
      if (setting === 'pushEnabled' && value) {
        await subscribeUserToPush();
      }

      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/notifications/settings`, { [setting]: value }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error updating notification setting:', err);
      // Revert on error
      setNotificationSettings({ ...notificationSettings, [setting]: !value });
    }
  };

  // Subscribe User to Web Push
  const subscribeUserToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Fetch VAPID public key from backend
      const vapidRes = await axios.get(`${API_URL}/api/notifications/vapidPublicKey`);
      const vapidPublicKey = vapidRes.data.publicKey;

      if (!vapidPublicKey) {
        console.warn('VAPID public key missing from backend');
        return;
      }

      // Convert VAPID key format
      const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      };

      const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);

      // Send to backend
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/notifications/subscribe`, pushSubscription, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Push subscription saved to backend');
    } catch (err) {
      console.error('❌ Failed to subscribe user to push', err);
    }
  };

  // Fetch viewers for a specific status
  const fetchStatusViewers = async (statusId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/status/${statusId}/viewers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentStatusViewers(res.data);
      setShowViewersList(true);
    } catch (err) {
      console.error("Error fetching status viewers:", err);
      // Fallback to empty array just in case
      setCurrentStatusViewers([]);
    }
  };

  // Update wallpaper
  const updateWallpaper = async (newWallpaper) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/update-wallpaper`, { wallpaper: newWallpaper }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWallpaper(newWallpaper);
    } catch (err) {
      console.error('Error updating wallpaper:', err);
      // Fallback update
      setWallpaper(newWallpaper);
    }
  };

  // Fetch contact's online status
  const fetchContactOnlineStatus = async (contactUsername) => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.get(`${API_URL}/api/user-public-profile/${contactUsername}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContactsOnlineStatus(prev => ({
        ...prev,
        [contactUsername]: {
          isOnline: res.data.isOnline,
          lastSeen: res.data.lastSeen
        }
      }));
    } catch (err) {
      console.error('Error fetching contact status:', err);
    }
  };

  // Load chat history from database
  const loadChatHistory = async (otherUsername) => {
    // If it's a group chat, load group messages instead
    if (otherUsername.startsWith('group_')) {
      const groupId = otherUsername.replace('group_', '');
      loadGroupMessages(groupId);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/messages/${otherUsername}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.length > 0) {
        const currentUsername = localStorage.getItem('username');
        setChats(prev => ({
          ...prev,
          [otherUsername]: res.data.map(msg => ({
            from: msg.from,
            fromUsername: msg.fromUsername,
            _id: msg._id,
            toUsername: msg.toUsername,
            text: msg.text,
            type: msg.type,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            timestamp: new Date(msg.timestamp),
            deletedForEveryone: msg.deletedForEveryone,
            // Include all new feature fields
            starred: (msg.starredBy && msg.starredBy.includes(currentUsername)) || false,
            starredBy: msg.starredBy || [],
            replyTo: msg.replyTo || null,
            reactions: msg.reactions || [],
            edited: msg.edited || false,
            editedAt: msg.editedAt || null,
            pinned: msg.pinned || false,
            pinnedAt: msg.pinnedAt || null,
            pinnedBy: msg.pinnedBy || null,
            read: msg.read || false,
            audioDuration: msg.audioDuration || null
          }))
        }));
        console.log(`✅ Loaded ${res.data.length} messages from ${otherUsername}`);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  // Chat functions
  const sendMessage = (msgText = message, msgType = 'text', fileUrl = null, fileName = null) => {
    if ((!msgText.trim() && msgType === 'text') || !selectedChat) return;

    // If selected chat is a group, use sendGroupMessage instead
    if (selectedChat.startsWith('group_')) {
      sendGroupMessage(msgText, msgType, fileUrl, fileName);
      return;
    }

    const currentUsername = localStorage.getItem('username');
    const timestamp = new Date();
    const clientId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    const msgData = {
      toUsername: selectedChat,
      fromUsername: currentUsername,
      from: currentUsername,
      text: msgText,
      type: msgType,
      fileUrl,
      fileName,
      timestamp,
      clientId,
      sent: true, // Message is sent (single tick)
      replyTo: replyToMessage ? { _id: replyToMessage._id, text: replyToMessage.text, fromUsername: replyToMessage.fromUsername } : null
    };

    console.log('📤 Sending message:', msgText, 'to:', selectedChat, 'from:', currentUsername);

    if (socketRef.current) {
      socketRef.current.emit("send_message", msgData);
    }
    setChats(prev => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), msgData]
    }));
    setMessage("");
    setShowFileUpload(false);
    setSelectedFile(null);
    setFilePreview(null);
    setShowEmojiPicker(false);
    setReplyToMessage(null);
  };

  // File upload handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/upload-file`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const msgType = res.data.fileType === 'image' ? 'image' : 'file';
      if (selectedChat.startsWith('group_')) {
        sendGroupMessage(selectedFile.name, msgType, res.data.fileUrl, res.data.fileName);
      } else {
        sendMessage(selectedFile.name, msgType, res.data.fileUrl, res.data.fileName);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  // GIF search (using Giphy API - free tier)
  const searchGifs = async (query) => {
    if (!query.trim()) {
      setGifs([]);
      return;
    }

    try {
      // Using Giphy's public beta API
      const res = await axios.get(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${query}&limit=20&rating=g`);
      setGifs(res.data.data);
    } catch (err) {
      console.error('Error searching GIFs:', err);
    }
  };

  const sendGif = (gifUrl) => {
    if (selectedChat.startsWith('group_')) {
      sendGroupMessage('GIF', 'image', gifUrl, 'gif');
    } else {
      sendMessage('GIF', 'image', gifUrl, 'gif');
    }
    setShowGifPicker(false);
    setGifSearch('');
    setGifs([]);
  };

  // Emoji picker handler
  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  // ===== NEW FEATURES FUNCTIONS =====

  // 1. Fetch Group Details (for Group Info modal)
  const fetchGroupDetails = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroupDetails(res.data);
      setShowGroupDetails(true);
      console.log('✅ Group details loaded:', res.data);
    } catch (err) {
      console.error('❌ Error fetching group details:', err.response?.data || err.message);
      alert('Failed to load group details');
    }
  };

  // 2. Fetch All Messages (for export)
  const fetchAllMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/all-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllMessages(res.data || []);
      setShowAllMessages(true);
      console.log('✅ All messages loaded:', res.data?.length || 0);
    } catch (err) {
      console.error('❌ Error fetching all messages:', err.response?.data || err.message);
      alert('Failed to load messages');
    }
  };

  // 1. Message Reactions
  const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const addReaction = async (messageId, emoji) => {
    try {
      const token = localStorage.getItem('token');
      const isGroup = selectedChat?.startsWith('group_');
      const endpoint = isGroup
        ? `${API_URL}/api/group-message/${messageId}/reaction`
        : `${API_URL}/api/message/${messageId}/reaction`;

      await axios.post(endpoint, { emoji }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowReactionPicker(null);
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  // 2. Voice Message Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      voiceRecorderRef.current = mediaRecorder;
      voiceChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        voiceChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting voice recording:', err);
      if (err.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings to record voice messages.');
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Could not access microphone. Please check your microphone connection and browser permissions.');
      }
    }
  };

  const stopVoiceRecording = () => {
    if (voiceRecorderRef.current && isRecording) {
      voiceRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelVoiceRecording = () => {
    if (voiceRecorderRef.current && isRecording) {
      voiceRecorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(null);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');

      const res = await axios.post(`${API_URL}/api/upload-audio`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const { fileUrl } = res.data;

      if (selectedChat.startsWith('group_')) {
        sendGroupMessage('', 'audio', fileUrl, 'voice-message.webm');
      } else {
        sendMessage('', 'audio', fileUrl, 'voice-message.webm');
      }

      setAudioBlob(null);
      setRecordingTime(0);
    } catch (err) {
      console.error('Error sending voice message:', err);
    }
  };

  // 3. Message Editing
  const startEditingMessage = (msg) => {
    setEditingMessage(msg._id);
    setEditText(msg.text);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const saveEditedMessage = async () => {
    if (!editText.trim() || !editingMessage) return;

    try {
      const token = localStorage.getItem('token');
      const isGroup = selectedChat?.startsWith('group_');
      const endpoint = isGroup
        ? `${API_URL}/api/group-message/${editingMessage}/edit`
        : `${API_URL}/api/message/${editingMessage}/edit`;

      await axios.put(endpoint, { text: editText }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      if (isGroup) {
        setGroupMessages(prev => ({
          ...prev,
          [selectedChat.replace('group_', '')]: prev[selectedChat.replace('group_', '')].map(m =>
            m._id === editingMessage ? { ...m, text: editText, edited: true, editedAt: new Date() } : m
          )
        }));
      } else {
        setChats(prev => ({
          ...prev,
          [selectedChat]: prev[selectedChat].map(m =>
            m._id === editingMessage ? { ...m, text: editText, edited: true, editedAt: new Date() } : m
          )
        }));
      }

      setEditingMessage(null);
      setEditText('');
    } catch (err) {
      console.error('Error editing message:', err);
      alert(err.response?.data?.message || 'Failed to edit message');
    }
  };

  // 4. Message Pinning
  const togglePinMessage = async (messageId, isGroupOverride = null) => {
    try {
      const token = localStorage.getItem('token');
      // Use override if provided (e.g. from Pinned Messages modal), otherwise use current chat context
      const isGroup = isGroupOverride !== null ? isGroupOverride : (selectedChat?.startsWith('group_'));

      if (isGroup) {
        // Group message pinning
        const groupId = (isGroupOverride !== null && typeof selectedChat !== 'string' && !selectedChat?.startsWith('group_'))
          ? null // If we don't have a correct groupId context, we'll try to find it or refresh everything
          : selectedChat?.replace('group_', '');

        await axios.post(`${API_URL}/api/group-message/${messageId}/pin`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Update local state - check all groups if no specific groupId
        setGroupMessages(prev => {
          const updated = { ...prev };
          for (const gid in updated) {
            updated[gid] = updated[gid].map(m =>
              m._id === messageId ? { ...m, pinned: !m.pinned } : m
            );
          }
          return updated;
        });
      } else {
        // Individual message pinning
        await axios.post(`${API_URL}/api/message/${messageId}/pin`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Update local state - check all chats
        setChats(prev => {
          const updated = { ...prev };
          for (const chatKey in updated) {
            updated[chatKey] = updated[chatKey].map(m =>
              m._id === messageId ? { ...m, pinned: !m.pinned } : m
            );
          }
          return updated;
        });
      }

      // Refresh pinned messages if the modal is open
      if (showPinnedMessages) {
        fetchPinnedMessages();
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  const fetchPinnedMessages = async () => {
    if (!selectedChat || selectedChat.startsWith('group_')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/messages/pinned/${selectedChat}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPinnedMessages(res.data);
      setShowPinnedMessages(true);
    } catch (err) {
      console.error('Error fetching pinned messages:', err);
    }
  };

  // 5. Chat Themes
  const setChatWallpaper = async (wallpaper, bubbleColor) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/chat/theme`, {
        chatWith: selectedChat,
        wallpaper,
        bubbleColor,
        isGroup: selectedChat?.startsWith('group_')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChatTheme({ wallpaper, bubbleColor });
      setShowThemePicker(false);
    } catch (err) {
      console.error('Error setting theme:', err);
    }
  };

  const fetchChatTheme = async () => {
    if (!selectedChat) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/chat/theme/${selectedChat}?isGroup=${selectedChat?.startsWith('group_')}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatTheme(res.data);
    } catch (err) {
      console.error('Error fetching theme:', err);
    }
  };

  // 6. Message Scheduling
  const scheduleMessage = async () => {
    if (!message.trim() || !scheduledTime) return;

    try {
      const token = localStorage.getItem('token');
      const isGroup = selectedChat?.startsWith('group_');

      if (isGroup) {
        // For group messages, just send immediately with scheduled flag
        // (backend would need more work for true group scheduling)
        alert('Group message scheduling is not yet fully implemented. Message will be sent now.');
        setShowScheduleModal(false);
        setScheduledTime('');
        // Send as regular group message
        const groupId = selectedChat.replace('group_', '');
        const currentUsername = localStorage.getItem('username');

        if (socketRef.current) {
          socketRef.current.emit("send_group_message", {
            groupId,
            fromUsername: currentUsername,
            text: message,
            type: 'text'
          });
        }
        setMessage('');
      } else {
        await axios.post(`${API_URL}/api/message/schedule`, {
          toUsername: selectedChat,
          text: message,
          scheduledFor: scheduledTime
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMessage('');
        setScheduledTime('');
        setShowScheduleModal(false);
        fetchScheduledMessages();
        alert('Message scheduled successfully!');
      }
    } catch (err) {
      console.error('Error scheduling message:', err);
    }
  };

  const fetchScheduledMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/messages/scheduled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduledMessages(res.data);
    } catch (err) {
      console.error('Error fetching scheduled messages:', err);
    }
  };

  const cancelScheduledMessage = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/message/scheduled/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchScheduledMessages();
    } catch (err) {
      console.error('Error cancelling scheduled message:', err);
    }
  };

  // 7. Disappearing Messages
  const setDisappearingMessages = async (duration) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/chat/disappearing`, {
        chatWith: selectedChat,
        duration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDisappearingDuration(duration);
      setDisappearingEnabled(duration > 0);
    } catch (err) {
      console.error('Error setting disappearing messages:', err);
    }
  };

  // Sticker packs - using Giphy stickers
  const searchStickers = async (query) => {
    if (!query.trim()) {
      setGifs([]);
      return;
    }

    try {
      // Using Giphy's stickers API
      const res = await axios.get(`https://api.giphy.com/v1/stickers/search?api_key=dc6zaTOxFJmzC&q=${query}&limit=20&rating=g`);
      setGifs(res.data.data);
    } catch (err) {
      console.error('Error searching stickers:', err);
    }
  };

  const sendSticker = (stickerUrl) => {
    if (selectedChat.startsWith('group_')) {
      sendGroupMessage('', 'sticker', stickerUrl, 'sticker');
    } else {
      sendMessage('Sticker', 'sticker', stickerUrl, 'sticker');
    }
    setShowStickerPicker(false);
    setGifSearch('');
    setGifs([]);
  };

  // Message context menu handlers
  const handleContextMenu = (e, msg, index) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      message: msg,
      messageIndex: index
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, message: null, messageIndex: null });
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(text);
    setTimeout(() => setCopiedMessage(''), 2000);
    closeContextMenu();
  };

  const deleteMessageForMe = async (msg, index) => {
    try {
      // Check if it's a group message
      if (selectedChat?.startsWith('group_')) {
        const groupId = selectedChat.replace('group_', '');
        setGroupMessages(prev => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter((_, i) => i !== index)
        }));
      } else {
        // Individual chat deletion
        setChats(prev => ({
          ...prev,
          [selectedChat]: prev[selectedChat].filter((_, i) => i !== index)
        }));
      }
      closeContextMenu();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const deleteMessageForEveryone = async (msg, index) => {
    try {
      const currentUsername = localStorage.getItem('username');
      // Only allow if message is from current user
      if (msg.fromUsername !== currentUsername && msg.from !== me) {
        alert('You can only delete your own messages for everyone');
        return;
      }

      // Check if it's a group message
      if (selectedChat?.startsWith('group_')) {
        const groupId = selectedChat.replace('group_', '');
        const messageId = msg._id;

        // Delete from database
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/api/groups/${groupId}/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Remove from local state
        setGroupMessages(prev => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter(m => m._id !== messageId)
        }));

        // Notify other group members via socket
        if (socketRef.current) {
          socketRef.current.emit("delete_group_message", {
            groupId,
            messageId
          });
        }
      } else {
        // Individual chat deletion
        if (msg._id) {
          try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/messages/${msg._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setChats(prev => ({
              ...prev,
              [selectedChat]: prev[selectedChat].map((m, i) =>
                i === index ? { ...m, deletedForEveryone: true } : m
              )
            }));

            // Notify other user via socket
            socketRef.current.emit("delete_message", { to: selectedChat, from: currentUsername, messageIndex: index });
          } catch (err) {
            console.error('Error deleting message for everyone:', err);
            alert('Failed to delete message for everyone');
          }
        } else {
          // Message does not have an ID yet (maybe still sending)
          alert('Cannot delete this message yet. Please wait a moment.');
          closeContextMenu();
          return;
        }
      }
      closeContextMenu();
    } catch (err) {
      console.error('Error deleting message for everyone:', err);
    }
  };

  // Start Recording function - defined before callUser
  const startRecording = useCallback((s) => {
    if (!s) return;
    mediaRecorderRef.current = new MediaRecorder(s);
    mediaRecorderRef.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'video/webm' });
      chunks.current = [];
      const formData = new FormData();
      formData.append('video', blob);
      formData.append('caller', me);
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/api/save-call`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error saving call:', error);
      }
    };
    mediaRecorderRef.current.start();
  }, [me]);

  // Video/Voice call functions
  const callUser = useCallback(async (targetUsername, type) => {
    setCallType(type);
    setCallEnded(false);
    const currentUsername = localStorage.getItem('username');

    // Get fresh media stream
    let currentStream = stream;
    if (!currentStream) {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video',
          audio: true
        });
        setStream(currentStream);
        if (myVideo.current) myVideo.current.srcObject = currentStream;
      } catch (err) {
        console.error('Error getting media stream:', err);
        alert('Could not access camera/microphone. Please check permissions.');
        return;
      }
    }

    // Create peer with ICE servers
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream,
      config: { iceServers: ICE_SERVERS }
    });

    peer.on("signal", (data) => {
      socketRef.current.emit("callUser", {
        userToCall: targetUsername,
        signalData: data,
        from: currentUsername,
        callType: type
      });
    });

    peer.on("stream", (remoteStream) => {
      if (type === 'video' && userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.on("error", (err) => {
      console.error('Peer connection error:', err);
      alert('Connection error. Please try again.');
      setCallEnded(true);
    });

    connectionRef.current = peer;
    startRecording(currentStream);
  }, [stream, startRecording]);

  const answerCall = useCallback(() => {
    setCallAccepted(true);
    setCallEnded(false);

    // Get fresh media stream if not available
    const getStream = async () => {
      let currentStream = stream;
      if (!currentStream) {
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({
            video: callType === 'video',
            audio: true
          });
          setStream(currentStream);
          if (myVideo.current) myVideo.current.srcObject = currentStream;
        } catch (err) {
          console.error('Error getting media stream:', err);
          alert('Could not access camera/microphone. Please check permissions.');
          return null;
        }
      }
      return currentStream;
    };

    getStream().then(currentStream => {
      if (!currentStream) return;

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream,
        config: { iceServers: ICE_SERVERS }
      });

      peer.on("signal", (data) => {
        socketRef.current.emit("answerCall", { signal: data, to: caller });
      });

      peer.on("stream", (remoteStream) => {
        if (callType === 'video' && userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });

      peer.on("error", (err) => {
        console.error('Peer connection error:', err);
        alert('Connection error. Please try again.');
        setCallEnded(true);
      });

      if (callerSignal) {
        peer.signal(callerSignal);
      }

      connectionRef.current = peer;
      startRecording(currentStream);
    });
  }, [stream, callType, caller, callerSignal, startRecording]);

  const leaveCall = () => {
    setCallEnded(true);
    setCallAccepted(false);
    setReceivingCall(false);

    if (connectionRef.current) {
      connectionRef.current.destroy();
      connectionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Notify the other user that call ended
    socketRef.current.emit("callEnded", {});

    // Reset video elements
    if (userVideo.current) userVideo.current.srcObject = null;
  };

  // History functions
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/call-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCallHistory(res.data);
      setView('history');
    } catch (err) {
      console.error("Could not fetch history", err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLog = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/call-logs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCallHistory(callHistory.filter(log => log._id !== id));
      alert("Log removed!");
    } catch (err) {
      console.error("Failed to delete log", err);
    }
  };

  // Load all contacts (users)
  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Loading contacts, token:', !!token);
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Contacts loaded:', res.data.length, res.data);
      setContacts(res.data || []);
    } catch (err) {
      console.error("❌ Could not fetch contacts", err.response?.data || err.message);
    }
  };

  // Load recent chats
  const loadRecentChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentUsername = localStorage.getItem('username');
      console.log('🔄 Loading recent chats for:', currentUsername);

      const res = await axios.get(`${API_URL}/api/recent-chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Recent chats API response:', res.data);
      console.log('📊 Number of recent chats:', res.data?.length || 0);

      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setRecentChats(res.data);
        console.log('✅ Set recent chats state:', res.data.map(u => u.username));

        // Load chat history for each recent chat
        for (const user of res.data) {
          console.log(`📥 Loading chat history for ${user.username}`);
          await loadChatHistory(user.username);
        }
      } else {
        console.log('⚠️ No recent chats found');
        setRecentChats([]);
      }
    } catch (err) {
      console.error("❌ Error fetching recent chats:", err.response?.data || err.message);
      setRecentChats([]);
    }
  };

  // Load unread message counts
  const loadUnreadCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/unread-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCounts(res.data);
      console.log('✅ Unread counts loaded:', res.data);
    } catch (err) {
      console.error("❌ Error fetching unread counts:", err.response?.data || err.message);
    }
  };

  // Load call history
  const loadCallHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/call-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCallHistory(res.data);
      console.log('✅ Call history loaded:', res.data.length);
    } catch (err) {
      console.error("❌ Could not fetch call history", err);
    }
  };

  const loadStarredMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentUsername = localStorage.getItem('username');
      const res = await axios.get(`${API_URL}/api/messages/starred`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Process results to include starred status for current user
      const processedResults = (res.data || []).map(msg => ({
        ...msg,
        starred: (msg.starredBy && msg.starredBy.includes(currentUsername)) || false,
        starredBy: msg.starredBy || []
      }));
      setStarredMessages(processedResults);
      console.log('✅ Starred messages loaded:', processedResults.length);
    } catch (err) {
      console.error("❌ Could not fetch starred messages", err);
    }
  };

  // ===== GROUP CHAT FUNCTIONS =====

  // Load user's groups
  const loadGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove duplicates by _id
      const uniqueGroups = (res.data || []).reduce((acc, group) => {
        if (!acc.find(g => g._id === group._id)) {
          acc.push(group);
        }
        return acc;
      }, []);
      setGroups(uniqueGroups);
      console.log('✅ Groups loaded:', uniqueGroups.length);

      // Load group messages for each group
      for (const group of uniqueGroups) {
        await loadGroupMessages(group._id);
      }
    } catch (err) {
      console.error("❌ Error fetching groups:", err.response?.data || err.message);
    }
  };

  // Create a new group
  const createGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    if (selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const currentUsername = localStorage.getItem('username');

      const res = await axios.post(`${API_URL}/api/groups/create`, {
        name: newGroupName,
        description: newGroupDescription,
        profilePicture: newGroupProfilePicture,
        createdBy: currentUsername,
        members: [currentUsername, ...selectedMembers]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Group created:', res.data.group);
      setGroups(prev => {
        // Avoid duplicates
        if (prev.find(g => g._id === res.data.group._id)) {
          return prev;
        }
        return [...prev, res.data.group];
      });
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupProfilePicture('');
      setSelectedMembers([]);
      alert('Group created successfully!');
    } catch (err) {
      console.error("❌ Error creating group:", err.response?.data || err.message);
      alert('Failed to create group: ' + (err.response?.data?.message || err.message));
    }
  };

  // Load group messages
  const loadGroupMessages = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      const currentUsername = localStorage.getItem('username');
      const res = await axios.get(`${API_URL}/api/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroupMessages(prev => ({
        ...prev,
        [groupId]: (res.data || []).map(msg => ({
          ...msg,
          starred: (msg.starredBy && msg.starredBy.includes(currentUsername)) || false,
          starredBy: msg.starredBy || []
        }))
      }));
      console.log(`✅ Loaded ${res.data?.length || 0} messages for group ${groupId}`);
    } catch (err) {
      console.error("❌ Error loading group messages:", err.response?.data || err.message);
    }
  };

  // Send group message
  const sendGroupMessage = (msgText = message, msgType = 'text', fileUrl = null, fileName = null) => {
    // For stickers and images, msgText can be empty
    if (!selectedChat || !selectedChat.startsWith('group_')) return;
    if (msgType === 'text' && !msgText.trim()) return;

    const groupId = selectedChat.replace('group_', '');
    const currentUsername = localStorage.getItem('username');
    const timestamp = new Date();
    const clientId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);

    const msgData = {
      groupId,
      fromUsername: currentUsername,
      text: msgText || '',
      type: msgType,
      fileUrl,
      fileName,
      timestamp,
      clientId
    };

    console.log('📤 Sending group message:', msgType, 'to group:', groupId, 'from:', currentUsername);

    // Stop typing indicator when message is sent
    if (socketRef.current) {
      socketRef.current.emit("group_user_typing", {
        groupId,
        fromUsername: currentUsername,
        isTyping: false
      });
      // Emit to socket for real-time
      socketRef.current.emit("send_group_message", msgData);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Add to local state
    setGroupMessages(prev => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), { ...msgData, _id: Date.now().toString() }]
    }));

    setMessage("");
    setShowFileUpload(false);
    setSelectedFile(null);
    setFilePreview(null);
    setShowEmojiPicker(false);
    setShowStickerPicker(false);
  };

  // Leave group
  const leaveGroup = async (groupId) => {
    const confirmed = window.confirm('Are you sure you want to leave this group?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/groups/${groupId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroups(prev => prev.filter(g => g._id !== groupId));
      setGroupMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[groupId];
        return newMessages;
      });

      if (selectedChat === `group_${groupId}`) {
        setSelectedChat(null);
      }

      // Close group settings modal if it's open for this group
      if (showGroupSettings && editingGroup && editingGroup._id === groupId) {
        setShowGroupSettings(false);
        setEditingGroup(null);
      }

      alert('You have left the group');
    } catch (err) {
      console.error("❌ Error leaving group:", err.response?.data || err.message);
      alert('Failed to leave group: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete group (admin only)
  const deleteGroup = async (groupId) => {
    const confirmed = window.confirm('Are you sure you want to delete this group? This action cannot be undone and will remove all messages.');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroups(prev => prev.filter(g => g._id !== groupId));
      setGroupMessages(prev => {
        const newMessages = { ...prev };
        delete newMessages[groupId];
        return newMessages;
      });

      if (selectedChat === `group_${groupId}`) {
        setSelectedChat(null);
      }

      setShowGroupSettings(false);
      setEditingGroup(null);
      alert('Group deleted successfully');
    } catch (err) {
      console.error("❌ Error deleting group:", err.response?.data || err.message);
      alert('Failed to delete group: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fetch starred messages
  const fetchStarredMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentUsername = localStorage.getItem('username');
      const res = await axios.get(`${API_URL}/api/messages/starred`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Process results to include starred status for current user
      const processedResults = (res.data || []).map(msg => ({
        ...msg,
        starred: (msg.starredBy && msg.starredBy.includes(currentUsername)) || false,
        starredBy: msg.starredBy || []
      }));
      setStarredMessages(processedResults);
      if (!showStarredMessages) setShowStarredMessages(true);
    } catch (err) {
      console.error('Error fetching starred messages:', err);
    }
  };

  // Toggle star message
  const toggleStarMessage = async (messageId, isGroup = false) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isGroup
        ? `${API_URL}/api/group-message/${messageId}/star`
        : `${API_URL}/api/messages/${messageId}/star`;

      const res = await axios.put(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state for the message
      if (isGroup) {
        setGroupMessages(prev => {
          const updated = { ...prev };
          for (const groupId in updated) {
            updated[groupId] = updated[groupId].map(msg =>
              msg._id === messageId ? {
                ...msg,
                starred: res.data.starred,
                starredBy: res.data.starredBy
              } : msg
            );
          }
          return updated;
        });
      } else {
        setChats(prev => {
          const updated = { ...prev };
          for (const chatKey in updated) {
            updated[chatKey] = updated[chatKey].map(msg =>
              msg._id === messageId ? {
                ...msg,
                starred: res.data.starred,
                starredBy: res.data.starredBy
              } : msg
            );
          }
          return updated;
        });
      }

      // Refresh starred messages list
      fetchStarredMessages();
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  // Search messages
  const searchMessages = async (query) => {
    console.log("Searching messages for:", query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const currentUsername = localStorage.getItem('username');
      const res = await axios.get(`${API_URL}/api/messages/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Search API Response Data:", res.data);
      // Process results to include starred status for current user
      const processedResults = (res.data || []).map(msg => ({
        ...msg,
        starred: (msg.starredBy && msg.starredBy.includes(currentUsername)) || false,
        starredBy: msg.starredBy || []
      }));
      console.log("Processed Search Results:", processedResults);
      setSearchResults(processedResults);
    } catch (err) {
      console.error('Error searching messages:', err);
      setSearchResults([]);
      alert('Search failed. Please try again.');
    }
  };

  // Fetch broadcasts
  const fetchBroadcasts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/broadcasts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBroadcasts(res.data);
    } catch (err) {
      console.error('Error fetching broadcasts:', err);
    }
  };

  // Create broadcast
  const createBroadcast = async (name, recipients) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/broadcasts/create`,
        { name, recipients },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBroadcasts();
      return res.data.broadcast;
    } catch (err) {
      console.error('Error creating broadcast:', err);
      throw err;
    }
  };

  // Delete broadcast
  const deleteBroadcast = async (broadcastId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/broadcasts/${broadcastId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBroadcasts();
    } catch (err) {
      console.error('Error deleting broadcast:', err);
    }
  };

  // Send broadcast message
  const sendBroadcast = async (broadcastId, text) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/broadcasts/${broadcastId}/send`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Broadcast sent!');
    } catch (err) {
      console.error('Error sending broadcast:', err);
      alert('Failed to send broadcast');
    }
  };

  // Add member to group
  const addMemberToGroup = async (groupId, username) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/groups/${groupId}/add-member`,
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update group in state
      setGroups(prev => prev.map(g =>
        g._id === groupId ? res.data.group : g
      ));

      alert(`${username} added to group`);
    } catch (err) {
      console.error("❌ Error adding member:", err.response?.data || err.message);
      alert('Failed to add member: ' + (err.response?.data?.message || err.message));
    }
  };

  // Remove member from group
  const removeMemberFromGroup = async (groupId, username) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/groups/${groupId}/remove-member`,
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update group in state
      setGroups(prev => prev.map(g =>
        g._id === groupId ? res.data.group : g
      ));

      alert(`${username} removed from group`);
    } catch (err) {
      console.error("❌ Error removing member:", err.response?.data || err.message);
      alert('Failed to remove member: ' + (err.response?.data?.message || err.message));
    }
  };

  // Update group settings
  const updateGroupSettings = async (groupId, settings) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/groups/${groupId}/settings`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update group in state
      setGroups(prev => prev.map(g =>
        g._id === groupId ? res.data.group : g
      ));

      if (editingGroup) {
        setEditingGroup(res.data.group);
      }

      console.log('✅ Group settings updated');
      return res.data.group;
    } catch (err) {
      console.error("❌ Error updating group:", err.response?.data || err.message);
      alert('Failed to update group: ' + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  // Open group settings
  const openGroupSettings = (groupId) => {
    const group = groups.find(g => g._id === groupId);
    if (group) {
      setEditingGroup(group);
      setShowGroupSettings(true);
    }
  };

  // Fetch user profile details
  const fetchUserProfile = async (username) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/user-public-profile/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViewingUserProfile(res.data);
    } catch (err) {
      console.error("Could not fetch user profile", err);
    }
  };

  // Show Landing Page first
  if (showLandingPage) {
    return (
      <LandingPage
        onGetStarted={() => setShowLandingPage(false)}
        onLoginClick={() => { setShowLandingPage(false); setIsRegistering(false); }}
        isLoggedIn={isLoggedIn}
      />
    );
  }

  // Login/Register Screen
  if (!isLoggedIn) {
    // Forgot Password Flow
    if (showForgotPassword) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
          {/* Back to Home Button */}
          <button
            onClick={() => { setShowForgotPassword(false); setShowLandingPage(true); }}
            className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-[#202c33]/80 hover:bg-[#2a3942] text-[#aebac1] hover:text-[#111b21] dark:text-white transition-colors"
          >
            <ArrowLeft size={18} /> Back to Home
          </button>

          {/* 3D Animated Background */}
          <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }} dpr={[1, 2]} performance={{ min: 0.5 }}>
              <ambientLight intensity={0.5} />
              <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                {/* Same sphere for Forgot Password */}
                <CircleMesh color="#f59e0b" />
              </Float>
              {/* Circle Particles - same as login */}
              <CircleParticles color="#f59e0b" count={600} />
              <Sparkles count={150} scale={15} size={2} speed={0.4} color="#f59e0b" />
            </Canvas>
          </div>

          {/* Animated Grid Background */}
          <div className="animated-grid absolute inset-0 z-0" />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-[#202c33]/90 backdrop-blur-xl p-5 sm:p-8 rounded-2xl w-full max-w-[95%] sm:max-w-md border border-gray-300 dark:border-gray-700/50 shadow-2xl relative z-10"
          >
            <h1 className="text-2xl font-bold text-[#111b21] dark:text-white mb-6 text-center gradient-text">
              <MessageSquare className="inline mr-2" size={28} />
              WhatsApp Lite
            </h1>

            {/* Step 1: Enter Email/Phone/Username */}
            {resetStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-[#f59e0b] text-center mb-6 font-medium text-lg">
                  🔐 Forgot Password?
                </h2>
                <p className="text-[#54656f] dark:text-gray-400 text-sm text-center mb-4">
                  Enter your username, email, or phone number to receive a verification code.
                </p>
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Username, Email, or Phone"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      className="w-full bg-[#2a3942]/80 backdrop-blur-sm p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-700/50 focus:border-[#f59e0b] transition-all"
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {resetSuccess && <p className="text-green-500 text-sm">{resetSuccess}</p>}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] p-3 rounded-lg text-black font-semibold transition-colors disabled:opacity-50 glow-button"
                  >
                    {isAuthLoading ? 'Sending...' : 'Send Verification Code'}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Enter Verification Code */}
            {resetStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-[#f59e0b] text-center mb-6 font-medium text-lg">
                  📧 Enter Verification Code
                </h2>
                <p className="text-[#54656f] dark:text-gray-400 text-sm text-center mb-4">
                  We sent a code to verify your identity. Please enter it below.
                </p>
                <p className="text-green-500 text-sm text-center mb-4">
                  Account: {resetUsername}
                </p>
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-[#2a3942]/80 backdrop-blur-sm p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-700/50 focus:border-[#f59e0b] transition-all text-center text-2xl tracking-widest"
                      maxLength="6"
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {resetSuccess && <p className="text-green-500 text-sm">{resetSuccess}</p>}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isAuthLoading || resetCode.length !== 6}
                    className="w-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] p-3 rounded-lg text-black font-semibold transition-colors disabled:opacity-50 glow-button"
                  >
                    {isAuthLoading ? 'Verifying...' : 'Verify Code'}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* Step 3: Set New Password */}
            {resetStep === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-[#f59e0b] text-center mb-6 font-medium text-lg">
                  🔒 Set New Password
                </h2>
                <p className="text-[#54656f] dark:text-gray-400 text-sm text-center mb-4">
                  Create a new password for your account.
                </p>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#2a3942]/80 backdrop-blur-sm p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-700/50 focus:border-[#f59e0b] transition-all"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#2a3942]/80 backdrop-blur-sm p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-700/50 focus:border-[#f59e0b] transition-all"
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {resetSuccess && <p className="text-green-500 text-sm">{resetSuccess}</p>}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] p-3 rounded-lg text-black font-semibold transition-colors disabled:opacity-50 glow-button"
                  >
                    {isAuthLoading ? 'Resetting...' : 'Reset Password'}
                  </motion.button>
                </form>
              </motion.div>
            )}

            <p className="text-center mt-6 text-[#54656f] dark:text-gray-400 text-sm">
              Remember your password?{' '}
              <button
                onClick={resetForgotPasswordState}
                className="text-[#f59e0b] hover:underline"
              >
                Back to Login
              </button>
            </p>
          </motion.div>
        </div>
      );
    }

    // Regular Login/Register Screen
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
        {/* Back to Home Button */}
        <button
          onClick={() => setShowLandingPage(true)}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-[#202c33]/80 hover:bg-[#2a3942] text-[#aebac1] hover:text-[#111b21] dark:text-white transition-colors"
        >
          <ArrowLeft size={18} /> Back to Home
        </button>

        {/* 3D Animated Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }} dpr={[1, 2]} performance={{ min: 0.5 }}>
            <ambientLight intensity={0.5} />
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              {isRegistering ? (
                // Same sphere for Register
                <CircleMesh color="#8b5cf6" />
              ) : (
                // Circle for Login
                <CircleMesh color="#00a884" />
              )}
            </Float>
            {/* Shape-specific Particles - All use circle animation */}
            {isRegistering ? (
              <CircleParticles color="#8b5cf6" count={600} />
            ) : (
              <CircleParticles color="#00a884" count={600} />
            )}
            <Sparkles count={150} scale={15} size={2} speed={0.4} color={isRegistering ? "#8b5cf6" : "#00a884"} />
          </Canvas>
        </div>

        {/* Animated Grid Background */}
        <div className="animated-grid absolute inset-0 z-0" />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[#202c33]/90 backdrop-blur-xl p-5 sm:p-8 rounded-2xl w-full max-w-[95%] sm:max-w-md border border-gray-300 dark:border-gray-700/50 shadow-2xl relative z-10"
        >
          <h1 className="text-2xl font-bold text-[#111b21] dark:text-white mb-6 text-center gradient-text">
            <MessageSquare className="inline mr-2" size={28} />
            WhatsApp Lite
          </h1>
          <h2 className="text-[#aebac1] text-center mb-6 font-medium">
            {isRegistering ? '📝 Create a new account' : '🔐 Welcome back! Please sign in'}
          </h2>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#2a3942]/80 backdrop-blur-sm p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-700/50 focus:border-green-500 transition-all"
                required
              />
            </div>
            {isRegistering && (
              <>
                <div>
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full bg-[#2a3942]/80 backdrop-blur-sm p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-700/50 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number (optional)"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    className="w-full bg-[#2a3942]/80 backdrop-blur-sm p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-700/50 focus:border-green-500 transition-all"
                  />
                </div>
              </>
            )}
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#2a3942]/80 backdrop-blur-sm p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-700/50 focus:border-green-500 transition-all"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isAuthLoading}
              className={`w-full p-3 rounded-lg text-[#111b21] dark:text-white font-semibold transition-colors disabled:opacity-50 glow-button ${isRegistering ? 'bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]' : 'bg-[#00a884] hover:bg-[#008f72]'}`}
            >
              {isAuthLoading ? 'Please wait...' : (isRegistering ? 'Sign Up' : 'Sign In')}
            </motion.button>
          </form>

          {!isRegistering && (
            <p className="text-center mt-3 text-[#54656f] dark:text-gray-400 text-sm">
              <button
                onClick={() => { setShowForgotPassword(true); setError(''); }}
                className="text-green-500 hover:underline"
              >
                Forgot Password?
              </button>
            </p>
          )}

          <p className="text-center mt-4 text-[#54656f] dark:text-gray-400 text-sm">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-green-500 hover:underline"
            >
              {isRegistering ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  // Get chat list (unique users from chats + recent chats from DB)
  const chatList = [...new Map([
    ...Object.keys(chats).map(userId => ({ userId, lastMessage: chats[userId][chats[userId].length - 1]?.text || '', lastTime: chats[userId][chats[userId].length - 1]?.timestamp })),
    ...recentChats.map(user => ({ userId: user.username, lastMessage: '', lastTime: null, fromDb: true }))
  ].map(item => [item.userId, item])).values()];

  // Main App - WhatsApp Style Layout
  return (
    <div className="flex h-screen bg-[#f0f2f5] dark:bg-[#0b141a] overflow-hidden">
      {/* Left Sidebar - Chat List */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[400px] lg:w-[420px] flex-col bg-[#111b21] border-r border-gray-300 dark:border-gray-800/50`}>
        {/* Header */}
        <div className="px-4 py-3 bg-[#202c33] flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Back Button - Shows when there's history */}
            {navigationHistory.length > 0 && (
              <button
                className="p-2 rounded-full hover:bg-[#374248] transition-colors group mr-1"
                onClick={goBack}
                title="Go Back"
              >
                <ArrowLeft className="text-[#aebac1] group-hover:text-[#111b21] dark:text-white transition-colors" size={20} />
              </button>
            )}
            <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer flex-shrink-0 relative ring-2 ring-transparent hover:ring-green-500/50 transition-all" onClick={() => setShowSettings(true)}>
              {profilePicture ? (
                <>
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 items-center justify-center bg-green-600 hidden">
                    <User className="text-[#111b21] dark:text-white" size={20} />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-green-600">
                  <User className="text-[#111b21] dark:text-white" size={20} />
                </div>
              )}
            </div>
          </div>

          {/* Action Icons - Clean Grouped Layout */}
          <div className="flex items-center gap-1">
            {/* Large screens: Show all icons directly */}
            <div className="hidden md:flex items-center gap-1">
              <button
                className="p-2 rounded-full hover:bg-[#374248] transition-colors group"
                onClick={() => { setShowLandingPage(true); setCurrentView('landing'); }}
                title="Explore App Features"
              >
                <Compass className="text-[#aebac1] group-hover:text-violet-400 transition-colors" size={20} />
              </button>
              <button
                className="p-2 rounded-full hover:bg-[#374248] transition-colors group"
                onClick={() => { setShowSearch(true); setSearchQuery(''); setSearchResults([]); }}
                title="Search Messages"
              >
                <Search className="text-[#aebac1] group-hover:text-[#111b21] dark:text-white transition-colors" size={20} />
              </button>
              <button
                className="p-2 rounded-full hover:bg-[#374248] transition-colors group"
                onClick={fetchStarredMessages}
                title="Starred Messages"
              >
                <Star className="text-[#aebac1] group-hover:text-yellow-400 transition-colors" size={20} />
              </button>
              <button
                className="p-2 rounded-full hover:bg-[#374248] transition-colors group"
                onClick={fetchPinnedMessages}
                title="Pinned Messages"
              >
                <Pin className="text-[#aebac1] group-hover:text-yellow-400 transition-colors" size={20} />
              </button>
              <button
                className="p-2 rounded-full hover:bg-[#374248] transition-colors group relative z-50 pointer-events-auto"
                onClick={(e) => { e.stopPropagation(); setShowThemePicker(true); }}
                title="Chat Theme"
              >
                <Palette className="text-[#aebac1] group-hover:text-purple-400 transition-colors" size={20} />
              </button>
              <button
                className="p-2 rounded-full hover:bg-[#374248] transition-colors group"
                onClick={() => { fetchBroadcasts(); setShowBroadcasts(true); }}
                title="Broadcast Lists"
              >
                <Users className="text-[#aebac1] group-hover:text-[#111b21] dark:text-white transition-colors" size={20} />
              </button>
              <button
                className="p-2 rounded-full hover:bg-[#374248] transition-colors group"
                onClick={fetchHistory}
                title="Chat History"
              >
                <History className="text-[#aebac1] group-hover:text-[#111b21] dark:text-white transition-colors" size={20} />
              </button>
            </div>
            {/* Small screens: Hamburger menu with all features */}
            <div className="relative md:hidden">
              <button
                className="p-2 rounded-full hover:bg-[#374248] transition-colors group"
                onClick={() => setShowChatOptionsMenu(!showChatOptionsMenu)}
                title="Menu"
              >
                {/* 3-line Hamburger Icon */}
                <svg
                  className="text-[#aebac1] group-hover:text-[#111b21] dark:text-white transition-colors"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              {showChatOptionsMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#202c33] rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 py-1 z-50 min-w-[180px]">
                  <button
                    className="w-full px-4 py-2 text-left text-violet-300 hover:bg-[#374248] flex items-center gap-2"
                    onClick={() => { setShowLandingPage(true); setCurrentView('landing'); setShowChatOptionsMenu(false); }}
                  >
                    <Compass size={16} /> Explore Actions
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-[#374248] flex items-center gap-2"
                    onClick={() => { setShowSearch(true); setSearchQuery(''); setSearchResults([]); setShowChatOptionsMenu(false); }}
                  >
                    <Search size={16} /> Search Messages
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-[#374248] flex items-center gap-2"
                    onClick={() => { fetchStarredMessages(); setShowChatOptionsMenu(false); }}
                  >
                    <Star size={16} /> Starred Messages
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-[#374248] flex items-center gap-2"
                    onClick={() => { fetchPinnedMessages(); setShowChatOptionsMenu(false); }}
                  >
                    <Pin size={16} /> Pinned Messages
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-[#374248] flex items-center gap-2"
                    onClick={() => { setShowThemePicker(true); setShowChatOptionsMenu(false); }}
                  >
                    <Palette size={16} /> Chat Theme
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-[#374248] flex items-center gap-2"
                    onClick={() => { fetchBroadcasts(); setShowBroadcasts(true); setShowChatOptionsMenu(false); }}
                  >
                    <Users size={16} /> Broadcast Lists
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-[#374248] flex items-center gap-2"
                    onClick={() => { fetchHistory(); setShowChatOptionsMenu(false); }}
                  >
                    <History size={16} /> Chat History
                  </button>
                </div>
              )}
            </div>
            <button
              className="p-2 rounded-full hover:bg-[#374248] transition-colors group"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <Settings className="text-[#aebac1] group-hover:text-[#111b21] dark:text-white transition-colors" size={20} />
            </button>
            <button
              className="p-2 rounded-full hover:bg-red-500/20 transition-colors group"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="text-[#aebac1] group-hover:text-red-400 transition-colors" size={20} />
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div className="px-4 py-3 bg-[#111b21] flex-shrink-0 border-b border-gray-300 dark:border-gray-800/30">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {/* My Status */}
            {(() => {
              const myStatuses = statuses.find(s => s.username === localStorage.getItem('username'));
              const hasStatuses = myStatuses && myStatuses.statuses && myStatuses.statuses.length > 0;

              return (
                <div
                  className="flex flex-col items-center cursor-pointer flex-shrink-0 group"
                  onClick={() => {
                    if (hasStatuses) {
                      setCurrentStatusUser(myStatuses);
                      setCurrentStatusIndex(0);
                      setShowStatusViewer(true);
                    } else {
                      setShowStatusCreator(true);
                    }
                  }}
                >
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full ${hasStatuses ? 'p-[3px] bg-gradient-to-tr from-green-400 to-green-600' : 'bg-[#2a3942]'} flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105`}>
                      <div className={`w-full h-full ${hasStatuses ? 'bg-[#111b21] rounded-full p-[2px]' : ''} flex items-center justify-center overflow-hidden`}>
                        {profilePicture ? (
                          <img
                            src={profilePicture}
                            alt="My Status"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="text-[#54656f] dark:text-gray-400" size={24} />
                        )}
                      </div>
                    </div>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#111b21] shadow-lg hover:bg-green-400 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatusCreator(true);
                      }}
                    >
                      <Plus className="text-[#111b21] dark:text-white w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[#8696a0] text-[11px] mt-1.5 font-medium">My Status</span>
                </div>
              );
            })()}

            {/* Other Users' Statuses */}
            {statuses.filter(s => s.username !== localStorage.getItem('username')).map((statusUser) => (
              <div
                key={statusUser.username}
                className="flex flex-col items-center cursor-pointer flex-shrink-0 group"
                onClick={() => {
                  setCurrentStatusUser(statusUser);
                  setCurrentStatusIndex(0);
                  setShowStatusViewer(true);
                  if (statusUser.statuses[0]) {
                    viewStatus(statusUser.statuses[0]._id);
                  }
                }}
              >
                <div className="w-14 h-14 rounded-full p-[3px] bg-gradient-to-tr from-green-400 to-green-600 transition-transform group-hover:scale-105">
                  <div className="w-full h-full bg-[#111b21] rounded-full p-[2px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#2a3942] flex items-center justify-center">
                      {statusUser.profilePicture ? (
                        <img src={statusUser.profilePicture} alt={statusUser.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-[#54656f] dark:text-gray-400" size={20} />
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[#8696a0] text-[11px] mt-1.5 font-medium max-w-[60px] truncate">{statusUser.displayName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 py-2 bg-[#111b21] relative flex-shrink-0">
          <div className="bg-[#202c33] rounded-lg px-4 py-2.5 flex items-center gap-3">
            <Search className="text-[#8696a0]" size={18} />
            <input
              className="bg-transparent outline-none text-[#111b21] dark:text-white placeholder-[#8696a0] flex-1 text-sm"
              placeholder="Search or start new chat"
              value={idToCall}
              onChange={(e) => { setIdToCall(e.target.value); setSearchUserNotFound(false); }}
            />
            {idToCall && !selectedChat && (
              <button
                onClick={async () => {
                  // Check if user exists in contacts first
                  const existingContact = contacts.find(c => c.username.toLowerCase() === idToCall.toLowerCase());
                  if (existingContact) {
                    setSelectedChat(existingContact.username);
                    setChats(prev => ({ ...prev, [existingContact.username]: prev[existingContact.username] || [] }));
                    setIdToCall('');
                    return;
                  }

                  // Check if user exists in database
                  setIsCheckingUser(true);
                  try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`${API_URL}/api/check-user/${idToCall}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.data.exists) {
                      setSelectedChat(idToCall);
                      setChats(prev => ({ ...prev, [idToCall]: prev[idToCall] || [] }));
                      setIdToCall('');
                    } else {
                      setSearchUserNotFound(true);
                    }
                  } catch (err) {
                    console.error('Error checking user:', err);
                    setSearchUserNotFound(true);
                  } finally {
                    setIsCheckingUser(false);
                  }
                }}
                disabled={isCheckingUser}
                className="text-[#00a884] text-sm hover:underline flex-shrink-0 font-medium disabled:opacity-50"
              >
                {isCheckingUser ? 'Checking...' : 'Start Chat'}
              </button>
            )}
          </div>
          {/* User Not Found Message */}
          {searchUserNotFound && (
            <div className="absolute left-3 right-3 bg-[#233138] rounded-lg shadow-xl z-50 mt-1 border border-gray-300 dark:border-gray-700/50 p-4 text-center">
              <p className="text-red-400 text-sm">User not found</p>
              <p className="text-[#54656f] dark:text-gray-400 text-xs mt-1">This username is not registered on WhatsApp-Lite</p>
            </div>
          )}
          {/* Contacts Dropdown */}
          {idToCall.length > 0 && contacts.length > 0 && !searchUserNotFound && (
            <div className="absolute left-3 right-3 bg-[#233138] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto mt-1 border border-gray-300 dark:border-gray-700/50">
              {contacts.filter(c => c.username.toLowerCase().includes(idToCall.toLowerCase())).map(contact => (
                <div
                  key={contact.username}
                  className="px-3 py-2.5 hover:bg-[#182229] cursor-pointer flex items-center gap-3 border-b border-gray-300 dark:border-gray-700/30 last:border-0"
                >
                  <div
                    className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center text-[#111b21] dark:text-white font-medium overflow-hidden flex-shrink-0"
                    onClick={() => {
                      setSelectedChat(contact.username);
                      setChats(prev => ({ ...prev, [contact.username]: prev[contact.username] || [] }));
                      setIdToCall('');
                    }}
                  >
                    {contact.profilePicture ? (
                      <>
                        <img
                          src={contact.profilePicture}
                          alt={contact.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full items-center justify-center hidden bg-[#00a884]">
                          <span className="text-[#111b21] dark:text-white font-medium">{(contact.username || '?').charAt(0).toUpperCase()}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[#111b21] dark:text-white font-medium">{(contact.username || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => {
                      setSelectedChat(contact.username);
                      setChats(prev => ({ ...prev, [contact.username]: prev[contact.username] || [] }));
                      setIdToCall('');
                    }}
                  >
                    <p className="text-[#e9edef] font-medium text-sm">{contact.username}</p>
                    <p className="text-[#8696a0] text-xs truncate">{contact.about || 'Hey there! I am using WhatsApp'}</p>
                  </div>
                  <button
                    onClick={() => fetchUserProfile(contact.username)}
                    className="p-2 hover:bg-[#374248] rounded-full flex-shrink-0 transition-colors"
                    title="View Profile"
                  >
                    <Info size={18} className="text-[#8696a0]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto w-full max-w-full">

          {/* Groups Section */}
          {groups.length > 0 && (
            <div className="bg-[#111b21]">
              <div className="px-4 py-2 text-[11px] text-[#8696a0] uppercase tracking-wider font-medium flex items-center gap-2">
                <Users size={12} />
                Your Groups ({groups.length})
              </div>
              {groups.map((group) => {
                const lastMessage = groupMessages[group._id]?.[groupMessages[group._id]?.length - 1];
                const isMuted = mutedGroups[group._id] || false;
                const isAdmin = group.admins?.includes(localStorage.getItem('username'));
                return (
                  <div
                    key={group._id}
                    className={`p-2 sm:p-3 hover:bg-[#2a3942] cursor-pointer flex items-center gap-2 sm:gap-3 border-b border-gray-300 dark:border-gray-800 ${selectedChat === `group_${group._id}` ? 'bg-[#2a3942]' : ''
                      }`}
                    onClick={() => {
                      setSelectedChat(`group_${group._id}`);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setGroupOptionsMenu({
                        show: true,
                        x: Math.max(10, rect.left),
                        y: Math.max(10, rect.bottom),
                        groupId: group._id,
                        groupName: group.name
                      });
                    }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {group.profilePicture ? (
                        <img src={group.profilePicture} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="text-[#111b21] dark:text-white" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-[#111b21] dark:text-white font-medium text-sm sm:text-base truncate">{group.name} {isMuted && <BellOff size={12} className="inline text-[#54656f] dark:text-gray-400" />}</p>
                        {lastMessage?.timestamp && (
                          <span className="text-xs text-[#54656f] dark:text-gray-400 flex-shrink-0 ml-2">
                            {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm truncate">
                        {lastMessage
                          ? `${lastMessage.fromUsername}: ${lastMessage.text || 'Sent an attachment'}`
                          : group.description || `${group.members.length} members`
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {chatList.length === 0 ? (
            <div className="p-4 text-center text-[#54656f] dark:text-gray-400">
              <p className="text-sm sm:text-base">No chats yet.</p>
              <p className="text-xs sm:text-sm mt-2">Search for a contact above to start chatting.</p>
            </div>
          ) : (
            chatList.map((chat, index) => {
              const contactInfo = contacts.find(c => c.username === chat.userId);
              const unreadCount = unreadCounts[chat.userId] || 0;
              const isMuted = mutedChats[chat.userId] || false;
              const isBlocked = blockedContacts.some(b => b.username === chat.userId);
              return (
                <motion.div
                  key={chat.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3, layout: { type: 'spring', stiffness: 300, damping: 30 } }}
                  layoutId={`chat-${chat.userId}`}
                  className={`p-2 sm:p-3 flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-[#2a3942] ${selectedChat === chat.userId ? 'bg-[#2a3942]' : ''}`}
                >
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                    onClick={() => {
                      setSelectedChat(chat.userId);
                      // Clear unread count when opening chat
                      setUnreadCounts(prev => {
                        const newCounts = { ...prev };
                        delete newCounts[chat.userId];
                        return newCounts;
                      });
                      // Mark messages as read on server
                      const currentUsername = localStorage.getItem('username');
                      if (socketRef.current) {
                        socketRef.current.emit("message_read", {
                          fromUsername: chat.userId,
                          toUsername: currentUsername,
                          messageId: Date.now()
                        });
                      }
                    }}
                  >
                    {contactInfo?.profilePicture ? (
                      <>
                        <img
                          src={contactInfo.profilePicture}
                          alt={chat.userId}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full items-center justify-center hidden">
                          <User className="text-[#111b21] dark:text-white" size={20} />
                        </div>
                      </>
                    ) : (
                      <User className="text-[#111b21] dark:text-white" size={20} />
                    )}
                  </div>
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => {
                      setSelectedChat(chat.userId);
                      setUnreadCounts(prev => {
                        const newCounts = { ...prev };
                        delete newCounts[chat.userId];
                        return newCounts;
                      });
                      const currentUsername = localStorage.getItem('username');
                      if (socketRef.current) {
                        socketRef.current.emit("message_read", {
                          fromUsername: chat.userId,
                          toUsername: currentUsername,
                          messageId: Date.now()
                        });
                      }
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-[#111b21] dark:text-white font-medium text-sm sm:text-base truncate flex-1">{contactInfo?.displayName || chat.userId}</p>
                      <div className="flex items-center gap-1 sm:gap-2 flex-none ml-2 min-w-fit align-right">
                        {isMuted && <BellOff size={12} className="text-[#54656f] dark:text-gray-400" />}
                        {chat.lastTime && (
                          <span className={`text-xs ${unreadCount > 0 ? 'text-green-400 font-medium' : 'text-[#54656f] dark:text-gray-400'}`}>
                            {new Date(chat.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs sm:text-sm truncate ${unreadCount > 0 ? 'text-[#111b21] dark:text-white font-medium' : 'text-[#54656f] dark:text-gray-400'}`}>{chat.lastMessage}</p>
                  </div>
                  <button
                    className="p-1.5 hover:bg-[#3d4a51] rounded-full flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setChatOptionsMenu({
                        show: true,
                        x: Math.min(rect.left, window.innerWidth - 150),
                        y: Math.min(rect.bottom + 5, window.innerHeight - 200),
                        userId: chat.userId,
                        isBlocked,
                        isMuted
                      });
                    }}
                  >
                    <svg size={16} className="text-[#54656f] dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Options Menu */}
      {chatOptionsMenu.show && (
        <div
          className="fixed bg-[#202c33] rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 py-1 z-50 min-w-[140px]"
          style={{
            left: Math.min(chatOptionsMenu.x, window.innerWidth - 140),
            top: Math.min(chatOptionsMenu.y, window.innerHeight - 200)
          }}
        >
          <button
            onClick={() => {
              setMutedChats(prev => ({ ...prev, [chatOptionsMenu.userId]: !prev[chatOptionsMenu.userId] }));
              setChatOptionsMenu({ show: false, x: 0, y: 0, userId: null });
            }}
            className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
          >
            {chatOptionsMenu.isMuted ? <Bell size={14} /> : <BellOff size={14} />}
            {chatOptionsMenu.isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                if (chatOptionsMenu.isBlocked) {
                  await axios.post(`${API_URL}/api/unblock-contact`,
                    { contactId: chatOptionsMenu.userId },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                } else {
                  await axios.post(`${API_URL}/api/block-contact`,
                    { contactId: chatOptionsMenu.userId },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                }
                fetchBlockedContacts();
              } catch (err) {
                console.error('Error updating block status:', err);
              }
              setChatOptionsMenu({ show: false, x: 0, y: 0, userId: null });
            }}
            className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
          >
            {chatOptionsMenu.isBlocked ? <UserX size={14} /> : <Ban size={14} />}
            {chatOptionsMenu.isBlocked ? 'Unblock' : 'Block'}
          </button>
          <button
            onClick={() => {
              fetchPinnedMessages();
              setChatOptionsMenu({ show: false, x: 0, y: 0, userId: null });
            }}
            className="w-full px-3 py-2 text-left text-yellow-400 hover:bg-[#2a3942] flex items-center gap-2 text-sm"
          >
            <Pin size={14} />
            Pinned Messages
          </button>
          <div className="px-3 py-1">
            <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Clock size={12} /> Disappearing Messages</p>
            <select
              defaultValue="0"
              onChange={async (e) => {
                const duration = parseInt(e.target.value);
                try {
                  const token = localStorage.getItem('token');
                  await axios.post(`${API_URL}/api/disappearing-messages`, {
                    chatWith: chatOptionsMenu.userId,
                    duration
                  }, { headers: { Authorization: `Bearer ${token}` } });
                  setChatOptionsMenu({ show: false, x: 0, y: 0, userId: null });
                  alert(duration === 0 ? 'Disappearing messages turned off' : `Messages will disappear after ${e.target.options[e.target.selectedIndex].text}`);
                } catch (err) {
                  console.error('Error setting disappearing messages:', err);
                }
              }}
              className="w-full bg-[#2a3942] text-[#111b21] dark:text-white text-xs p-1.5 rounded outline-none"
            >
              <option value="0">Off</option>
              <option value="86400">24 hours</option>
              <option value="604800">7 days</option>
              <option value="7776000">90 days</option>
            </select>
          </div>
          <button
            onClick={async () => {
              // Clear chat messages but keep the chat entry
              const confirmed = window.confirm('Are you sure you want to clear all messages in this chat?');
              if (confirmed) {
                setChats(prev => ({
                  ...prev,
                  [chatOptionsMenu.userId]: []
                }));
                setUnreadCounts(prev => {
                  const newCounts = { ...prev };
                  delete newCounts[chatOptionsMenu.userId];
                  return newCounts;
                });
                // Clear messages from database
                try {
                  const token = localStorage.getItem('token');
                  await axios.delete(`${API_URL}/api/clear-chat/${chatOptionsMenu.userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                } catch (err) {
                  console.error('Error clearing chat:', err);
                }
              }
              setChatOptionsMenu({ show: false, x: 0, y: 0, userId: null });
            }}
            className="w-full px-3 py-2 text-left text-yellow-400 hover:bg-[#2a3942] flex items-center gap-2 text-sm"
          >
            <Trash2 size={14} />
            Clear chat
          </button>
          <button
            onClick={() => {
              // Delete chat from local state
              setChats(prev => {
                const newChats = { ...prev };
                delete newChats[chatOptionsMenu.userId];
                return newChats;
              });
              setRecentChats(prev => prev.filter(u => u.username !== chatOptionsMenu.userId));
              setUnreadCounts(prev => {
                const newCounts = { ...prev };
                delete newCounts[chatOptionsMenu.userId];
                return newCounts;
              });
              if (selectedChat === chatOptionsMenu.userId) {
                setSelectedChat(null);
              }
              setChatOptionsMenu({ show: false, x: 0, y: 0, userId: null });
            }}
            className="w-full px-3 py-2 text-left text-red-400 hover:bg-[#2a3942] flex items-center gap-2 text-sm"
          >
            <Trash2 size={14} />
            Delete chat
          </button>
        </div>
      )}

      {/* Group Options Menu */}
      {groupOptionsMenu.show && groups.find(g => g._id === groupOptionsMenu.groupId) && (() => {
        const group = groups.find(g => g._id === groupOptionsMenu.groupId);
        const isMuted = mutedGroups[groupOptionsMenu.groupId] || false;
        const isAdmin = group?.admins?.includes(localStorage.getItem('username'));
        return (
          <div
            className="fixed bg-[#202c33] rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 py-1 z-50 min-w-[150px]"
            style={{
              left: Math.min(groupOptionsMenu.x, window.innerWidth - 150),
              top: Math.min(groupOptionsMenu.y, window.innerHeight - 200)
            }}
          >
            <button
              onClick={() => {
                setMutedGroups(prev => ({ ...prev, [groupOptionsMenu.groupId]: !prev[groupOptionsMenu.groupId] }));
                setGroupOptionsMenu({ show: false, x: 0, y: 0, groupId: null, groupName: null });
              }}
              className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
            >
              {isMuted ? <Bell size={14} /> : <BellOff size={14} />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={async () => {
                if (!groupOptionsMenu.groupId) return;
                try {
                  const token = localStorage.getItem('token');
                  const res = await axios.get(`${API_URL}/api/group-messages/pinned/${groupOptionsMenu.groupId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  setPinnedMessages(res.data);
                  setShowPinnedMessages(true);
                } catch (err) {
                  console.error('Error fetching pinned messages:', err);
                }
                setGroupOptionsMenu({ show: false, x: 0, y: 0, groupId: null, groupName: null });
              }}
              className="w-full px-3 py-2 text-left text-yellow-400 hover:bg-[#2a3942] flex items-center gap-2 text-sm"
            >
              <Pin size={14} />
              Pinned Messages
            </button>
            <button
              onClick={async () => {
                const confirmed = window.confirm('Are you sure you want to clear all messages in this group?');
                if (confirmed) {
                  setGroupMessages(prev => ({
                    ...prev,
                    [groupOptionsMenu.groupId]: []
                  }));
                  // Clear messages from database
                  try {
                    const token = localStorage.getItem('token');
                    await axios.delete(`${API_URL}/api/groups/${groupOptionsMenu.groupId}/messages`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                  } catch (err) {
                    console.error('Error clearing group chat:', err);
                  }
                }
                setGroupOptionsMenu({ show: false, x: 0, y: 0, groupId: null, groupName: null });
              }}
              className="w-full px-3 py-2 text-left text-yellow-400 hover:bg-[#2a3942] flex items-center gap-2 text-sm"
            >
              <Trash2 size={14} />
              Clear chat
            </button>
            <button
              onClick={async () => {
                const confirmed = window.confirm('Are you sure you want to leave this group?');
                if (confirmed) {
                  await leaveGroup(groupOptionsMenu.groupId);
                }
                setGroupOptionsMenu({ show: false, x: 0, y: 0, groupId: null, groupName: null });
              }}
              className="w-full px-3 py-2 text-left text-red-400 hover:bg-[#2a3942] flex items-center gap-2 text-sm"
            >
              <LogOut size={14} />
              Leave group
            </button>
            {isAdmin && (
              <button
                onClick={async () => {
                  const confirmed = window.confirm('Are you sure you want to DELETE this group? This action cannot be undone and will remove all messages.');
                  if (confirmed) {
                    await deleteGroup(groupOptionsMenu.groupId);
                  }
                  setGroupOptionsMenu({ show: false, x: 0, y: 0, groupId: null, groupName: null });
                }}
                className="w-full px-3 py-2 text-left text-red-600 hover:bg-[#2a3942] flex items-center gap-2 text-sm"
              >
                <Trash2 size={14} />
                Delete group
              </button>
            )}
          </div>
        );
      })()}

      {/* Floating Action Button Menu */}
      <div className="fixed bottom-5 left-5 z-40">
        {/* FAB Menu Items */}
        <div className={`absolute bottom-14 left-0 transition-all duration-200 ${showFabMenu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="bg-[#233138] rounded-xl shadow-xl overflow-hidden border border-gray-300 dark:border-gray-700/50 min-w-[180px]">
            <button
              onClick={() => { setShowCreateGroup(true); setShowFabMenu(false); }}
              className="w-full px-3 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#e9edef] transition-colors"
            >
              <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center">
                <Users size={14} className="text-[#111b21] dark:text-white" />
              </div>
              <span className="text-sm">Create Group</span>
            </button>
          </div>
        </div>

        {/* Main FAB Button - Show only in chat list, hide in chat window */}
        {(!selectedChat) && (
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            className={`w-12 h-12 bg-[#00a884] hover:bg-[#008f72] rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${showFabMenu ? 'rotate-45' : ''}`}
          >
            <Plus size={20} className="text-[#111b21] dark:text-white" />
          </button>
        )}
      </div>

      {/* Right Side - Chat Window */}
      <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#0b141a]`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-2 sm:p-4 bg-[#202c33] flex justify-between items-center border-b border-gray-300 dark:border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <ArrowLeft
                  className="text-[#aebac1] cursor-pointer hover:text-[#111b21] dark:text-white flex-shrink-0"
                  size={22}
                  onClick={() => setSelectedChat(null)}
                />
                {/* Group Chat Header */}
                {selectedChat.startsWith('group_') ? (
                  <>
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden"
                      onClick={() => openGroupSettings(selectedChat.replace('group_', ''))}
                    >
                      {groups.find(g => g._id === selectedChat.replace('group_', ''))?.profilePicture ? (
                        <img
                          src={groups.find(g => g._id === selectedChat.replace('group_', '')).profilePicture}
                          alt="Group"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="text-[#111b21] dark:text-white" size={18} />
                      )}
                    </div>
                    <div
                      className="min-w-0 cursor-pointer"
                      onClick={() => openGroupSettings(selectedChat.replace('group_', ''))}
                    >
                      <p className="text-[#111b21] dark:text-white font-medium text-sm sm:text-base truncate">
                        {groups.find(g => g._id === selectedChat.replace('group_', ''))?.name || 'Group'}
                      </p>
                      <p className="text-xs text-[#54656f] dark:text-gray-400 truncate">
                        {(() => {
                          const groupId = selectedChat.replace('group_', '');
                          const typingUsers = groupTypingUsers[groupId] || [];
                          return typingUsers.length > 0 ? (
                            <span className="text-green-400">
                              {typingUsers.length === 1
                                ? `${typingUsers[0]} is typing...`
                                : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} others` : ''} typing...`
                              }
                            </span>
                          ) : (
                            `${groups.find(g => g._id === groupId)?.members?.length || 0} members`
                          );
                        })()}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center overflow-hidden cursor-pointer flex-shrink-0"
                      onClick={() => fetchUserProfile(selectedChat)}
                    >
                      {contacts.find(c => c.username === selectedChat)?.profilePicture ? (
                        <>
                          <img
                            src={contacts.find(c => c.username === selectedChat).profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full items-center justify-center hidden">
                            <User className="text-[#111b21] dark:text-white" size={18} />
                          </div>
                        </>
                      ) : (
                        <User className="text-[#111b21] dark:text-white" size={18} />
                      )}
                    </div>
                    <div
                      className="cursor-pointer min-w-0"
                      onClick={() => fetchUserProfile(selectedChat)}
                    >
                      <p className="text-[#111b21] dark:text-white font-medium text-sm sm:text-base truncate">
                        {contacts.find(c => c.username === selectedChat)?.displayName || selectedChat}
                      </p>
                      <p className="text-xs text-[#54656f] dark:text-gray-400 truncate">
                        {typingUsers[selectedChat] ? (
                          <span className="text-green-400">typing...</span>
                        ) : contactsOnlineStatus[selectedChat]?.isOnline ? (
                          <span className="text-green-400">Online</span>
                        ) : (
                          contactsOnlineStatus[selectedChat]?.lastSeen ? (
                            <span>Last seen {new Date(contactsOnlineStatus[selectedChat].lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          ) : 'Offline'
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Call Buttons - Separate for Voice and Video */}
              <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
                {!selectedChat.startsWith('group_') && (
                  <>
                    <button
                      onClick={() => fetchPinnedMessages()}
                      className="bg-gray-700/50 p-1.5 sm:p-2 rounded-full hover:bg-yellow-600 transition-all active:scale-95"
                      title="Pinned Messages"
                    >
                      <Pin size={16} className="text-[#111b21] dark:text-white sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => fetchUserProfile(selectedChat)}
                      className="bg-gray-700/50 p-1.5 sm:p-2 rounded-full hover:bg-gray-700 transition-all active:scale-95"
                      title="View Profile"
                    >
                      <Info size={16} className="text-[#111b21] dark:text-white sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => callUser(selectedChat, 'voice')}
                      className="bg-green-600 p-1.5 sm:p-2 rounded-full hover:bg-green-700 transition-all active:scale-95"
                      title="Voice Call"
                    >
                      <Phone size={16} className="text-[#111b21] dark:text-white sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => callUser(selectedChat, 'video')}
                      className="bg-green-600 p-1.5 sm:p-2 rounded-full hover:bg-green-700 transition-all active:scale-95"
                      title="Video Call"
                    >
                      <Video size={16} className="text-[#111b21] dark:text-white sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const isBlocked = blockedContacts.some(b => b.username === selectedChat);
                        const isMuted = mutedChats[selectedChat] || false;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setChatOptionsMenu({
                          show: !chatOptionsMenu.show,
                          x: Math.min(rect.left - 100, window.innerWidth - 150),
                          y: Math.min(rect.bottom + 5, window.innerHeight - 200),
                          userId: selectedChat,
                          isBlocked,
                          isMuted
                        });
                      }}
                      className="bg-gray-700/50 p-1.5 sm:p-2 rounded-full hover:bg-gray-700 transition-all active:scale-95"
                      title="More Options"
                    >
                      <MoreVertical size={16} className="text-[#111b21] dark:text-white sm:w-5 sm:h-5" />
                    </button>
                  </>
                )}
                {selectedChat.startsWith('group_') && (() => {
                  const groupId = selectedChat.replace('group_', '');
                  const group = groups.find(g => g._id === groupId);
                  const isMuted = mutedGroups[groupId] || false;
                  const isAdmin = group?.admins?.includes(localStorage.getItem('username'));
                  return (
                    <>
                      <button
                        onClick={() => {
                          setMutedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
                        }}
                        className={`p-1.5 sm:p-2 rounded-full transition ${isMuted ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <Bell size={16} className="text-[#111b21] dark:text-white sm:w-4.5 sm:h-4.5" /> : <BellOff size={16} className="text-[#111b21] dark:text-white sm:w-4.5 sm:h-4.5" />}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const res = await axios.get(`${API_URL}/api/group-messages/pinned/${groupId}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            setPinnedMessages(res.data);
                            setShowPinnedMessages(true);
                          } catch (err) {
                            console.error('Error fetching pinned messages:', err);
                          }
                        }}
                        className="bg-gray-600 p-1.5 sm:p-2 rounded-full hover:bg-yellow-600 transition"
                        title="Pinned Messages"
                      >
                        <Pin size={16} className="text-[#111b21] dark:text-white sm:w-4.5 sm:h-4.5" />
                      </button>
                      <button
                        onClick={() => fetchGroupDetails(groupId)}
                        className="bg-green-600 p-1.5 sm:p-2 rounded-full hover:bg-green-700 transition"
                        title="Group Info"
                      >
                        <Info size={16} className="text-[#111b21] dark:text-white sm:w-4.5 sm:h-4.5" />
                      </button>
                      <button
                        onClick={async () => {
                          const confirmed = window.confirm('Clear all messages in this group?');
                          if (confirmed) {
                            setGroupMessages(prev => ({ ...prev, [groupId]: [] }));
                            try {
                              const token = localStorage.getItem('token');
                              await axios.delete(`${API_URL}/api/groups/${groupId}/messages`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                            } catch (err) {
                              console.error('Error clearing chat:', err);
                            }
                          }
                        }}
                        className="bg-gray-600 p-1.5 sm:p-2 rounded-full hover:bg-gray-700 transition"
                        title="Clear Chat"
                      >
                        <Trash2 size={16} className="text-[#111b21] dark:text-white sm:w-4.5 sm:h-4.5" />
                      </button>
                      <button
                        onClick={() => leaveGroup(groupId)}
                        className="bg-red-600 p-1.5 sm:p-2 rounded-full hover:bg-red-700 transition"
                        title="Leave Group"
                      >
                        <LogOut size={16} className="text-[#111b21] dark:text-white sm:w-4.5 sm:h-4.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={async () => {
                            const confirmed = window.confirm('DELETE this group? This cannot be undone!');
                            if (confirmed) {
                              await deleteGroup(groupId);
                            }
                          }}
                          className="bg-red-800 p-1.5 sm:p-2 rounded-full hover:bg-red-900 transition"
                          title="Delete Group (Admin)"
                        >
                          <Trash2 size={16} className="text-[#111b21] dark:text-white sm:w-4.5 sm:h-4.5" />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Messages Area */}
            <div
              className={`flex-1 p-3 sm:p-5 overflow-y-auto relative ${WALLPAPERS[chatTheme.wallpaper] || WALLPAPERS[wallpaper] || WALLPAPERS.default}`}
              style={(!WALLPAPERS[chatTheme.wallpaper] && chatTheme.wallpaper && chatTheme.wallpaper !== 'default') ? {
                backgroundImage: `url(${chatTheme.wallpaper.startsWith('http') || chatTheme.wallpaper.startsWith('data:') ? chatTheme.wallpaper : `${API_URL}${chatTheme.wallpaper}`})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : (!WALLPAPERS[wallpaper] && wallpaper && wallpaper !== 'default') ? {
                backgroundImage: `url(${wallpaper.startsWith('http') || wallpaper.startsWith('data:') ? wallpaper : `${API_URL}${wallpaper}`})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
              onClick={() => { closeContextMenu(); setShowEmojiPicker(false); }}
            >
              {/* Group Messages */}
              {selectedChat.startsWith('group_') ? (
                groupMessages[selectedChat.replace('group_', '')]?.map((m, i) => {
                  const currentUsername = localStorage.getItem('username');
                  const isMyMessage = m.fromUsername === currentUsername;
                  return !m.deletedForEveryone && (
                    <div
                      key={m._id || i}
                      id={`msg-${m._id || i}`}
                      className={`mb-3 flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} max-w-[70%]`}>
                        {/* Sender Name (always show in group chats) */}
                        {!isMyMessage && (
                          <p className="text-xs text-green-400 mb-1 px-3 font-medium">{m.fromUsername || 'Unknown'}</p>
                        )}

                        <div
                          onContextMenu={(e) => handleContextMenu(e, m, i)}
                          className={`p-3 rounded-lg cursor-pointer break-words relative ${isMyMessage
                            ? "bg-green-600 text-white rounded-br-none"
                            : "bg-[#202c33] text-[#111b21] dark:text-white rounded-bl-none"
                            }`}
                        >
                          {/* Reply Quote — show original message that was replied to */}
                          {m.replyTo && (
                            <div className={`flex items-start rounded-lg p-2 mb-2 border-l-4 cursor-pointer ${isMyMessage
                              ? 'bg-green-700/50 border-green-300'
                              : 'bg-[#2a3942] border-green-500'
                              }`}
                              onClick={() => {
                                const el = document.getElementById(`msg-${m.replyTo._id || m.replyTo}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                            >
                              <div className="min-w-0">
                                <p className="text-green-400 text-xs font-semibold mb-0.5 truncate">
                                  {m.replyTo.fromUsername || 'Unknown'}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 text-xs truncate">
                                  {m.replyTo.type === 'image' ? '📷 Photo' : m.replyTo.type === 'file' ? '📎 File' : m.replyTo.type === 'sticker' ? '🎨 Sticker' : (m.replyTo.text || '')}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Forwarded Label */}
                          {m.forwarded && (
                            <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 17 20 12 15 7"></polyline>
                                <path d="M4 18v-2a4 4 0 0 1 4-4h12"></path>
                              </svg>
                              <span className="italic">Forwarded</span>
                            </div>
                          )}
                          {/* Image Message */}
                          {m.type === 'image' && m.fileUrl && (
                            <img
                              src={m.fileUrl}
                              alt="Shared"
                              className="max-w-full rounded mb-2 max-h-60 object-cover"
                            />
                          )}
                          {/* Sticker Message */}
                          {m.type === 'sticker' && m.fileUrl && (
                            <img
                              src={m.fileUrl}
                              alt="Sticker"
                              className="max-w-[120px] rounded"
                            />
                          )}
                          {/* File Message */}
                          {m.type === 'file' && m.fileUrl && (
                            <a
                              href={m.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-blue-300 hover:underline"
                            >
                              <File size={20} />
                              {m.fileName || 'Download File'}
                            </a>
                          )}
                          {/* Text Message */}
                          {m.text && <p className="text-sm">{m.text}</p>}

                          {/* Edited Label */}
                          {m.edited && (
                            <span className="text-xs text-[#54656f] dark:text-gray-400 italic">edited</span>
                          )}

                          {/* Pinned Indicator */}
                          {m.pinned && (
                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] bg-yellow-500 rounded-full p-0.5 ml-1">
                              <Pin size={8} className="text-[#111b21] dark:text-white" />
                            </span>
                          )}

                          {/* Reactions Display */}
                          {m.reactions && m.reactions.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {Object.entries(m.reactions.reduce((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                              }, {})).map(([emoji, count]) => (
                                <span key={emoji} className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                                  {emoji} {count > 1 && count}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Timestamp */}
                          <span className="text-xs text-gray-700 dark:text-gray-300 mt-1 block text-right">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Reaction Picker */}
                        {showReactionPicker === m._id && (
                          <div className="absolute -bottom-10 left-0 bg-[#202c33] rounded-full px-2 py-1 flex gap-1 shadow-lg z-50">
                            {REACTION_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(m._id, emoji)}
                                className="hover:scale-125 transition-transform text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Individual Chat Messages
                chats[selectedChat]?.map((m, i) => {
                  const currentUsername = localStorage.getItem('username');
                  const isMyMessage = m.fromUsername === currentUsername || m.from === me;
                  return !m.deletedForEveryone && (
                    <motion.div
                      key={i}
                      id={`msg-${m._id || i}`}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`mb-3 flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"} max-w-[70%]`}>
                        {/* Sender Name (only for received messages) */}
                        {!isMyMessage && (
                          <p className="text-xs text-[#54656f] dark:text-gray-400 mb-1 px-3">{m.fromUsername || 'Unknown'}</p>
                        )}

                        {/* Sticker Message - No bubble */}
                        {m.type === 'sticker' && m.fileUrl ? (
                          <div
                            onContextMenu={(e) => handleContextMenu(e, m, i)}
                            className="cursor-pointer"
                          >
                            <img
                              src={m.fileUrl}
                              alt="Sticker"
                              className="w-32 h-32 object-contain"
                            />
                          </div>
                        ) : (
                          <div
                            onContextMenu={(e) => handleContextMenu(e, m, i)}
                            className={`p-3 rounded-lg cursor-pointer break-words relative ${isMyMessage
                              ? "bg-green-600 text-white rounded-br-none"
                              : "bg-[#202c33] text-[#111b21] dark:text-white rounded-bl-none"
                              }`}
                          >
                            {/* Reply Quote — show original message that was replied to */}
                            {m.replyTo && (
                              <div className={`flex items-start gap-1 rounded-lg p-2 mb-2 border-l-4 cursor-pointer ${isMyMessage
                                ? 'bg-green-700/50 border-green-300'
                                : 'bg-[#2a3942] border-green-500'
                                }`}
                                onClick={() => {
                                  // Scroll to the original message if possible
                                  const el = document.getElementById(`msg-${m.replyTo._id || m.replyTo}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                              >
                                <div className="min-w-0">
                                  <p className="text-green-400 text-xs font-semibold mb-0.5 truncate">
                                    {m.replyTo.fromUsername || 'Unknown'}
                                  </p>
                                  <p className="text-gray-700 dark:text-gray-300 text-xs truncate">
                                    {m.replyTo.type === 'image' ? '📷 Photo' : m.replyTo.type === 'file' ? '📎 File' : m.replyTo.type === 'sticker' ? '🎨 Sticker' : (m.replyTo.text || '')}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Forwarded Label */}
                            {m.forwarded && (
                              <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 mb-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="15 17 20 12 15 7"></polyline>
                                  <path d="M4 18v-2a4 4 0 0 1 4-4h12"></path>
                                </svg>
                                <span className="italic">Forwarded</span>
                              </div>
                            )}
                            {/* Image Message */}
                            {m.type === 'image' && m.fileUrl && (
                              <img
                                src={m.fileUrl}
                                alt="Shared"
                                className="max-w-full rounded mb-2 max-h-60 object-cover"
                              />
                            )}
                            {/* File Message */}
                            {m.type === 'file' && m.fileUrl && (
                              <a
                                href={m.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-blue-300 hover:underline"
                              >
                                <File size={20} />
                                {m.fileName || 'Download File'}
                              </a>
                            )}
                            {/* Text Message */}
                            {m.text && <p className="text-sm">{m.text}</p>}

                            {/* Message Status (ticks) - only for sent messages */}
                            {isMyMessage && (
                              <span className="absolute bottom-1 right-2 flex items-center ml-2">
                                {/* Single tick (sent) or Double tick (delivered/read) */}
                                {m.read ? (
                                  // Blue double tick (read)
                                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.5 2.5L6 8L4 6" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15 2.5L9.5 8" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7 2.5L1.5 8" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : m.delivered ? (
                                  // Gray double tick (delivered)
                                  <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.5 2.5L6 8L4 6" stroke="#8696a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15 2.5L9.5 8" stroke="#8696a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7 2.5L1.5 8" stroke="#8696a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : m.sent ? (
                                  // Single tick (sent)
                                  <svg width="8" height="11" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 5.5L3 7.5L7 2.5" stroke="#8696a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  // Default single tick
                                  <svg width="8" height="11" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 5.5L3 7.5L7 2.5" stroke="#8696a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className={`text-xs text-gray-500 mt-1 px-3 ${isMyMessage ? "text-right" : "text-left"}`}>
                          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Context Menu */}
            {contextMenu.show && (
              <div
                className="fixed bg-[#202c33] rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 py-1 z-50 min-w-[120px] max-w-[160px]"
                style={{
                  left: Math.min(contextMenu.x, window.innerWidth - 170),
                  top: Math.min(contextMenu.y, window.innerHeight - 150)
                }}
              >
                <button
                  onClick={() => {
                    setReplyToMessage(contextMenu.message);
                    setContextMenu({ show: false, x: 0, y: 0, message: null, messageIndex: null });
                  }}
                  className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
                >
                  <Reply size={14} />
                  Reply
                </button>
                <button
                  onClick={() => {
                    toggleStarMessage(contextMenu.message._id, selectedChat.startsWith('group_'));
                    setContextMenu({ show: false, x: 0, y: 0, message: null, messageIndex: null });
                  }}
                  className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
                >
                  <Star size={14} className={contextMenu.message?.starred ? "text-yellow-400" : ""} />
                  {contextMenu.message?.starred ? 'Unstar' : 'Star'}
                </button>
                <button
                  onClick={() => copyMessage(contextMenu.message.text)}
                  className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
                >
                  <Copy size={14} />
                  {copiedMessage === contextMenu.message?.text ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => {
                    setMessageToForward(contextMenu.message);
                    setShowForwardModal(true);
                    setForwardingChats([]);
                    setContextMenu({ show: false, x: 0, y: 0, message: null, messageIndex: null });
                  }}
                  className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 17 20 12 15 7"></polyline>
                    <path d="M4 18v-2a4 4 0 0 1 4-4h12"></path>
                  </svg>
                  Forward
                </button>
                {(contextMenu.message?.fromUsername === localStorage.getItem('username') || contextMenu.message?.from === me) && (
                  <>
                    <button
                      onClick={() => {
                        startEditingMessage(contextMenu.message);
                        setContextMenu({ show: false, x: 0, y: 0, message: null, messageIndex: null });
                      }}
                      className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        togglePinMessage(contextMenu.message._id);
                        setContextMenu({ show: false, x: 0, y: 0, message: null, messageIndex: null });
                      }}
                      className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
                    >
                      <Pin size={14} className={contextMenu.message?.pinned ? "text-yellow-400" : ""} />
                      {contextMenu.message?.pinned ? 'Unpin' : 'Pin'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteMessageForMe(contextMenu.message, contextMenu.messageIndex)}
                  className="w-full px-3 py-2 text-left text-[#111b21] dark:text-white hover:bg-[#2a3942] flex items-center gap-2 text-sm"
                >
                  <Trash2 size={14} />
                  Delete for me
                </button>
                {(contextMenu.message?.fromUsername === localStorage.getItem('username') || contextMenu.message?.from === me) && (
                  <button
                    onClick={() => deleteMessageForEveryone(contextMenu.message, contextMenu.messageIndex)}
                    className="w-full px-3 py-2 text-left text-red-400 hover:bg-[#2a3942] flex items-center gap-2 text-sm"
                  >
                    <Trash2 size={14} />
                    Delete for all
                  </button>
                )}
              </div>
            )}

            {/* File Upload Modal */}
            {showFileUpload && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-[#202c33] p-4 sm:p-6 rounded-xl w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[#111b21] dark:text-white text-base sm:text-lg">Attach File</h3>
                    <X className="text-[#54656f] dark:text-gray-400 cursor-pointer hover:text-[#111b21] dark:text-white" onClick={() => setShowFileUpload(false)} />
                  </div>

                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.txt,.mp3,.mp4"
                    className="w-full text-[#111b21] dark:text-white mb-4 text-sm"
                  />

                  {filePreview && (
                    <img src={filePreview} alt="Preview" className="w-full h-32 sm:h-40 object-cover rounded mb-4" />
                  )}

                  {selectedFile && (
                    <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-4 truncate">{selectedFile.name}</p>
                  )}

                  <button
                    onClick={uploadFile}
                    disabled={!selectedFile || uploadingFile}
                    className="w-full bg-green-600 p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white font-semibold disabled:opacity-50 text-sm sm:text-base"
                  >
                    {uploadingFile ? 'Uploading...' : 'Send File'}
                  </button>
                </div>
              </div>
            )}

            {/* GIF Picker Modal */}
            {showGifPicker && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-[#202c33] p-4 sm:p-6 rounded-xl w-full max-w-md max-h-96 overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[#111b21] dark:text-white text-base sm:text-lg">Search GIFs</h3>
                    <X className="text-[#54656f] dark:text-gray-400 cursor-pointer hover:text-[#111b21] dark:text-white" onClick={() => { setShowGifPicker(false); setGifs([]); setGifSearch(''); }} />
                  </div>

                  <input
                    type="text"
                    placeholder="Search GIFs..."
                    value={gifSearch}
                    onChange={(e) => { setGifSearch(e.target.value); searchGifs(e.target.value); }}
                    className="w-full bg-[#2a3942] p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none mb-4 text-sm sm:text-base"
                  />

                  <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-48 sm:max-h-60">
                    {gifs.map((gif) => (
                      <img
                        key={gif.id}
                        src={gif.images.fixed_height.url}
                        alt={gif.title}
                        className="w-full h-20 sm:h-24 object-cover rounded cursor-pointer hover:opacity-80"
                        onClick={() => sendGif(gif.images.original.url)}
                      />
                    ))}
                  </div>

                  {gifs.length === 0 && gifSearch && (
                    <p className="text-[#54656f] dark:text-gray-400 text-center text-sm">No GIFs found</p>
                  )}
                </div>
              </div>
            )}

            {/* Sticker Picker Modal */}
            {showStickerPicker && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-[#202c33] p-3 sm:p-4 rounded-xl w-full max-w-[450px] max-h-[80vh] sm:max-h-[600px] overflow-hidden">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-[#111b21] dark:text-white text-base sm:text-lg">Stickers</h3>
                    <X className="text-[#54656f] dark:text-gray-400 cursor-pointer hover:text-[#111b21] dark:text-white" onClick={() => { setShowStickerPicker(false); setGifs([]); setGifSearch(''); }} />
                  </div>

                  {/* Local Sticker Packs */}
                  <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4 max-h-[40vh] sm:max-h-[350px] overflow-y-auto">
                    {Object.entries(STICKER_PACKS).map(([key, pack]) => (
                      <div key={key}>
                        <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-2">{pack.name}</p>
                        <div className="grid grid-cols-5 gap-1 sm:gap-2">
                          {pack.stickers.map((fileName) => (
                            <img
                              key={fileName}
                              src={`${API_URL}/stickers/${pack.folder}/${fileName}`}
                              alt="sticker"
                              className="w-10 h-10 sm:w-14 sm:h-14 cursor-pointer hover:bg-[#2a3942] p-1 rounded transition-transform hover:scale-110 object-contain"
                              onClick={() => {
                                if (selectedChat.startsWith('group_')) {
                                  sendGroupMessage("", "sticker", `${API_URL}/stickers/${pack.folder}/${fileName}`, "sticker");
                                } else {
                                  sendMessage("", "sticker", `${API_URL}/stickers/${pack.folder}/${fileName}`, "sticker");
                                }
                                setShowStickerPicker(false);
                              }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Search Online Stickers */}
                  <div className="border-t border-gray-300 dark:border-gray-700 pt-3 sm:pt-4">
                    <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-2">Search Online</p>
                    <input
                      type="text"
                      placeholder="Search more stickers..."
                      value={gifSearch}
                      onChange={(e) => { setGifSearch(e.target.value); searchStickers(e.target.value); }}
                      className="w-full bg-[#2a3942] p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none mb-3 text-sm sm:text-base"
                    />

                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-24 sm:max-h-32">
                      {gifs.map((sticker) => (
                        <img
                          key={sticker.id}
                          src={sticker.images.fixed_height.url}
                          alt={sticker.title}
                          className="w-full h-12 sm:h-16 object-contain rounded cursor-pointer hover:bg-[#2a3942] p-1"
                          onClick={() => sendSticker(sticker.images.original.url)}
                        />
                      ))}
                    </div>

                    {gifs.length === 0 && gifSearch && (
                      <p className="text-[#54656f] dark:text-gray-400 text-center text-xs sm:text-sm">No stickers found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 sm:bottom-20 left-0 sm:left-4 z-50">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  emojiStyle={EmojiStyle.APPLE}
                  theme="dark"
                  lazyLoadEmojis={true}
                  width={300}
                  height={350}
                  className="sm:w-[350px] sm:h-[400px]"
                />
              </div>
            )}

            {/* Reply Preview Bar — shown above input when replying */}
            {replyToMessage && (
              <div className="flex items-center gap-2 bg-[#1f2c34] border-l-4 border-green-500 px-3 py-2 mx-2 mb-1 rounded-lg">
                <Reply size={16} className="text-green-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-green-400 text-xs font-medium truncate">{replyToMessage.fromUsername}</p>
                  <p className="text-gray-700 dark:text-gray-300 text-xs truncate">
                    {replyToMessage.type === 'image' ? '📷 Photo' : replyToMessage.type === 'file' ? '📎 File' : replyToMessage.type === 'sticker' ? '🎨 Sticker' : replyToMessage.text}
                  </p>
                </div>
                <button
                  onClick={() => setReplyToMessage(null)}
                  className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Message Input Area */}
            <div className="bg-[#202c33] border-t border-gray-300 dark:border-gray-800/50 p-2 sm:p-4">
              {/* Message Input */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <button
                    className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white p-1.5 sm:p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                    onClick={() => setShowFileUpload(true)}
                  >
                    <Paperclip size={20} />
                  </button>
                  <button
                    className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white p-1.5 sm:p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile size={20} />
                  </button>
                  <button
                    className="flex text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                    onClick={() => setShowStickerPicker(true)}
                  >
                    <Sticker size={20} />
                  </button>
                </div>
                {/* Editing Message Indicator */}
                {editingMessage && (
                  <div className="flex items-center gap-2 bg-yellow-600/20 px-3 py-1.5 rounded-lg mb-1">
                    <Edit size={14} className="text-yellow-400" />
                    <span className="text-yellow-400 text-xs">Editing message</span>
                    <button
                      onClick={cancelEditing}
                      className="ml-auto text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <input
                  className="flex-1 bg-[#2a3942] p-1.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none text-xs sm:text-base min-w-0"
                  placeholder={editingMessage ? "Edit message..." : "Message..."}
                  value={editingMessage ? editText : message}
                  onChange={(e) => {
                    if (editingMessage) {
                      setEditText(e.target.value);
                    } else {
                      setMessage(e.target.value);
                      // Handle typing indicator
                      const currentUsername = localStorage.getItem('username');
                      const isGroupChat = selectedChat && selectedChat.startsWith('group_');

                      if (isGroupChat) {
                        // Group typing indicator
                        const groupId = selectedChat.replace('group_', '');
                        socketRef.current.emit("group_user_typing", {
                          groupId,
                          fromUsername: currentUsername,
                          isTyping: true
                        });
                        // Clear existing timeout
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                        }
                        // Set new timeout to stop typing after 2 seconds
                        typingTimeoutRef.current = setTimeout(() => {
                          socketRef.current.emit("group_user_typing", {
                            groupId,
                            fromUsername: currentUsername,
                            isTyping: false
                          });
                        }, 2000);
                      } else {
                        // Individual chat typing indicator
                        if (!isTyping && selectedChat) {
                          setIsTyping(true);
                          socketRef.current.emit("typing_start", {
                            toUsername: selectedChat,
                            fromUsername: currentUsername
                          });
                        }
                        // Clear existing timeout
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                        }
                        // Set new timeout to stop typing after 2 seconds
                        typingTimeoutRef.current = setTimeout(() => {
                          setIsTyping(false);
                          if (socketRef.current) {
                            socketRef.current.emit("typing_stop", {
                              toUsername: selectedChat,
                              fromUsername: currentUsername
                            });
                          }
                        }, 2000);
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (editingMessage) {
                        saveEditedMessage();
                      } else if (selectedChat.startsWith('group_')) {
                        sendGroupMessage();
                      } else {
                        sendMessage();
                      }
                    }
                  }}
                />
                <button className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white p-1 hidden xs:block">
                  <Mic size={16} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => {
                    if (editingMessage) {
                      saveEditedMessage();
                    } else if (selectedChat.startsWith('group_')) {
                      sendGroupMessage();
                    } else {
                      sendMessage();
                    }
                  }}
                  className="bg-green-600 p-1.5 sm:p-3 rounded-full hover:bg-green-700 transition flex items-center justify-center"
                >
                  <Send size={16} className="text-white sm:w-5 sm:h-5 ml-1" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* NO CHAT SELECTED - 3D + FRAMER MOTION SCENE */
          <EmptyChatScene3D />
        )}
      </div>

      {/* Incoming Call Modal */}
      {receivingCall && !callAccepted && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            // Allow clicking outside to dismiss
            setReceivingCall(false);
            setCaller('');
          }}
        >
          <div
            className="bg-[#202c33] p-6 sm:p-8 rounded-2xl text-center w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              {callType === 'video' ? <Video size={32} className="text-[#111b21] dark:text-white sm:w-10 sm:h-10" /> : <Phone size={32} className="text-[#111b21] dark:text-white sm:w-10 sm:h-10" />}
            </div>
            <h3 className="text-[#111b21] dark:text-white text-lg sm:text-xl mb-2">
              {callType === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call'}
            </h3>
            <p className="text-[#54656f] dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">from {caller || 'Unknown'}</p>
            <div className="flex gap-4 sm:gap-6 justify-center">
              <button
                className="bg-green-600 p-3 sm:p-4 rounded-full hover:bg-green-700 transition"
                onClick={answerCall}
              >
                <Phone size={20} className="text-[#111b21] dark:text-white sm:w-6 sm:h-6" />
              </button>
              <button
                className="bg-red-600 p-3 sm:p-4 rounded-full hover:bg-red-700 transition"
                onClick={() => {
                  setReceivingCall(false);
                  setCaller('');
                }}
              >
                <Phone size={20} className="text-[#111b21] dark:text-white rotate-135 sm:w-6 sm:h-6" />
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-4">Click outside to dismiss</p>
          </div>
        </div>
      )
      }

      {/* Active Call Modal */}
      {
        callAccepted && !callEnded && (
          <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            {/* Remote Video or Avatar */}
            {callType === 'video' && isVideoEnabled ? (
              <div className="w-full h-full relative">
                <video
                  playsInline
                  ref={userVideo}
                  autoPlay
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <User size={48} className="text-[#111b21] dark:text-white sm:w-16 sm:h-16" />
                </div>
                <p className="text-[#111b21] dark:text-white text-lg sm:text-xl">{selectedChat || caller}</p>
                <p className="text-green-500 mt-2 text-sm sm:text-base">{callType === 'video' ? 'Video Call' : 'Voice Call'}</p>
              </div>
            )}

            {/* Call Controls */}
            <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 sm:gap-6">
              {/* Mute Button */}
              <button
                className={`p-3 sm:p-4 rounded-full transition ${isMuted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                onClick={() => {
                  if (stream) {
                    stream.getAudioTracks().forEach(track => {
                      track.enabled = !track.enabled;
                    });
                    setIsMuted(!isMuted);
                  }
                }}
              >
                <Mic size={20} className={`text-[#111b21] dark:text-white sm:w-6 sm:h-6 ${isMuted ? 'opacity-50' : ''}`} />
              </button>

              {/* Video Toggle (only for video calls) */}
              {callType === 'video' && (
                <button
                  className={`p-3 sm:p-4 rounded-full transition ${!isVideoEnabled ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                  onClick={() => {
                    if (stream) {
                      stream.getVideoTracks().forEach(track => {
                        track.enabled = !track.enabled;
                      });
                      setIsVideoEnabled(!isVideoEnabled);
                    }
                  }}
                >
                  <Video size={20} className={`text-[#111b21] dark:text-white sm:w-6 sm:h-6 ${!isVideoEnabled ? 'opacity-50' : ''}`} />
                </button>
              )}

              {/* End Call Button */}
              <button
                className="bg-red-600 p-3 sm:p-4 rounded-full hover:bg-red-700 transition"
                onClick={leaveCall}
              >
                <Phone size={20} className="text-[#111b21] dark:text-white rotate-135 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* My Video (small) */}
            {callType === 'video' && stream && isVideoEnabled && (
              <div className="absolute top-4 right-4 w-24 h-18 sm:w-32 sm:h-24 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
                <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )
      }

      {/* Call History View */}
      {
        view === 'history' && (
          <div className="fixed inset-0 bg-[#0b141a] z-50 flex overflow-hidden">
            <div className="w-full max-w-2xl mx-auto flex flex-col">
              <div className="p-3 sm:p-4 bg-[#202c33] flex items-center gap-3 sm:gap-4 border-b border-gray-300 dark:border-gray-700 flex-shrink-0">
                <ArrowLeft
                  className="text-[#aebac1] cursor-pointer hover:text-[#111b21] dark:text-white flex-shrink-0"
                  size={22}
                  onClick={() => setView('chat')}
                />
                <h2 className="text-[#111b21] dark:text-white text-base sm:text-lg font-medium">Call History</h2>
              </div>

              <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
                {isLoading ? (
                  <SkeletonLoader type="history" />
                ) : callHistory.length === 0 ? (
                  <p className="text-[#54656f] dark:text-gray-400 text-center text-sm">No call history yet.</p>
                ) : (
                  <div className="space-y-2">
                    {callHistory.map((log) => (
                      <div key={log._id} className="bg-[#202c33] p-3 sm:p-4 rounded-lg flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Phone size={16} className="text-[#111b21] dark:text-white sm:w-4.5 sm:h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[#111b21] dark:text-white text-sm sm:text-base truncate">{log.caller}</p>
                            <p className="text-[#54656f] dark:text-gray-400 text-xs">{new Date(log.timestamp).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-3 items-center">
                          {log.recordingUrl && (
                            <a
                              href={`${API_URL}/${log.recordingUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-400 hover:underline"
                            >
                              Play
                            </a>
                          )}

                          <button
                            onClick={() => deleteLog(log._id)}
                            className="text-red-500 hover:text-red-400 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Settings Panel */}
      {
        showSettings && (
          <div className="fixed inset-0 bg-[#f0f2f5] dark:bg-[#0b141a] z-50 flex overflow-hidden">
            <div className="w-full max-w-2xl mx-auto flex flex-col">
              <div className="p-3 sm:p-4 bg-white dark:bg-[#202c33] flex items-center gap-3 sm:gap-4 border-b border-gray-300 dark:border-gray-700 flex-shrink-0">
                <ArrowLeft
                  className="text-[#aebac1] cursor-pointer hover:text-[#111b21] dark:text-white flex-shrink-0"
                  size={22}
                  onClick={() => setShowSettings(false)}
                />
                <h2 className="text-[#111b21] dark:text-white text-base sm:text-lg font-medium">Settings</h2>
              </div>

              <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
                {/* Profile Picture Section */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <User size={18} className="sm:w-5 sm:h-5" />
                    Profile Picture
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-600 rounded-full overflow-hidden flex-shrink-0 relative">
                      {profilePicture ? (
                        <>
                          <img
                            src={profilePicture}
                            alt="Profile"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="absolute inset-0 items-center justify-center hidden">
                            <User className="text-[#111b21] dark:text-white" size={48} />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="text-[#111b21] dark:text-white" size={48} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full sm:w-auto">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const token = localStorage.getItem('token');
                              const res = await axios.post(`${API_URL}/api/upload-profile-picture`, formData, {
                                headers: {
                                  Authorization: `Bearer ${token}`
                                }
                              });
                              setProfilePicture(res.data.profilePicture);
                              // Also update contacts list to reflect new profile picture
                              loadContacts();
                              alert('Profile picture updated!');
                            } catch (err) {
                              console.error('Error uploading profile picture:', err);
                              alert('Failed to upload profile picture');
                            }
                          }
                        }}
                        className="hidden"
                        id="profile-picture-input"
                      />
                      <label
                        htmlFor="profile-picture-input"
                        className="bg-green-600 p-2 px-4 rounded-lg text-[#111b21] dark:text-white text-sm cursor-pointer hover:bg-green-700 transition inline-block text-center"
                      >
                        Change Photo
                      </label>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    QR Code
                  </h3>
                  <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-3">
                    Share your QR code to let others add you as a contact easily
                  </p>
                  <button
                    onClick={async () => {
                      setShowQRModal(true);
                      try {
                        const token = localStorage.getItem('token');
                        const res = await axios.get(`${API_URL}/api/qr-code`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        setQRCodeData(res.data);
                      } catch (err) {
                        console.error('Error generating QR code:', err);
                        setShowQRModal(false);
                      }
                    }}
                    className="w-full bg-green-600 p-2.5 rounded-lg text-[#111b21] dark:text-white text-sm hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    Show My QR Code
                  </button>
                </div>

                {/* Profile Section */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <User size={18} className="sm:w-5 sm:h-5" />
                    Profile
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Display Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                        className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-600 focus:border-green-500 mt-1 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">About</label>
                      <input
                        type="text"
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        placeholder="Hey there! I am using WhatsApp-Lite"
                        maxLength={139}
                        className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-600 focus:border-green-500 mt-1 text-sm sm:text-base"
                      />
                      <p className="text-gray-500 text-xs mt-1">{about.length}/139</p>
                    </div>
                    <div>
                      <label className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Email</label>
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-600 focus:border-green-500 mt-1 text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Phone</label>
                      <input
                        type="tel"
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="Enter your phone"
                        className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none border border-gray-300 dark:border-gray-600 focus:border-green-500 mt-1 text-sm sm:text-base"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          console.log('Updating profile, token exists:', !!token);
                          const res = await axios.post(`${API_URL}/api/update-profile`,
                            { displayName, about, email: userEmail, phoneNumber: userPhone },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          console.log('Profile update response:', res.data);
                          // Update local state with response data
                          if (res.data.user) {
                            setDisplayName(res.data.user.displayName || '');
                            setAbout(res.data.user.about || 'Hey there! I am using WhatsApp-Lite');
                            setUserEmail(res.data.user.email || '');
                            setUserPhone(res.data.user.phoneNumber || '');
                            setProfilePicture(res.data.user.profilePicture || '');
                          }
                          alert('Profile updated successfully!');
                        } catch (err) {
                          console.error('Error updating profile:', err.response?.data || err.message);
                          alert('Failed to update profile: ' + (err.response?.data?.message || err.message));
                        }
                      }}
                      className="w-full bg-green-600 p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white font-semibold hover:bg-green-700 transition text-sm sm:text-base"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>

                {/* App Theme Section */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Palette size={18} className="sm:w-5 sm:h-5" />
                    App Theme
                  </h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateTheme('dark-theme')}
                      className={`flex-1 py-2 sm:py-3 rounded-lg border-2 transition ${theme === 'dark-theme' ? 'border-green-500 bg-[#f0f2f5] dark:bg-[#2a3942]' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}
                    >
                      <div className="text-[#111b21] dark:text-white font-medium text-sm sm:text-base">Dark</div>
                    </button>
                    <button
                      onClick={() => updateTheme('light-theme')}
                      className={`flex-1 py-2 sm:py-3 rounded-lg border-2 transition ${theme === 'light-theme' ? 'border-green-500 bg-white dark:bg-[#e5ddd5]' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}`}
                    >
                      <div className={`font-medium text-sm sm:text-base ${theme === 'light-theme' ? 'text-black' : 'text-[#111b21] dark:text-white'}`}>Light</div>
                    </button>
                  </div>
                </div>

                {/* Privacy Settings Section */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Settings size={18} className="sm:w-5 sm:h-5" />
                    Privacy Settings
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Who can see my Last Seen</label>
                      <select
                        value={privacySettings.lastSeen}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, lastSeen: e.target.value }))}
                        className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white outline-none border border-gray-300 dark:border-gray-600 focus:border-green-500 mt-1 text-sm sm:text-base"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="contacts">My Contacts</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Who can see my Profile Photo</label>
                      <select
                        value={privacySettings.profilePhoto}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, profilePhoto: e.target.value }))}
                        className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white outline-none border border-gray-300 dark:border-gray-600 focus:border-green-500 mt-1 text-sm sm:text-base"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="contacts">My Contacts</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Who can see my About</label>
                      <select
                        value={privacySettings.about}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, about: e.target.value }))}
                        className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white outline-none border border-gray-300 dark:border-gray-600 focus:border-green-500 mt-1 text-sm sm:text-base"
                      >
                        <option value="everyone">Everyone</option>
                        <option value="contacts">My Contacts</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Read Receipts (Blue Ticks)</label>
                      <button
                        onClick={() => setPrivacySettings(prev => ({ ...prev, readReceipts: !prev.readReceipts }))}
                        className={`w-10 sm:w-12 h-5 sm:h-6 rounded-full transition ${privacySettings.readReceipts ? 'bg-green-600' : 'bg-gray-600'}`}
                      >
                        <div className={`w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full transition transform ${privacySettings.readReceipts ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          await axios.post(`${API_URL}/api/privacy-settings`, privacySettings, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          alert('Privacy settings updated!');
                        } catch (err) {
                          console.error('Error updating privacy settings:', err);
                          alert('Failed to update privacy settings');
                        }
                      }}
                      className="w-full bg-green-600 p-2.5 sm:p-3 rounded-lg text-[#111b21] dark:text-white font-semibold hover:bg-green-700 transition text-sm sm:text-base"
                    >
                      Save Privacy Settings
                    </button>
                  </div>
                </div>

                {/* Block Users Section - shows all registered users */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Ban size={18} className="sm:w-5 sm:h-5" />
                    Block / Unblock Users
                  </h3>
                  {/* Blocked count */}
                  {blockedContacts.length > 0 && (
                    <p className="text-yellow-400 text-xs mb-3">
                      {blockedContacts.length} user{blockedContacts.length !== 1 ? 's' : ''} blocked
                    </p>
                  )}
                  <BlockUsersList blockedContacts={blockedContacts} setBlockedContacts={setBlockedContacts} />
                </div>

                {/* Disappearing Messages Section */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Clock size={18} className="sm:w-5 sm:h-5" />
                    Default Disappearing Messages
                  </h3>
                  <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-3">
                    Set a default timer for new chats. Messages will disappear after the selected time.
                  </p>
                  <select
                    defaultValue="0"
                    onChange={async (e) => {
                      const duration = parseInt(e.target.value);
                      try {
                        const token = localStorage.getItem('token');
                        await axios.post(`${API_URL}/api/disappearing-messages`, {
                          chatWith: '__default__',
                          duration
                        }, { headers: { Authorization: `Bearer ${token}` } });
                        alert(duration === 0 ? 'Disappearing messages turned off' : `Default set to ${e.target.options[e.target.selectedIndex].text}`);
                      } catch (err) {
                        console.error('Error setting disappearing messages:', err);
                      }
                    }}
                    className="w-full bg-[#f0f2f5] dark:bg-[#2a3942] p-2.5 rounded-lg text-[#111b21] dark:text-white outline-none border border-gray-300 dark:border-gray-600 focus:border-green-500 text-sm"
                  >
                    <option value="0">Off</option>
                    <option value="86400">24 hours</option>
                    <option value="604800">7 days</option>
                    <option value="7776000">90 days</option>
                  </select>
                </div>

                {/* Wallpaper Section */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Image size={18} className="sm:w-5 sm:h-5" />
                    Chat Wallpaper
                  </h3>
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3">
                    {Object.entries(WALLPAPERS).map(([key, className]) => (
                      <button
                        key={key}
                        onClick={() => updateWallpaper(key)}
                        className={`h-12 sm:h-16 rounded-lg ${className} border-2 transition ${wallpaper === key ? 'border-green-500' : 'border-gray-600 hover:border-gray-400'
                          }`}
                        title={(key || '').charAt(0).toUpperCase() + (key || '').slice(1)}
                      >
                        {wallpaper === key && (
                          <Check size={16} className="text-[#111b21] dark:text-white mx-auto sm:w-5 sm:h-5" />
                        )}
                      </button>
                    ))}
                  </div>
                  {/* Custom Wallpaper Upload */}
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
                    <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-2">Or upload your own wallpaper:</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          try {
                            const token = localStorage.getItem('token');
                            const formData = new FormData();
                            formData.append('file', file);
                            const res = await axios.post(`${API_URL}/api/upload-wallpaper`, formData, {
                              headers: {
                                Authorization: `Bearer ${token}`
                              }
                            });
                            setWallpaper(res.data.wallpaperUrl);
                            alert('Wallpaper updated successfully!');
                          } catch (err) {
                            console.error('Error uploading wallpaper:', err);
                            alert('Failed to upload wallpaper. Please try again.');
                          }
                        }
                      }}
                      className="hidden"
                      id="wallpaper-input"
                    />
                    <label
                      htmlFor="wallpaper-input"
                      className="bg-[#f0f2f5] dark:bg-[#2a3942] border border-gray-300 dark:border-transparent hover:bg-gray-200 dark:hover:bg-[#3d4a51] p-2 px-4 rounded-lg text-[#111b21] dark:text-white text-sm cursor-pointer transition inline-block text-center"
                    >
                      Upload Wallpaper
                    </label>
                    {wallpaper && wallpaper !== 'default' && (
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            await axios.post(`${API_URL}/api/update-wallpaper`,
                              { wallpaper: 'default' },
                              { headers: { Authorization: `Bearer ${token}` } }
                            );
                            setWallpaper('default');
                          } catch (err) {
                            console.error('Error resetting wallpaper:', err);
                          }
                        }}
                        className="ml-2 text-red-400 text-xs hover:underline"
                      >
                        Reset to default
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification Settings Section */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Bell size={18} className="sm:w-5 sm:h-5" />
                    Notification Settings
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#111b21] dark:text-white text-sm sm:text-base">In-App Sounds</p>
                        <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Play sound for incoming messages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notificationSettings.sound} onChange={(e) => toggleNotificationSetting('sound', e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#111b21] dark:text-white text-sm sm:text-base">Push Notifications</p>
                        <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Receive system notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notificationSettings.pushEnabled} onChange={(e) => toggleNotificationSetting('pushEnabled', e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#111b21] dark:text-white text-sm sm:text-base text-red-400">Mute All Notifications</p>
                        <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm">Temporarily disable all alerts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notificationSettings.muteAll} onChange={(e) => toggleNotificationSetting('muteAll', e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Export Messages Section */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
                  <h3 className="text-[#111b21] dark:text-white font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <File size={18} className="sm:w-5 sm:h-5" />
                    Export Messages
                  </h3>
                  <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-3">
                    View and search all your messages across all chats.
                  </p>
                  <button
                    onClick={fetchAllMessages}
                    className="w-full bg-green-600 hover:bg-green-700 text-[#111b21] dark:text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium transition text-sm sm:text-base"
                  >
                    View All Messages
                  </button>
                </div>

                {/* Danger Zone - Delete Account */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg border border-red-900">
                  <h3 className="text-red-600 dark:text-red-400 font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Trash2 size={18} className="sm:w-5 sm:h-5" />
                    Danger Zone
                  </h3>
                  <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-3">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={async () => {
                      const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone. All your messages, call logs, and profile data will be permanently deleted.');
                      if (confirmed) {
                        try {
                          const token = localStorage.getItem('token');
                          await axios.delete(`${API_URL}/api/delete-account`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          alert('Your account has been deleted successfully.');
                          // Clear all local storage and reload
                          localStorage.clear();
                          window.location.reload();
                        } catch (err) {
                          console.error('Error deleting account:', err);
                          alert('Failed to delete account. Please try again.');
                        }
                      }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-[#111b21] dark:text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium transition text-sm sm:text-base"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* User Profile View Modal */}
      {
        viewingUserProfile && (
          <div className="fixed inset-0 bg-[#f0f2f5] dark:bg-[#0b141a] z-50 flex overflow-hidden">
            <div className="w-full max-w-2xl mx-auto flex flex-col">
              <div className="p-3 sm:p-4 bg-white dark:bg-[#202c33] flex items-center gap-3 sm:gap-4 border-b border-gray-300 dark:border-gray-700 flex-shrink-0">
                <ArrowLeft
                  className="text-[#aebac1] cursor-pointer hover:text-[#111b21] dark:text-white flex-shrink-0"
                  size={22}
                  onClick={() => setViewingUserProfile(null)}
                />
                <h2 className="text-[#111b21] dark:text-white text-base sm:text-lg font-medium">Profile</h2>
              </div>

              <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex flex-col items-center">
                {/* Profile Picture */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-green-600 rounded-full flex items-center justify-center overflow-hidden mb-3 sm:mb-4">
                  {viewingUserProfile.profilePicture ? (
                    <>
                      <img
                        src={viewingUserProfile.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full items-center justify-center hidden">
                        <User className="text-[#111b21] dark:text-white" size={48} />
                      </div>
                    </>
                  ) : (
                    <User className="text-[#111b21] dark:text-white" size={48} />
                  )}
                </div>

                {/* Username */}
                <h3 className="text-[#111b21] dark:text-white text-xl sm:text-2xl font-medium mb-1 sm:mb-2 text-center">
                  {viewingUserProfile.displayName || viewingUserProfile.username}
                </h3>
                <p className="text-[#54656f] dark:text-gray-400 text-base sm:text-lg mb-3 sm:mb-4">@{viewingUserProfile.username}</p>

                {/* About */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg w-full max-w-md mb-3 sm:mb-4">
                  <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-1">About</p>
                  <p className="text-[#111b21] dark:text-white text-sm sm:text-base">{viewingUserProfile.about || 'No status'}</p>
                </div>

                {/* Phone/Email */}
                {viewingUserProfile.phoneNumber && (
                  <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg w-full max-w-md mb-3 sm:mb-4">
                    <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-1">Phone</p>
                    <p className="text-[#111b21] dark:text-white text-sm sm:text-base">{viewingUserProfile.phoneNumber}</p>
                  </div>
                )}

                {viewingUserProfile.email && (
                  <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg w-full max-w-md mb-3 sm:mb-4">
                    <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-1">Email</p>
                    <p className="text-[#111b21] dark:text-white text-sm sm:text-base">{viewingUserProfile.email}</p>
                  </div>
                )}

                {/* Online Status */}
                <div className="bg-white dark:bg-[#202c33] p-3 sm:p-4 rounded-lg w-full max-w-md">
                  <p className="text-[#54656f] dark:text-gray-400 text-xs sm:text-sm mb-1">Status</p>
                  <p className={`text-sm sm:text-base ${viewingUserProfile.isOnline ? "text-green-400" : "text-[#54656f] dark:text-gray-400"}`}>
                    {viewingUserProfile.isOnline ? 'Online' : viewingUserProfile.lastSeen ? `Last seen ${new Date(viewingUserProfile.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md">
                  <button
                    onClick={() => {
                      setSelectedChat(viewingUserProfile.username);
                      setChats(prev => ({ ...prev, [viewingUserProfile.username]: prev[viewingUserProfile.username] || [] }));
                      setViewingUserProfile(null);
                      setIdToCall('');
                    }}
                    className="flex-1 bg-green-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-[#111b21] dark:text-white font-medium hover:bg-green-700 transition text-sm sm:text-base"
                  >
                    Send Message
                  </button>
                  <button
                    onClick={() => callUser(viewingUserProfile.username, 'video')}
                    className="flex-1 bg-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-[#111b21] dark:text-white font-medium hover:bg-blue-700 transition text-sm sm:text-base"
                  >
                    Video Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Create Group Modal */}
      {
        showCreateGroup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#202c33] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-300 dark:border-gray-700">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-[#111b21] dark:text-white text-lg font-medium">Create New Group</h2>
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName('');
                    setNewGroupDescription('');
                    setNewGroupProfilePicture('');
                    setSelectedMembers([]);
                  }}
                  className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Group Profile Picture */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-green-600 rounded-full overflow-hidden flex-shrink-0 relative">
                    {newGroupProfilePicture ? (
                      <img
                        src={newGroupProfilePicture}
                        alt="Group"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="text-[#111b21] dark:text-white" size={32} />
                      </div>
                    )}
                  </div>
                  <label className="text-green-400 text-sm cursor-pointer hover:text-green-300">
                    {newGroupProfilePicture ? 'Change photo' : 'Add group photo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const token = localStorage.getItem('token');
                            const res = await axios.post(`${API_URL}/api/upload-file`, formData, {
                              headers: {
                                Authorization: `Bearer ${token}`
                              }
                            });
                            setNewGroupProfilePicture(res.data.fileUrl);
                          } catch (err) {
                            console.error('Error uploading group photo:', err);
                            alert('Failed to upload group photo');
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Group Name */}
                <div>
                  <label className="text-[#54656f] dark:text-gray-400 text-sm mb-1 block">Group Name *</label>
                  <input
                    type="text"
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-[#2a3942] p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-600 focus:border-green-500"
                  />
                </div>

                {/* Group Description */}
                <div>
                  <label className="text-[#54656f] dark:text-gray-400 text-sm mb-1 block">Description (optional)</label>
                  <textarea
                    placeholder="Enter group description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    className="w-full bg-[#2a3942] p-3 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-600 focus:border-green-500 resize-none"
                    rows={2}
                  />
                </div>

                {/* Select Members */}
                <div>
                  <label className="text-[#54656f] dark:text-gray-400 text-sm mb-2 block">
                    Select Members ({selectedMembers.length} selected)
                  </label>
                  <div className="bg-[#2a3942] rounded-lg border border-gray-600 max-h-48 overflow-y-auto">
                    {contacts.length === 0 ? (
                      <p className="p-3 text-[#54656f] dark:text-gray-400 text-sm text-center">No contacts available</p>
                    ) : (
                      contacts.map(contact => {
                        const currentUsername = localStorage.getItem('username');
                        if (contact.username === currentUsername) return null;

                        const isSelected = selectedMembers.includes(contact.username);
                        return (
                          <div
                            key={contact.username}
                            onClick={() => {
                              setSelectedMembers(prev =>
                                isSelected
                                  ? prev.filter(m => m !== contact.username)
                                  : [...prev, contact.username]
                              );
                            }}
                            className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-[#3d4a51] border-b border-gray-300 dark:border-gray-700 last:border-b-0 ${isSelected ? 'bg-[#00a88420]' : ''
                              }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-500'
                              }`}>
                              {isSelected && <Check size={14} className="text-[#111b21] dark:text-white" />}
                            </div>
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                              {contact.profilePicture ? (
                                <img src={contact.profilePicture} alt={contact.username} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[#111b21] dark:text-white font-medium">{(contact.username || '?').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#111b21] dark:text-white font-medium text-sm truncate">{contact.displayName || contact.username}</p>
                              <p className="text-[#54656f] dark:text-gray-400 text-xs truncate">{contact.about || 'No status'}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected Members Preview */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map(member => (
                      <span
                        key={member}
                        className="bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                      >
                        {member}
                        <button
                          onClick={() => setSelectedMembers(prev => prev.filter(m => m !== member))}
                          className="hover:text-[#111b21] dark:text-white"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName('');
                    setNewGroupDescription('');
                    setNewGroupProfilePicture('');
                    setSelectedMembers([]);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-[#111b21] dark:text-white py-2.5 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createGroup}
                  disabled={!newGroupName.trim() || selectedMembers.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-[#111b21] dark:text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Group Settings Modal */}
      {
        showGroupSettings && editingGroup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#202c33] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold">Group Settings</h2>
                <button
                  onClick={() => { setShowGroupSettings(false); setEditingGroup(null); }}
                  className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Group Profile Picture */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-[#00a884] rounded-full flex items-center justify-center overflow-hidden mb-2">
                    {editingGroup.profilePicture ? (
                      <img src={editingGroup.profilePicture} alt="Group" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="text-[#111b21] dark:text-white" size={40} />
                    )}
                  </div>
                  {editingGroup.admins?.includes(localStorage.getItem('username')) && (
                    <label className="text-green-400 text-sm cursor-pointer hover:text-green-300">
                      Change photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('file', file);
                            try {
                              const token = localStorage.getItem('token');
                              const res = await axios.post(`${API_URL}/api/upload-file`, formData, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              await updateGroupSettings(editingGroup._id, { profilePicture: res.data.fileUrl });
                            } catch (err) {
                              console.error('Error uploading group photo:', err);
                              alert('Failed to upload photo');
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Group Name */}
                <div>
                  <label className="text-[#54656f] dark:text-gray-400 text-sm">Group Name</label>
                  {editingGroup.admins?.includes(localStorage.getItem('username')) ? (
                    <input
                      type="text"
                      value={editingGroup.name || ''}
                      onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                      className="w-full bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-white p-2 rounded mt-1 border border-gray-300 dark:border-transparent"
                    />
                  ) : (
                    <p className="text-[#111b21] dark:text-white p-2">{editingGroup.name}</p>
                  )}
                </div>

                {/* Group Description */}
                <div>
                  <label className="text-[#54656f] dark:text-gray-400 text-sm">Description</label>
                  {editingGroup.admins?.includes(localStorage.getItem('username')) ? (
                    <textarea
                      value={editingGroup.description || ''}
                      onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                      className="w-full bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-white p-2 rounded mt-1 border border-gray-300 dark:border-transparent"
                      rows={2}
                    />
                  ) : (
                    <p className="text-[#111b21] dark:text-white p-2">{editingGroup.description || 'No description'}</p>
                  )}
                </div>

                {/* Theme Color */}
                {editingGroup.admins?.includes(localStorage.getItem('username')) && (
                  <div>
                    <label className="text-[#54656f] dark:text-gray-400 text-sm">Theme Color</label>
                    <div className="flex gap-2 mt-2">
                      {['#00a884', '#0086ea', '#d93900', '#00c59e', '#9b7a00', '#c73e00'].map(color => (
                        <button
                          key={color}
                          onClick={() => setEditingGroup({ ...editingGroup, theme: color })}
                          className={`w-8 h-8 rounded-full ${editingGroup.theme === color ? 'ring-2 ring-white' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Members List */}
                <div>
                  <label className="text-[#54656f] dark:text-gray-400 text-sm">Members ({editingGroup.members?.length || 0})</label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {editingGroup.members?.map(member => (
                      <div key={member} className="flex items-center justify-between bg-[#2a3942] p-2 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            {contacts.find(c => c.username === member)?.profilePicture ? (
                              <img src={contacts.find(c => c.username === member).profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User size={16} className="text-[#111b21] dark:text-white" />
                            )}
                          </div>
                          <span className="text-[#111b21] dark:text-white">{member}</span>
                          {editingGroup.admins?.includes(member) && (
                            <span className="text-xs bg-green-600 px-1.5 py-0.5 rounded text-[#111b21] dark:text-white">Admin</span>
                          )}
                        </div>
                        {editingGroup.admins?.includes(localStorage.getItem('username')) && member !== localStorage.getItem('username') && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Remove ${member} from group?`)) {
                                await removeMemberFromGroup(editingGroup._id, member);
                                setEditingGroup(prev => ({
                                  ...prev,
                                  members: prev.members.filter(m => m !== member)
                                }));
                              }
                            }}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Member (Admin only) */}
                {editingGroup.admins?.includes(localStorage.getItem('username')) && (
                  <div>
                    <label className="text-[#54656f] dark:text-gray-400 text-sm">Add Member</label>
                    <div className="flex gap-2 mt-1">
                      <select
                        id="newMemberSelect"
                        className="flex-1 bg-[#2a3942] text-[#111b21] dark:text-white p-2 rounded"
                      >
                        <option value="">Select a contact</option>
                        {contacts
                          .filter(c => !editingGroup.members?.includes(c.username))
                          .map(c => (
                            <option key={c.username} value={c.username}>{c.displayName || c.username}</option>
                          ))
                        }
                      </select>
                      <button
                        onClick={async () => {
                          const select = document.getElementById('newMemberSelect');
                          const username = select.value;
                          if (username) {
                            await addMemberToGroup(editingGroup._id, username);
                            setEditingGroup(prev => ({
                              ...prev,
                              members: [...(prev.members || []), username]
                            }));
                            select.value = '';
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-[#111b21] dark:text-white px-4 rounded"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Save Button (Admin only) */}
                {editingGroup.admins?.includes(localStorage.getItem('username')) && (
                  <button
                    onClick={async () => {
                      await updateGroupSettings(editingGroup._id, {
                        name: editingGroup.name,
                        description: editingGroup.description,
                        theme: editingGroup.theme
                      });
                      setShowGroupSettings(false);
                      setEditingGroup(null);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-[#111b21] dark:text-white py-2.5 rounded-lg font-medium"
                  >
                    Save Changes
                  </button>
                )}

                {/* Leave Group Button */}
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to leave this group?')) {
                      await leaveGroup(editingGroup._id);
                      setShowGroupSettings(false);
                      setEditingGroup(null);
                    }
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-[#111b21] dark:text-white py-2.5 rounded-lg font-medium"
                >
                  Leave Group
                </button>

                {/* Delete Group Button (Admin only) */}
                {editingGroup.admins?.includes(localStorage.getItem('username')) && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to DELETE this group? This will remove all members and delete all messages permanently. This action cannot be undone!')) {
                        await deleteGroup(editingGroup._id);
                      }
                    }}
                    className="w-full bg-red-800 hover:bg-red-900 text-[#111b21] dark:text-white py-2.5 rounded-lg font-medium border border-red-500"
                  >
                    Delete Group
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Broadcast Lists Modal */}
      {
        showBroadcasts && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#202c33] rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold">Broadcast Lists</h2>
                <button onClick={() => setShowBroadcasts(false)} className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-4 border-b border-gray-300 dark:border-gray-700">
                <button
                  onClick={async () => {
                    const name = prompt('Enter broadcast name:');
                    if (name) {
                      const recipients = contacts.map(c => c.username);
                      await createBroadcast(name, recipients);
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-[#111b21] dark:text-white py-2 rounded-lg"
                >
                  + New Broadcast
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {broadcasts.length === 0 ? (
                  <p className="text-[#54656f] dark:text-gray-400 text-center">No broadcast lists</p>
                ) : (
                  broadcasts.map((broadcast) => (
                    <div key={broadcast._id} className="bg-[#2a3942] p-3 rounded-lg mb-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-[#111b21] dark:text-white font-medium">{broadcast.name}</h3>
                          <p className="text-[#54656f] dark:text-gray-400 text-sm">{broadcast.recipients?.length || 0} recipients</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const text = prompt('Enter message to broadcast:');
                              if (text) await sendBroadcast(broadcast._id, text);
                            }}
                            className="text-green-400 hover:text-green-300 text-sm"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => { if (window.confirm('Delete broadcast?')) deleteBroadcast(broadcast._id); }}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Group Details Modal */}
      {
        showGroupDetails && groupDetails && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#202c33] rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold">Group Info</h2>
                <button onClick={() => { setShowGroupDetails(false); setGroupDetails(null); }} className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white">
                  <X size={24} />
                </button>
              </div>

              {/* Group Header */}
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex flex-col items-center">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center overflow-hidden mb-3">
                  {groupDetails.profilePicture ? (
                    <img src={groupDetails.profilePicture} alt="Group" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="text-[#111b21] dark:text-white" size={40} />
                  )}
                </div>
                <h3 className="text-[#111b21] dark:text-white text-xl font-semibold text-center">{groupDetails.name}</h3>
                {groupDetails.description && (
                  <p className="text-[#54656f] dark:text-gray-400 text-sm mt-1 text-center">{groupDetails.description}</p>
                )}
                <p className="text-green-500 text-sm mt-1">{groupDetails.members?.length || 0} members</p>
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-[#54656f] dark:text-gray-400 text-sm mb-3">Members</h4>
                <div className="space-y-2">
                  {groupDetails.members?.map((member) => {
                    const memberContact = contacts.find(c => c.username === member.username || c.username === member);
                    const isAdmin = groupDetails.admins?.includes(member.username || member);
                    const memberName = member.username || member;
                    return (
                      <div key={memberName} className="flex items-center gap-3 bg-[#2a3942] p-3 rounded-lg">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {memberContact?.profilePicture ? (
                            <img src={memberContact.profilePicture} alt={memberName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="text-[#111b21] dark:text-white" size={24} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[#111b21] dark:text-white font-medium truncate">{memberContact?.displayName || memberName}</p>
                            {isAdmin && (
                              <span className="text-xs bg-green-600 px-1.5 py-0.5 rounded text-[#111b21] dark:text-white flex-shrink-0">Admin</span>
                            )}
                          </div>
                          <p className="text-[#54656f] dark:text-gray-400 text-xs truncate">@{memberName}</p>
                          <p className="text-gray-500 text-xs truncate">{memberContact?.about || 'Hey there! I am using WhatsApp-Lite'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      }



      {/* Forward Message Modal */}
      {
        showForwardModal && messageToForward && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#202c33] rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold">Forward Message</h2>
                <button onClick={() => { setShowForwardModal(false); setMessageToForward(null); setForwardingChats([]); }} className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white">
                  <X size={24} />
                </button>
              </div>

              {/* Message Preview */}
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 bg-[#2a3942]">
                <p className="text-[#54656f] dark:text-gray-400 text-xs mb-1">Forwarding:</p>
                <div className="bg-[#0b141a] p-3 rounded-lg">
                  {messageToForward.type === 'image' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📷</span>
                      <span className="text-[#111b21] dark:text-white text-sm">Image</span>
                    </div>
                  ) : messageToForward.type === 'file' || messageToForward.type === 'audio' || messageToForward.type === 'voice' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📎</span>
                      <span className="text-[#111b21] dark:text-white text-sm">{messageToForward.fileName || 'File'}</span>
                    </div>
                  ) : (
                    <p className="text-[#111b21] dark:text-white text-sm line-clamp-3">{messageToForward.text}</p>
                  )}
                </div>
              </div>

              {/* Chat Selection */}
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-[#54656f] dark:text-gray-400 text-sm mb-3">Select chats to forward to:</p>

                {/* Recent Chats */}
                {recentChats.length > 0 && (
                  <div className="mb-4">
                    <p className="text-gray-500 text-xs uppercase mb-2">Recent</p>
                    {recentChats.map((chat) => {
                      const chatId = chat.username;
                      const isSelected = forwardingChats.includes(chatId);
                      return (
                        <div
                          key={chatId}
                          onClick={() => {
                            if (isSelected) {
                              setForwardingChats(forwardingChats.filter(c => c !== chatId));
                            } else {
                              setForwardingChats([...forwardingChats, chatId]);
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-1 ${isSelected ? 'bg-green-600/30' : 'hover:bg-[#2a3942]'}`}
                        >
                          <div className="w-10 h-10 bg-[#2a3942] rounded-full flex items-center justify-center">
                            <span className="text-[#111b21] dark:text-white text-lg">{chat.displayName?.[0] || chat.username?.[0]?.toUpperCase() || '?'}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[#111b21] dark:text-white text-sm">{chat.displayName || chat.username}</p>
                            <p className="text-[#54656f] dark:text-gray-400 text-xs">{chat.isOnline ? 'Online' : 'Offline'}</p>
                          </div>
                          {isSelected && <span className="text-green-400">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Groups */}
                {groups.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-2">Groups</p>
                    {groups.map((group) => {
                      const chatId = `group_${group._id}`;
                      const isSelected = forwardingChats.includes(chatId);
                      return (
                        <div
                          key={chatId}
                          onClick={() => {
                            if (isSelected) {
                              setForwardingChats(forwardingChats.filter(c => c !== chatId));
                            } else {
                              setForwardingChats([...forwardingChats, chatId]);
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-1 ${isSelected ? 'bg-green-600/30' : 'hover:bg-[#2a3942]'}`}
                        >
                          <div className="w-10 h-10 bg-[#2a3942] rounded-full flex items-center justify-center">
                            <span className="text-[#111b21] dark:text-white text-lg">{group.name?.[0]?.toUpperCase() || 'G'}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[#111b21] dark:text-white text-sm">{group.name}</p>
                            <p className="text-[#54656f] dark:text-gray-400 text-xs">{group.members?.length || 0} members</p>
                          </div>
                          {isSelected && <span className="text-green-400">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* All Contacts */}
                {contacts.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-500 text-xs uppercase mb-2">Contacts</p>
                    {contacts.filter(c => !recentChats.find(rc => rc.username === c.username)).map((contact) => {
                      const chatId = contact.username;
                      const isSelected = forwardingChats.includes(chatId);
                      return (
                        <div
                          key={chatId}
                          onClick={() => {
                            if (isSelected) {
                              setForwardingChats(forwardingChats.filter(c => c !== chatId));
                            } else {
                              setForwardingChats([...forwardingChats, chatId]);
                            }
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-1 ${isSelected ? 'bg-green-600/30' : 'hover:bg-[#2a3942]'}`}
                        >
                          <div className="w-10 h-10 bg-[#2a3942] rounded-full flex items-center justify-center">
                            <span className="text-[#111b21] dark:text-white text-lg">{contact.displayName?.[0] || contact.username?.[0]?.toUpperCase() || '?'}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[#111b21] dark:text-white text-sm">{contact.displayName || contact.username}</p>
                          </div>
                          {isSelected && <span className="text-green-400">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Forward Button */}
              <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                <button
                  onClick={async () => {
                    if (forwardingChats.length === 0) return;

                    const token = localStorage.getItem('token');
                    const currentUsername = localStorage.getItem('username');

                    try {
                      // Forward to each selected chat
                      for (const chatId of forwardingChats) {
                        const isGroup = chatId.startsWith('group_');
                        const recipientId = isGroup ? chatId.replace('group_', '') : chatId;

                        if (isGroup) {
                          // Forward to group
                          await axios.post(`${API_URL}/api/groups/${recipientId}/messages`, {
                            text: messageToForward.text,
                            type: messageToForward.type || 'text',
                            fileUrl: messageToForward.fileUrl,
                            fileName: messageToForward.fileName,
                            forwarded: true
                          }, { headers: { Authorization: `Bearer ${token}` } });
                        } else {
                          // Forward to individual
                          await axios.post(`${API_URL}/api/save-message`, {
                            toUsername: recipientId,
                            text: messageToForward.text,
                            type: messageToForward.type || 'text',
                            fileUrl: messageToForward.fileUrl,
                            fileName: messageToForward.fileName,
                            forwarded: true
                          }, { headers: { Authorization: `Bearer ${token}` } });
                        }
                      }

                      setShowForwardModal(false);
                      setMessageToForward(null);
                      setForwardingChats([]);
                    } catch (err) {
                      console.error('Error forwarding message:', err);
                    }
                  }}
                  disabled={forwardingChats.length === 0}
                  className={`w-full py-3 rounded-lg font-medium ${forwardingChats.length > 0 ? 'bg-green-600 hover:bg-green-700 text-[#111b21] dark:text-white' : 'bg-gray-600 text-[#54656f] dark:text-gray-400 cursor-not-allowed'}`}
                >
                  Forward to {forwardingChats.length} chat{forwardingChats.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* QR Code Modal */}
      {
        showQRModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#202c33] rounded-xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold">QR Code</h2>
                <button onClick={() => { setShowQRModal(false); setQRCodeData(null); }} className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 flex flex-col items-center">
                {qrCodeData ? (
                  <>
                    <div className="bg-[#1f2c34] p-4 rounded-xl mb-4">
                      <img src={qrCodeData.qrCode} alt="QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-[#111b21] dark:text-white font-medium text-center">{qrCodeData.displayName}</p>
                    <p className="text-[#54656f] dark:text-gray-400 text-sm">@{qrCodeData.username}</p>
                    <p className="text-gray-500 text-xs mt-4 text-center">
                      Scan this QR code to add me as a contact
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-8">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[#54656f] dark:text-gray-400">Generating QR Code...</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-300 dark:border-gray-700 flex gap-2">
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="flex-1 py-2 rounded-lg bg-[#2a3942] text-[#111b21] dark:text-white hover:bg-[#3a4952] flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                    <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                    <rect x="7" y="7" width="10" height="10" rx="1"></rect>
                  </svg>
                  Scan QR
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* QR Scanner Modal */}
      {
        showQRScanner && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#202c33] rounded-xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold">Scan QR Code</h2>
                <button onClick={() => { setShowQRScanner(false); setScannedContact(null); }} className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6">
                {scannedContact ? (
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4">
                      <User className="text-[#111b21] dark:text-white" size={40} />
                    </div>
                    <p className="text-[#111b21] dark:text-white font-medium text-lg">{scannedContact.displayName}</p>
                    <p className="text-[#54656f] dark:text-gray-400 text-sm">@{scannedContact.username}</p>
                    <p className="text-green-400 text-sm mt-2">Contact added successfully!</p>
                    <button
                      onClick={() => {
                        setScannedContact(null);
                        setShowQRScanner(false);
                      }}
                      className="mt-4 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-64 h-64 bg-[#2a3942] rounded-lg flex items-center justify-center mb-4">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#54656f] dark:text-gray-400 mx-auto mb-2">
                          <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                          <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                          <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                          <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                          <rect x="7" y="7" width="10" height="10" rx="1"></rect>
                        </svg>
                        <p className="text-[#54656f] dark:text-gray-400 text-sm">Enter username below</p>
                      </div>
                    </div>
                    <p className="text-[#54656f] dark:text-gray-400 text-sm text-center mb-4">
                      Enter the username to add as contact
                    </p>
                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Enter username"
                        className="flex-1 bg-[#2a3942] p-2 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none text-sm"
                        id="manual-username-input"
                      />
                      <button
                        onClick={async () => {
                          const input = document.getElementById('manual-username-input');
                          const username = input?.value?.trim();
                          if (!username) return;

                          try {
                            const token = localStorage.getItem('token');
                            const res = await axios.post(`${API_URL}/api/scan-qr`, {
                              qrData: JSON.stringify({
                                type: 'whatsapp-lite-contact',
                                username: username,
                                timestamp: Date.now()
                              })
                            }, { headers: { Authorization: `Bearer ${token}` } });

                            setScannedContact(res.data.contact);
                            loadContacts();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Failed to add contact');
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Status Viewer Modal */}
      {
        showStatusViewer && currentStatusUser && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Progress bars */}
            <div className="flex gap-1 p-2 absolute top-0 left-0 right-0 z-10">
              {currentStatusUser.statuses.map((status, index) => (
                <div key={status._id} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all duration-100 ${index < currentStatusIndex ? 'w-full' : index === currentStatusIndex ? 'w-0 animate-progress' : 'w-0'}`}
                    style={index === currentStatusIndex ? { animationDuration: '5s' } : {}}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 p-3 absolute top-4 left-0 right-0 z-10">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#2a3942] flex items-center justify-center">
                {currentStatusUser.profilePicture ? (
                  <img src={currentStatusUser.profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-[#54656f] dark:text-gray-400" size={20} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[#111b21] dark:text-white font-medium">{currentStatusUser.displayName}</p>
                <p className="text-[#54656f] dark:text-gray-400 text-xs">
                  {new Date(currentStatusUser.statuses[currentStatusIndex]?.createdAt).toLocaleTimeString()}
                </p>
              </div>
              {currentStatusUser.username === localStorage.getItem('username') && (
                <button
                  onClick={() => {
                    const statusId = currentStatusUser.statuses[currentStatusIndex]._id;
                    if (window.confirm('Are you sure you want to delete this status?')) {
                      deleteStatus(statusId);
                      setShowStatusViewer(false);
                      setCurrentStatusUser(null);
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-[#2a3942] hover:bg-red-500/80 flex items-center justify-center mr-2 transition-colors"
                  title="Delete Status"
                >
                  <Trash2 size={18} className="text-[#111b21] dark:text-white" />
                </button>
              )}
              <button
                onClick={() => { setShowStatusViewer(false); setCurrentStatusUser(null); }}
                className="w-10 h-10 rounded-full bg-[#2a3942] hover:bg-[#374248] flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-[#111b21] dark:text-white" />
              </button>
            </div>

            {/* Status Content */}
            <div
              className="flex-1 flex items-center justify-center"
              onClick={() => {
                if (currentStatusIndex < currentStatusUser.statuses.length - 1) {
                  const newIndex = currentStatusIndex + 1;
                  setCurrentStatusIndex(newIndex);
                  viewStatus(currentStatusUser.statuses[newIndex]._id);
                } else {
                  setShowStatusViewer(false);
                  setCurrentStatusUser(null);
                }
              }}
            >
              {currentStatusUser.statuses[currentStatusIndex]?.type === 'text' ? (
                <div
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{ backgroundColor: currentStatusUser.statuses[currentStatusIndex].backgroundColor || '#25D366' }}
                >
                  <p
                    className="text-2xl sm:text-3xl font-medium text-center"
                    style={{ color: currentStatusUser.statuses[currentStatusIndex].textColor || '#ffffff' }}
                  >
                    {currentStatusUser.statuses[currentStatusIndex].text}
                  </p>
                </div>
              ) : currentStatusUser.statuses[currentStatusIndex]?.type === 'image' ? (
                <img
                  src={currentStatusUser.statuses[currentStatusIndex].fileUrl.startsWith('http') || currentStatusUser.statuses[currentStatusIndex].fileUrl.startsWith('data:')
                    ? currentStatusUser.statuses[currentStatusIndex].fileUrl
                    : `${API_URL}${currentStatusUser.statuses[currentStatusIndex].fileUrl}`}
                  alt="Status"
                  className="max-w-full max-h-full object-contain"
                />
              ) : currentStatusUser.statuses[currentStatusIndex]?.type === 'video' ? (
                <video
                  src={currentStatusUser.statuses[currentStatusIndex].fileUrl.startsWith('http') || currentStatusUser.statuses[currentStatusIndex].fileUrl.startsWith('data:')
                    ? currentStatusUser.statuses[currentStatusIndex].fileUrl
                    : `${API_URL}${currentStatusUser.statuses[currentStatusIndex].fileUrl}`}
                  className="max-w-full max-h-full object-contain"
                  autoPlay
                  controls
                />
              ) : (
                <div className="text-[#111b21] dark:text-white">Loading...</div>
              )}
            </div>

            {/* Viewers Counter (Only for own status) */}
            {currentStatusUser.username === localStorage.getItem('username') && (
              <div
                className="absolute bottom-8 w-full flex justify-center z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchStatusViewers(currentStatusUser.statuses[currentStatusIndex]._id);
                }}
              >
                <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mb-1"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  <span className="text-white text-sm font-medium">
                    {currentStatusUser.statuses[currentStatusIndex].viewers ? currentStatusUser.statuses[currentStatusIndex].viewers.length : 0}
                  </span>
                </div>
              </div>
            )}

            {/* Viewers List Overlay */}
            {showViewersList && (
              <div
                className="absolute bottom-0 left-0 right-0 bg-[#202c33] rounded-t-2xl z-30 flex flex-col transition-transform transform translate-y-0 max-h-[70vh]"
                style={{ height: 'auto', minHeight: '40vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                  <h3 className="text-white font-medium text-lg">Viewed by {currentStatusViewers.length}</h3>
                  <button
                    onClick={() => setShowViewersList(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {currentStatusViewers.length === 0 ? (
                    <div className="flex items-center justify-center h-full mt-8">
                      <p className="text-gray-400 text-sm">No views yet</p>
                    </div>
                  ) : (
                    currentStatusViewers.map((viewer, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 hover:bg-[#2a3942] rounded-lg cursor-pointer">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                          {viewer.profilePicture ? (
                            <img src={viewer.profilePicture} alt={viewer.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="text-white" size={24} />
                          )}
                        </div>
                        <div className="flex-1 border-b border-gray-700 pb-3">
                          <p className="text-white font-medium">{viewer.displayName || viewer.username}</p>
                          <p className="text-gray-400 text-sm">@{viewer.username}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )
      }

      {/* Status Creator Modal */}
      {
        showStatusCreator && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-3 bg-black/50">
              <button onClick={() => { setShowStatusCreator(false); setStatusText(''); }} className="text-[#111b21] dark:text-white">
                <X size={24} />
              </button>
              <h2 className="text-[#111b21] dark:text-white font-medium">Create Status</h2>
            </div>

            <div className="flex-1 flex flex-col">
              <textarea
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="Type your status..."
                className="flex-1 bg-transparent text-[#111b21] dark:text-white text-2xl p-4 outline-none resize-none placeholder-gray-500"
                style={{ backgroundColor: statusBackgroundColor }}
              />

              {/* Color Options */}
              <div className="flex gap-2 p-4 overflow-x-auto">
                {['#25D366', '#1E3A5F', '#8B0000', '#4B0082', '#FF8C00', '#2F4F4F', '#000000', '#1a1a2e'].map(color => (
                  <button
                    key={color}
                    onClick={(e) => { e.stopPropagation(); setStatusBackgroundColor(color); }}
                    className={`w-8 h-8 rounded-full flex-shrink-0 ${statusBackgroundColor === color ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="p-4 flex gap-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  id="status-file-input"
                  onChange={async (e) => {
                    e.stopPropagation();
                    const file = e.target.files[0];
                    console.log('File selected:', file);
                    if (file) {
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('type', file.type.startsWith('video') ? 'video' : 'image');

                        const token = localStorage.getItem('token');
                        console.log('Uploading status...');
                        const res = await axios.post(`${API_URL}/api/status`, formData, {
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                          }
                        });

                        console.log('Status created:', res.data);
                        setShowStatusCreator(false);
                        setStatusText('');
                        fetchStatuses();
                      } catch (err) {
                        console.error('Status upload error:', err.response?.data || err.message);
                        alert('Failed to upload status: ' + (err.response?.data?.message || err.message));
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Button clicked, opening file dialog...');
                    const fileInput = document.getElementById('status-file-input');
                    if (fileInput) {
                      fileInput.click();
                    } else {
                      console.error('File input not found');
                    }
                  }}
                  className="flex-1 py-3 rounded-lg bg-[#2a3942] text-[#111b21] dark:text-white text-center cursor-pointer hover:bg-[#3a4952]"
                >
                  📷 Add Photo/Video
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!statusText.trim()) return;
                    try {
                      console.log('Creating text status...');
                      const token = localStorage.getItem('token');
                      const res = await axios.post(`${API_URL}/api/status`, {
                        type: 'text',
                        text: statusText,
                        backgroundColor: statusBackgroundColor
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });

                      console.log('Text status created:', res.data);
                      setShowStatusCreator(false);
                      setStatusText('');
                      fetchStatuses();
                    } catch (err) {
                      console.error('Status create error:', err.response?.data || err.message);
                      alert('Failed to create status: ' + (err.response?.data?.message || err.message));
                    }
                  }}
                  disabled={!statusText.trim()}
                  className={`flex-1 py-3 rounded-lg font-medium ${statusText.trim() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-600 text-[#54656f] dark:text-gray-400 cursor-not-allowed'}`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Search Messages Modal */}
      {
        showSearch && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-[#202c33] rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold">Search Messages</h2>
                <button onClick={() => setShowSearch(false)} className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="p-4 border-b border-gray-300 dark:border-gray-700">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); searchMessages(e.target.value); }}
                  className="w-full bg-[#2a3942] p-2 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none"
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {searchResults.length === 0 ? (
                  <p className="text-[#54656f] dark:text-gray-400 text-center">{searchQuery ? 'No messages found' : 'Enter a search term'}</p>
                ) : (
                  searchResults.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      className="bg-[#2a3942] p-3 rounded-lg mb-2 cursor-pointer hover:bg-[#3d4a51]"
                      onClick={() => { setSelectedChat(msg.fromUsername === localStorage.getItem('username') ? msg.toUsername : msg.fromUsername); setShowSearch(false); }}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-green-400 text-sm">{msg.fromUsername}</span>
                        <span className="text-gray-500 text-xs">{new Date(msg.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[#111b21] dark:text-white text-sm mt-1">{msg.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* All Messages Modal (Export) */}
      {
        showAllMessages && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#202c33] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold">All Messages</h2>
                <button onClick={() => { setShowAllMessages(false); setAllMessages([]); setAllMessagesSearch(''); }} className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white">
                  <X size={24} />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-300 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#54656f] dark:text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={allMessagesSearch}
                    onChange={(e) => setAllMessagesSearch(e.target.value)}
                    className="w-full bg-[#2a3942] pl-10 pr-4 py-2.5 rounded-lg text-[#111b21] dark:text-white placeholder-gray-400 outline-none border border-gray-600 focus:border-green-500"
                  />
                </div>
                <p className="text-[#54656f] dark:text-gray-400 text-xs mt-2">
                  Showing {filteredAllMessages.length} of {allMessages.length} messages
                </p>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredAllMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={48} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-[#54656f] dark:text-gray-400">
                      {allMessagesSearch ? 'No messages match your search' : 'No messages yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAllMessages.map((msg, idx) => (
                      <div
                        key={msg._id || idx}
                        className="bg-[#2a3942] p-3 rounded-lg cursor-pointer hover:bg-[#3d4a51]"
                        onClick={() => {
                          if (msg.chatId) {
                            setSelectedChat(msg.chatId);
                            setShowAllMessages(false);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 text-sm font-medium">
                              {msg.chatName || msg.fromUsername || msg.toUsername}
                            </span>
                            {msg.isGroup && (
                              <span className="text-xs bg-gray-600 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">Group</span>
                            )}
                          </div>
                          <span className="text-gray-500 text-xs">
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-[#54656f] dark:text-gray-400 text-xs">
                            {msg.fromUsername === localStorage.getItem('username') ? 'You' : msg.fromUsername}:
                          </span>
                          <p className="text-[#111b21] dark:text-white text-sm flex-1 break-words">
                            {msg.type === 'image' && '📷 Image'}
                            {msg.type === 'file' && `📎 ${msg.fileName || 'File'}`}
                            {msg.type === 'audio' && '🎤 Voice message'}
                            {msg.type === 'sticker' && '💟 Sticker'}
                            {msg.type === 'text' && msg.text}
                            {!msg.text && !msg.type && 'No message content'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Export Button */}
              {allMessages.length > 0 && (
                <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                  <button
                    onClick={() => {
                      const exportText = filteredAllMessages.map(msg =>
                        `[${new Date(msg.timestamp).toLocaleString()}] ${msg.fromUsername || msg.toUsername}: ${msg.text || msg.type || 'No content'}
`
                      ).join('\n');

                      const blob = new Blob([exportText], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `whatsapp-messages-${new Date().toISOString().split('T')[0]}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-[#111b21] dark:text-white py-2.5 rounded-lg font-medium transition"
                  >
                    Export {filteredAllMessages.length} Messages
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Starred Messages Modal */}
      {
        showStarredMessages && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[#202c33] rounded-2xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-gray-300 dark:border-gray-700/50">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700/50 flex justify-between items-center bg-[#202c33]">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold flex items-center gap-2">
                  <Star size={20} className="text-yellow-400 fill-current" />
                  Starred Messages
                </h2>
                <button onClick={() => setShowStarredMessages(false)} className="p-1 rounded-full text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white hover:bg-gray-700/50 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {starredMessages.length === 0 ? (
                  <p className="text-[#54656f] dark:text-gray-400 text-center text-sm py-8">
                    No starred messages found
                  </p>
                ) : (
                  starredMessages.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      className="bg-[#2a3942] p-3 rounded-lg mb-2 relative"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-green-400 text-sm font-medium">
                            {msg.fromUsername === localStorage.getItem('username') ? 'You' : msg.fromUsername}
                            <span className="text-[#54656f] dark:text-gray-400 font-normal mx-1"> → </span>
                            {msg.isGroup ? (
                              <span className="text-blue-400">Group: {msg.groupId?.name || 'Group'}</span>
                            ) : (
                              msg.toUsername === localStorage.getItem('username') ? 'You' : msg.toUsername
                            )}
                          </span>
                          <span className="text-gray-500 text-[10px] mt-0.5">{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleStarMessage(msg._id, !!msg.isGroup); }}
                          className="text-yellow-400 hover:text-yellow-500 transition-all p-1.5 rounded-full hover:bg-yellow-500/10"
                          title="Unstar"
                        >
                          <Star size={18} className="fill-current" />
                        </button>
                      </div>
                      <div className="mt-2 text-[#111b21] dark:text-white text-sm break-words">
                        {msg.type === 'image' && '📷 Image'}
                        {msg.type === 'file' && `📎 ${msg.fileName || 'File'}`}
                        {msg.type === 'audio' && '🎤 Voice message'}
                        {msg.type === 'sticker' && '💟 Sticker'}
                        {msg.type === 'text' && msg.text}
                        {!msg.text && !msg.type && 'No message content'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Pinned Messages Modal */}
      {
        showPinnedMessages && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[#202c33] rounded-2xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-gray-300 dark:border-gray-700/50">
              <div className="p-4 border-b border-gray-300 dark:border-gray-700/50 flex justify-between items-center bg-[#202c33]">
                <h2 className="text-[#111b21] dark:text-white text-lg font-semibold flex items-center gap-2">
                  <Pin size={20} className="text-yellow-400 fill-current" />
                  Pinned Messages
                </h2>
                <button onClick={() => setShowPinnedMessages(false)} className="p-1 rounded-full text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white hover:bg-gray-700/50 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {pinnedMessages.length === 0 ? (
                  <p className="text-[#54656f] dark:text-gray-400 text-center text-sm py-8">
                    No pinned messages found
                  </p>
                ) : (
                  pinnedMessages.map((msg, idx) => (
                    <div
                      key={msg._id || idx}
                      className="bg-[#2a3942] p-3 rounded-lg mb-2 relative cursor-pointer hover:bg-[#374248] transition-colors"
                      onClick={() => {
                        const el = document.getElementById(`msg-${msg._id}`);
                        if (el) {
                          setShowPinnedMessages(false);
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Add a brief highlight effect
                          el.classList.add('bg-gray-500/50', 'transition-colors', 'duration-1000');
                          setTimeout(() => {
                            el.classList.remove('bg-gray-500/50');
                          }, 2000);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-green-400 text-sm font-medium">
                            {msg.fromUsername === localStorage.getItem('username') ? 'You' : msg.fromUsername}
                            <span className="text-[#54656f] dark:text-gray-400 font-normal mx-1"> → </span>
                            {msg.isGroup ? (
                              <span className="text-blue-400">Group: {msg.groupId?.name || 'Group'}</span>
                            ) : (
                              msg.toUsername === localStorage.getItem('username') ? 'You' : msg.toUsername
                            )}
                          </span>
                          <span className="text-gray-500 text-[10px] mt-0.5">{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePinMessage(msg._id, !!msg.isGroup); }}
                          className="text-yellow-400 hover:text-yellow-500 transition-all p-1.5 rounded-full hover:bg-yellow-500/10"
                          title="Unpin"
                        >
                          <Pin size={18} className="fill-current" />
                        </button>
                      </div>
                      <div className="mt-2 text-[#111b21] dark:text-white text-sm break-words">
                        {msg.type === 'image' && '📷 Image'}
                        {msg.type === 'file' && `📎 ${msg.fileName || 'File'}`}
                        {msg.type === 'audio' && '🎤 Voice message'}
                        {msg.type === 'sticker' && '💟 Sticker'}
                        {msg.type === 'text' && msg.text}
                        {!msg.text && !msg.type && 'No message content'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Reply Message UI */}
      {
        replyToMessage && (
          <div className="bg-[#2a3942] p-2 flex items-center gap-2">
            <div className="w-1 h-10 bg-green-500 rounded"></div>
            <div className="flex-1">
              <p className="text-green-400 text-xs">Replying to {replyToMessage.fromUsername}</p>
              <p className="text-[#111b21] dark:text-white text-sm truncate">{replyToMessage.text || 'Media'}</p>
            </div>
            <button onClick={() => setReplyToMessage(null)} className="text-[#54656f] dark:text-gray-400 hover:text-[#111b21] dark:text-white">
              <X size={18} />
            </button>
          </div>
        )
      }
    </div >
  );
}

export default App;

