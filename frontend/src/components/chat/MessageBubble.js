import React, { useState } from 'react';
import { 
  Check, CheckCheck, Clock, Reply, Star, Trash2, Copy, 
  MoreVertical, Smile, Edit, Pin, Mic, File, Image, Play
} from 'lucide-react';

/**
 * Message Bubble Component
 * Displays individual chat messages with actions
 */
const MessageBubble = ({
  message,
  isOwn,
  showTimestamp = true,
  onReply,
  onStar,
  onDelete,
  onEdit,
  onCopy,
  onReact,
  onPin,
  showActions = true,
  previousMessage,
  nextMessage
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDate = () => {
    if (!previousMessage) return true;
    const prevDate = new Date(previousMessage.timestamp).toDateString();
    const currDate = new Date(message.timestamp).toDateString();
    return prevDate !== currDate;
  };

  const shouldGroupWithPrevious = () => {
    if (!previousMessage) return false;
    const prevTime = new Date(previousMessage.timestamp).getTime();
    const currTime = new Date(message.timestamp).getTime();
    const diffMinutes = (currTime - prevTime) / 60000;
    return previousMessage.fromUsername === message.fromUsername && diffMinutes < 5;
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      onCopy && onCopy(message.text);
    }
    setShowMenu(false);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={message.fileUrl}
              alt="Shared image"
              className="max-w-[250px] rounded-lg cursor-pointer"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
            {message.text && (
              <p className="mt-1 text-sm">{message.text}</p>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white/20 rounded-full">
              <Play size={16} />
            </button>
            <div className="flex-1">
              <div className="h-1 bg-white/30 rounded-full">
                <div className="h-1 bg-white rounded-full w-1/3" />
              </div>
              <span className="text-xs text-white/70">
                {message.audioDuration ? `${Math.floor(message.audioDuration / 60)}:${(message.audioDuration % 60).toString().padStart(2, '0')}` : '0:00'}
              </span>
            </div>
            <Mic size={16} className="text-white/70" />
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg">
            <File size={24} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName || 'File'}</p>
              <p className="text-xs text-white/70">Click to download</p>
            </div>
          </div>
        );
      
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        );
    }
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    
    const reactionCounts = message.reactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <span
            key={emoji}
            className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1"
          >
            {emoji} {count > 1 && count}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Date Separator */}
      {shouldShowDate() && (
        <div className="flex justify-center my-4">
          <span className="bg-[#182229] text-gray-400 text-xs px-3 py-1 rounded-lg">
            {formatDate(message.timestamp)}
          </span>
        </div>
      )}

      {/* Message Container */}
      <div
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
          shouldGroupWithPrevious() ? 'mt-0.5' : 'mt-2'
        }`}
      >
        <div
          className={`relative max-w-[70%] ${
            isOwn 
              ? 'bg-[#005c4b] text-white' 
              : 'bg-[#202c33] text-white'
          } rounded-lg px-3 py-1.5 shadow-sm`}
        >
          {/* Reply Preview */}
          {message.replyTo && (
            <div className="mb-1 pl-2 border-l-2 border-[#00a884] text-xs text-white/70">
              <p className="font-medium">{message.replyTo.fromUsername}</p>
              <p className="truncate">{message.replyTo.text || 'Media'}</p>
            </div>
          )}

          {/* Sender Name (for group chats) */}
          {!isOwn && message.fromUsername && (
            <p className="text-xs text-[#00a884] font-medium mb-0.5">
              {message.fromUsername}
            </p>
          )}

          {/* Message Content */}
          {renderMessageContent()}

          {/* Edited Indicator */}
          {message.edited && (
            <span className="text-xs text-white/50 ml-1">edited</span>
          )}

          {/* Time and Status */}
          <div className={`flex items-center justify-end gap-1 mt-0.5 ${isOwn ? '' : 'justify-start'}`}>
            {message.starred && (
              <Star size={12} className="text-white/50 fill-current" />
            )}
            {showTimestamp && (
              <span className="text-xs text-white/50">
                {formatTime(message.timestamp)}
              </span>
            )}
            {isOwn && (
              <span className="text-white/50">
                {message.read ? (
                  <CheckCheck size={14} className="text-[#53bdeb]" />
                ) : message.delivered ? (
                  <CheckCheck size={14} />
                ) : (
                  <Check size={14} />
                )}
              </span>
            )}
          </div>

          {/* Reactions */}
          {renderReactions()}

          {/* Actions Menu */}
          {showActions && (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`absolute top-1 ${isOwn ? 'left-[-24px]' : 'right-[-24px]'} p-1 rounded-full hover:bg-[#2a3942] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity`}
            >
              <MoreVertical size={14} />
            </button>
          )}

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className={`absolute top-full ${isOwn ? 'right-0' : 'left-0'} mt-1 bg-[#233138] rounded-lg shadow-lg py-1 z-10 min-w-[150px]`}
            >
              {onReact && (
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#182229] text-white text-sm"
                >
                  <Smile size={16} /> React
                </button>
              )}
              {onReply && (
                <button
                  onClick={() => { onReply(message); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#182229] text-white text-sm"
                >
                  <Reply size={16} /> Reply
                </button>
              )}
              {onCopy && message.text && (
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#182229] text-white text-sm"
                >
                  <Copy size={16} /> Copy
                </button>
              )}
              {onStar && (
                <button
                  onClick={() => { onStar(message); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#182229] text-white text-sm"
                >
                  <Star size={16} /> {message.starred ? 'Unstar' : 'Star'}
                </button>
              )}
              {onEdit && isOwn && message.type === 'text' && (
                <button
                  onClick={() => { onEdit(message); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#182229] text-white text-sm"
                >
                  <Edit size={16} /> Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(message); setShowMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#182229] text-red-400 text-sm"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
          )}

          {/* Reaction Picker */}
          {showReactions && (
            <div className="absolute top-full mt-1 bg-[#233138] rounded-full shadow-lg p-2 z-10 flex gap-1">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => { onReact(message, emoji); setShowReactions(false); setShowMenu(false); }}
                  className="hover:scale-125 transition-transform text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageBubble;