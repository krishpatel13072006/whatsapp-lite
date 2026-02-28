import React from 'react';
import { User, Users, Bell, BellOff, Pin, Search, MoreVertical } from 'lucide-react';

/**
 * Chat List Component
 * Displays list of recent chats and groups
 */
const ChatList = ({
  recentChats,
  groups,
  contacts,
  selectedChat,
  selectedGroup,
  contactsOnlineStatus,
  unreadCounts,
  mutedChats,
  mutedGroups,
  onSelectChat,
  onSelectGroup,
  onSearch,
  searchQuery,
  showOptionsMenu,
  onToggleOptionsMenu
}) => {
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours - show time
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Less than 7 days - show day name
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getLastMessage = (chat) => {
    // This would be passed from parent in real implementation
    return chat.lastMessage || 'No messages yet';
  };

  const isOnline = (username) => {
    return contactsOnlineStatus[username]?.isOnline || false;
  };

  const getUnreadCount = (username) => {
    return unreadCounts[username] || 0;
  };

  const isMuted = (id, isGroup = false) => {
    return isGroup ? mutedGroups[id] : mutedChats[id];
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21]">
      {/* Header */}
      <div className="p-3 bg-[#202c33] flex items-center justify-between">
        <h2 className="text-white text-lg font-medium">Chats</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-[#2a3942] rounded-full text-gray-400 hover:text-white">
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {onSearch && (
        <div className="p-2 bg-[#111b21]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full bg-[#202c33] text-white px-4 py-2 rounded-lg focus:outline-none"
          />
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {/* Groups Section */}
        {groups.length > 0 && (
          <div className="border-b border-gray-700">
            <div className="px-4 py-2 text-gray-400 text-sm font-medium bg-[#202c33]">
              Groups
            </div>
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => onSelectGroup(group)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#202c33] ${
                  selectedGroup?._id === group._id ? 'bg-[#2a3942]' : ''
                }`}
              >
                {/* Group Avatar */}
                <div className="relative">
                  {group.profilePicture ? (
                    <img
                      src={group.profilePicture}
                      alt={group.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center">
                      <Users size={24} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Group Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium truncate">{group.name}</h3>
                    {isMuted(group._id, true) && (
                      <BellOff size={16} className="text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-400 text-sm truncate">
                    {group.members?.length || 0} members
                  </p>
                </div>

                {/* Options Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleOptionsMenu && onToggleOptionsMenu(group._id, 'group');
                  }}
                  className="p-2 hover:bg-[#2a3942] rounded-full text-gray-400"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Direct Chats Section */}
        <div>
          <div className="px-4 py-2 text-gray-400 text-sm font-medium bg-[#202c33]">
            Direct Messages
          </div>
          {recentChats.map((chat) => {
            const contact = contacts.find(c => c.username === chat.username) || chat;
            const unread = getUnreadCount(chat.username);
            
            return (
              <div
                key={chat.username}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#202c33] ${
                  selectedChat?.username === chat.username ? 'bg-[#2a3942]' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  {contact.profilePicture ? (
                    <img
                      src={contact.profilePicture}
                      alt={contact.displayName || contact.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                      <User size={24} className="text-white" />
                    </div>
                  )}
                  {/* Online Indicator */}
                  {isOnline(chat.username) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#111b21]" />
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium truncate">
                      {contact.displayName || contact.username}
                    </h3>
                    <span className="text-gray-400 text-xs">
                      {chat.lastMessageTime && formatTime(chat.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-sm truncate">
                      {getLastMessage(chat)}
                    </p>
                    {unread > 0 && (
                      <span className="bg-[#00a884] text-white text-xs px-2 py-0.5 rounded-full">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>

                {/* Muted Indicator */}
                {isMuted(chat.username) && (
                  <BellOff size={16} className="text-gray-400" />
                )}

                {/* Options Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleOptionsMenu && onToggleOptionsMenu(chat.username, 'chat');
                  }}
                  className="p-2 hover:bg-[#2a3942] rounded-full text-gray-400"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {recentChats.length === 0 && groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <User size={48} className="mb-4" />
            <p>No chats yet</p>
            <p className="text-sm">Start a conversation by searching for users</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;